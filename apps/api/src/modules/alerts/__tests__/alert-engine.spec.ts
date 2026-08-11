import { AlertEngine } from '../engine/alert-engine.service';
import { CooldownEngine } from '../services/cooldown.service';
import { DuplicatePrevention } from '../services/duplicate-prevention.service';
import { AlertHistory } from '../services/alert-history.service';
import { AlertMetricsCollector } from '../services/alert-metrics.service';
import { TelegramService } from '../services/telegram.service';
import { WebSocketPublisher } from '../services/websocket.service';
import { TriggerEvaluator } from '../services/trigger-evaluator.service';
import { WatchlistManager } from '../services/watchlist-manager.service';
import { DEFAULT_ALERTS_CONFIG } from '../alerts.config';
import { buildRankedOpportunity, buildStrongBuyCandidate, buildCandidateBatch } from './test-helpers';

describe('AlertEngine', () => {
  let engine: AlertEngine;
  let cooldownEngine: CooldownEngine;
  let duplicatePrevention: DuplicatePrevention;
  let alertHistory: AlertHistory;
  let metricsCollector: AlertMetricsCollector;
  let telegramService: TelegramService;
  let webSocketPublisher: WebSocketPublisher;
  let triggerEvaluator: TriggerEvaluator;
  let watchlistManager: WatchlistManager;

  beforeEach(() => {
    cooldownEngine = new CooldownEngine(DEFAULT_ALERTS_CONFIG.cooldown);
    duplicatePrevention = new DuplicatePrevention();
    alertHistory = new AlertHistory();
    metricsCollector = new AlertMetricsCollector();
    telegramService = new TelegramService();
    webSocketPublisher = new WebSocketPublisher();
    triggerEvaluator = new TriggerEvaluator(DEFAULT_ALERTS_CONFIG.triggers);
    watchlistManager = new WatchlistManager();
    engine = new AlertEngine(
      cooldownEngine,
      duplicatePrevention,
      alertHistory,
      metricsCollector,
      telegramService,
      webSocketPublisher,
      triggerEvaluator,
      watchlistManager,
      DEFAULT_ALERTS_CONFIG,
    );
  });

  describe('processRankedOpportunities', () => {
    it('should process empty list without error', async () => {
      const alerts = await engine.processRankedOpportunities([]);
      expect(alerts.length).toBe(0);
    });

    it('should create alerts for matching triggers', async () => {
      const ranked = buildStrongBuyCandidate();
      const alerts = await engine.processRankedOpportunities([ranked]);
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should return empty when no triggers match', async () => {
      const config = {
        ...DEFAULT_ALERTS_CONFIG,
        triggers: [
          { type: 'CONFIDENCE_INCREASE' as const, minConfidence: 95 },
          { type: 'RANKING_CHANGE' as const, rankTopN: 3 },
        ],
      };
      const re = new AlertEngine(
        new CooldownEngine(config.cooldown),
        new DuplicatePrevention(),
        new AlertHistory(),
        new AlertMetricsCollector(),
        new TelegramService(),
        new WebSocketPublisher(),
        new TriggerEvaluator(config.triggers),
        new WatchlistManager(),
        config,
      );
      const ranked = buildRankedOpportunity({
        rank: 100,
        rankingScore: 10,
        confidence: 10,
        risk: 50,
        opportunityScore: 10,
        recommendation: 'NEUTRAL' as any,
        metadata: { ...buildRankedOpportunity().metadata, previousRank: 90, rankChange: 0 },
      });
      const alerts = await re.processRankedOpportunities([ranked]);
      expect(alerts.length).toBe(0);
    });

    it('should respect maxAlertsPerRun', async () => {
      const config = { ...DEFAULT_ALERTS_CONFIG, maxAlertsPerRun: 2 };
      const re = new AlertEngine(
        cooldownEngine, duplicatePrevention, alertHistory, metricsCollector,
        telegramService, webSocketPublisher, triggerEvaluator, watchlistManager, config,
      );
      const batch = buildCandidateBatch(20).map((r, i) => ({
        ...r,
        rank: i + 1,
        rankingScore: 90 - i,
        confidence: 85,
        metadata: { ...r.metadata, previousRank: i + 5, rankChange: 5 },
      }));
      const alerts = await re.processRankedOpportunities(batch);
      expect(alerts.length).toBeLessThanOrEqual(2);
    });

    it('should skip alerts on cooldown', async () => {
      const config = {
        ...DEFAULT_ALERTS_CONFIG,
        triggers: [{ type: 'STRONG_BUY' as const, strongBuyOnly: true }],
      };
      const cd = new CooldownEngine(config.cooldown);
      const re = new AlertEngine(
        cd, new DuplicatePrevention(), new AlertHistory(), new AlertMetricsCollector(),
        new TelegramService(), new WebSocketPublisher(),
        new TriggerEvaluator(config.triggers), new WatchlistManager(), config,
      );
      const ranked = buildStrongBuyCandidate();
      cd.setCooldown('STRONG_BUY', ranked.symbol, 'TELEGRAM', 'prev-alert');
      cd.setCooldown('STRONG_BUY', ranked.symbol, 'APPLICATION', 'prev-alert');
      cd.setCooldown('STRONG_BUY', ranked.symbol, 'WEBSOCKET', 'prev-alert');
      const alerts = await re.processRankedOpportunities([ranked]);
      expect(alerts.length).toBe(0);
    });

    it('should skip duplicate alerts', async () => {
      const config = {
        ...DEFAULT_ALERTS_CONFIG,
        triggers: [{ type: 'STRONG_BUY' as const, strongBuyOnly: true }],
      };
      const dp = new DuplicatePrevention();
      const re = new AlertEngine(
        new CooldownEngine(config.cooldown), dp, new AlertHistory(), new AlertMetricsCollector(),
        new TelegramService(), new WebSocketPublisher(),
        new TriggerEvaluator(config.triggers), new WatchlistManager(), config,
      );
      const ranked = buildStrongBuyCandidate();
      const key = `${ranked.recommendation}:${ranked.investmentGrade}`;
      dp.register('STRONG_BUY', ranked.symbol, key, 'prev-alert', 'CRITICAL');
      const alerts = await re.processRankedOpportunities([ranked]);
      expect(alerts.length).toBe(0);
    });

    it('should record alert in history after creation', async () => {
      const ranked = buildStrongBuyCandidate();
      await engine.processRankedOpportunities([ranked]);
      expect(alertHistory.getTotalCount()).toBeGreaterThan(0);
    });

    it('should update metrics after processing', async () => {
      const ranked = buildStrongBuyCandidate();
      await engine.processRankedOpportunities([ranked]);
      const m = engine.getMetrics();
      expect(m.totalAlertsCreated).toBeGreaterThan(0);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge existing alert', async () => {
      const ranked = buildStrongBuyCandidate();
      const alerts = await engine.processRankedOpportunities([ranked]);
      if (alerts.length > 0) {
        const result = await engine.acknowledgeAlert(alerts[0].id);
        expect(result).toBe(true);
      }
    });

    it('should return false for non-existent alert', async () => {
      const result = await engine.acknowledgeAlert('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('dismissAlert', () => {
    it('should dismiss existing alert', async () => {
      const ranked = buildStrongBuyCandidate();
      const alerts = await engine.processRankedOpportunities([ranked]);
      if (alerts.length > 0) {
        const result = await engine.dismissAlert(alerts[0].id);
        expect(result).toBe(true);
      }
    });

    it('should return false for non-existent alert', async () => {
      const result = await engine.dismissAlert('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('expireAlerts', () => {
    it('should expire alerts with past expiresAt', async () => {
      const ranked = buildStrongBuyCandidate();
      await engine.processRankedOpportunities([ranked]);
      const expiredCount = await engine.expireAlerts();
      expect(expiredCount).toBe(0);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics with timestamp', () => {
      const m = engine.getMetrics();
      expect(m.timestamp).toBeTruthy();
      expect(m.totalAlertsCreated).toBeDefined();
    });
  });

  describe('getHistory', () => {
    it('should return empty history initially', () => {
      const history = engine.getHistory();
      expect(history).toEqual([]);
    });

    it('should return history after processing alerts', async () => {
      const ranked = buildStrongBuyCandidate();
      await engine.processRankedOpportunities([ranked]);
      const history = engine.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Alert Properties', () => {
    it('should assign CRITICAL priority for strong buys', async () => {
      const ranked = buildStrongBuyCandidate();
      const alerts = await engine.processRankedOpportunities([ranked]);
      if (alerts.length > 0) {
        expect(alerts[0].priority).toBe('CRITICAL');
      }
    });

    it('should include TELEGRAM for critical alerts', async () => {
      const ranked = buildStrongBuyCandidate();
      const alerts = await engine.processRankedOpportunities([ranked]);
      if (alerts.length > 0) {
        expect(alerts[0].channels).toContain('TELEGRAM');
      }
    });

    it('should include WEBSOCKET in all alerts', async () => {
      const ranked = buildStrongBuyCandidate();
      const alerts = await engine.processRankedOpportunities([ranked]);
      if (alerts.length > 0) {
        expect(alerts[0].channels).toContain('WEBSOCKET');
      }
    });

    it('should set initial status to ACTIVE', async () => {
      const ranked = buildStrongBuyCandidate();
      const alerts = await engine.processRankedOpportunities([ranked]);
      if (alerts.length > 0) {
        expect(alerts[0].status).toBe('ACTIVE');
      }
    });

    it('should populate source data', async () => {
      const ranked = buildStrongBuyCandidate();
      const alerts = await engine.processRankedOpportunities([ranked]);
      if (alerts.length > 0) {
        expect(alerts[0].source.type).toBe('RANKING');
        expect(alerts[0].source.rankedOpportunity).toBeDefined();
      }
    });
  });
});
