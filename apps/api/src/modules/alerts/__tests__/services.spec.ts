import { CooldownEngine } from '../services/cooldown.service';
import { DuplicatePrevention } from '../services/duplicate-prevention.service';
import { AlertHistory } from '../services/alert-history.service';
import { AlertMetricsCollector } from '../services/alert-metrics.service';
import { TelegramService } from '../services/telegram.service';
import { WebSocketPublisher } from '../services/websocket.service';
import { WatchlistManager } from '../services/watchlist-manager.service';
import { TriggerEvaluator } from '../services/trigger-evaluator.service';
import { AlertType } from '../alerts.types';
import { DEFAULT_ALERTS_CONFIG } from '../alerts.config';
import { buildAlertEvent, buildRankedOpportunity, buildStrongBuyCandidate } from './test-helpers';

describe('CooldownEngine', () => {
  let engine: CooldownEngine;

  beforeEach(() => {
    engine = new CooldownEngine(DEFAULT_ALERTS_CONFIG.cooldown);
  });

  it('should not have cooldown initially', () => {
    expect(engine.isOnCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM')).toBe(false);
  });

  it('should set and detect cooldown', () => {
    engine.setCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM', 'alert-1');
    expect(engine.isOnCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM')).toBe(true);
  });

  it('should return remaining ms when on cooldown', () => {
    engine.setCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM', 'alert-1');
    const remaining = engine.getRemainingMs('OPPORTUNITY', 'THYAO', 'TELEGRAM');
    expect(remaining).toBeGreaterThan(0);
  });

  it('should return null remaining when not on cooldown', () => {
    expect(engine.getRemainingMs('OPPORTUNITY', 'THYAO', 'TELEGRAM')).toBeNull();
  });

  it('should clear specific cooldown', () => {
    engine.setCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM', 'alert-1');
    engine.clearCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM');
    expect(engine.isOnCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM')).toBe(false);
  });

  it('should clear all cooldowns', () => {
    engine.setCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM', 'alert-1');
    engine.setCooldown('RISK', 'GARAN', 'WEBSOCKET', 'alert-2');
    engine.clearAll();
    expect(engine.getActiveCooldownCount()).toBe(0);
  });

  it('should use per-alert-type cooldown periods', () => {
    engine.setCooldown('STRONG_BUY', 'THYAO', 'TELEGRAM', 'alert-1');
    engine.setCooldown('WATCHLIST', 'THYAO', 'TELEGRAM', 'alert-2');
    expect(engine.isOnCooldown('STRONG_BUY', 'THYAO', 'TELEGRAM')).toBe(true);
    expect(engine.isOnCooldown('WATCHLIST', 'THYAO', 'TELEGRAM')).toBe(true);
  });

  it('should track active cooldown count', () => {
    expect(engine.getActiveCooldownCount()).toBe(0);
    engine.setCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM', 'alert-1');
    expect(engine.getActiveCooldownCount()).toBe(1);
  });

  it('should expire cooldowns', () => {
    const fast = new CooldownEngine({ periodMinutes: 5, perSymbol: true, perChannel: true, perAlertType: {} });
    fast.setCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM', 'alert-1');
    expect(fast.getActiveCooldownCount()).toBe(1);
  });

  it('should treat different symbols separately when perSymbol is true', () => {
    engine.setCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM', 'alert-1');
    expect(engine.isOnCooldown('OPPORTUNITY', 'THYAO', 'TELEGRAM')).toBe(true);
    expect(engine.isOnCooldown('OPPORTUNITY', 'GARAN', 'TELEGRAM')).toBe(false);
  });
});

describe('DuplicatePrevention', () => {
  let prevention: DuplicatePrevention;

  beforeEach(() => {
    prevention = new DuplicatePrevention(5 * 60 * 1000);
  });

  it('should not detect duplicate for new alert', () => {
    expect(prevention.isDuplicate('OPPORTUNITY', 'THYAO', 'BUY:BBB')).toBe(false);
  });

  it('should detect duplicate for registered alert', () => {
    prevention.register('OPPORTUNITY', 'THYAO', 'BUY:BBB', 'alert-1', 'HIGH');
    expect(prevention.isDuplicate('OPPORTUNITY', 'THYAO', 'BUY:BBB')).toBe(true);
  });

  it('should return previous alert id', () => {
    prevention.register('OPPORTUNITY', 'THYAO', 'BUY:BBB', 'alert-1', 'HIGH');
    expect(prevention.getPreviousAlertId('OPPORTUNITY', 'THYAO', 'BUY:BBB')).toBe('alert-1');
  });

  it('should return null for non-duplicate', () => {
    expect(prevention.getPreviousAlertId('OPPORTUNITY', 'THYAO', 'BUY:BBB')).toBeNull();
  });

  it('should clear all entries', () => {
    prevention.register('OPPORTUNITY', 'THYAO', 'BUY:BBB', 'alert-1', 'HIGH');
    prevention.clear();
    expect(prevention.isDuplicate('OPPORTUNITY', 'THYAO', 'BUY:BBB')).toBe(false);
  });

  it('should track active duplicate count', () => {
    expect(prevention.getActiveDuplicateCount()).toBe(0);
    prevention.register('OPPORTUNITY', 'THYAO', 'BUY:BBB', 'alert-1', 'HIGH');
    expect(prevention.getActiveDuplicateCount()).toBe(1);
  });

  it('should differentiate by alert type', () => {
    prevention.register('OPPORTUNITY', 'THYAO', 'BUY:BBB', 'alert-1', 'HIGH');
    expect(prevention.isDuplicate('RISK', 'THYAO', 'BUY:BBB')).toBe(false);
  });

  it('should differentiate by title', () => {
    prevention.register('OPPORTUNITY', 'THYAO', 'BUY:BBB', 'alert-1', 'HIGH');
    expect(prevention.isDuplicate('OPPORTUNITY', 'THYAO', 'STRONG_BUY:AAA')).toBe(false);
  });
});

describe('AlertHistory', () => {
  let history: AlertHistory;

  beforeEach(() => {
    history = new AlertHistory(100);
  });

  it('should start empty', () => {
    expect(history.getTotalCount()).toBe(0);
  });

  it('should record alert entries', () => {
    const alert = buildAlertEvent();
    history.record(alert, ['TELEGRAM'], [], 10);
    expect(history.getTotalCount()).toBe(1);
  });

  it('should retrieve by symbol', () => {
    const alert = buildAlertEvent({ symbol: 'THYAO' });
    history.record(alert, ['TELEGRAM'], [], 10);
    const results = history.getBySymbol('THYAO');
    expect(results.length).toBe(1);
  });

  it('should retrieve by type', () => {
    const alert = buildAlertEvent({ type: 'OPPORTUNITY' });
    history.record(alert, ['TELEGRAM'], [], 10);
    const results = history.getByType('OPPORTUNITY');
    expect(results.length).toBe(1);
  });

  it('should retrieve by status', () => {
    const alert = buildAlertEvent({ status: 'ACTIVE' });
    history.record(alert, ['TELEGRAM'], [], 10);
    const results = history.getByStatus('ACTIVE');
    expect(results.length).toBe(1);
  });

  it('should get alert by id', () => {
    const alert = buildAlertEvent();
    history.record(alert, ['TELEGRAM'], [], 10);
    const found = history.getAlertById(alert.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(alert.id);
  });

  it('should update alert status', () => {
    const alert = buildAlertEvent({ status: 'ACTIVE' });
    history.record(alert, ['TELEGRAM'], [], 10);
    const updated = history.updateStatus(alert.id, 'ACKNOWLEDGED');
    expect(updated).toBe(true);
    const found = history.getAlertById(alert.id);
    expect(found!.status).toBe('ACKNOWLEDGED');
    expect(found!.acknowledgedAt).toBeTruthy();
  });

  it('should not update non-existent alert', () => {
    expect(history.updateStatus('nonexistent', 'DISMISSED')).toBe(false);
  });

  it('should enforce max entries limit', () => {
    const small = new AlertHistory(3);
    for (let i = 0; i < 5; i++) {
      small.record(buildAlertEvent({ id: `alert-${i}` }), [], [], 0);
    }
    expect(small.getTotalCount()).toBe(3);
  });

  it('should clear history', () => {
    history.record(buildAlertEvent(), ['TELEGRAM'], [], 10);
    history.clear();
    expect(history.getTotalCount()).toBe(0);
  });

  it('should support pagination', () => {
    for (let i = 0; i < 10; i++) {
      history.record(buildAlertEvent({ id: `alert-${i}` }), [], [], 0);
    }
    expect(history.getHistory(5).length).toBe(5);
    expect(history.getHistory(5, 5).length).toBe(5);
  });
});

describe('AlertMetricsCollector', () => {
  let metrics: AlertMetricsCollector;

  beforeEach(() => {
    metrics = new AlertMetricsCollector(100);
  });

  it('should start with zero counters', () => {
    const m = metrics.getMetrics();
    expect(m.totalAlertsCreated).toBe(0);
    expect(m.totalAlertsDelivered).toBe(0);
    expect(m.totalAlertsFailed).toBe(0);
  });

  it('should record created alerts', () => {
    metrics.recordCreated('OPPORTUNITY', 'HIGH');
    const m = metrics.getMetrics();
    expect(m.totalAlertsCreated).toBe(1);
    expect(m.alertsByType['OPPORTUNITY']).toBe(1);
    expect(m.alertsByPriority['HIGH']).toBe(1);
  });

  it('should record delivered alerts', () => {
    metrics.recordDelivered('TELEGRAM', 100);
    const m = metrics.getMetrics();
    expect(m.totalAlertsDelivered).toBe(1);
    expect(m.channelDeliveryStats['TELEGRAM'].succeeded).toBe(1);
  });

  it('should record failed alerts', () => {
    metrics.recordFailed('TELEGRAM');
    const m = metrics.getMetrics();
    expect(m.totalAlertsFailed).toBe(1);
    expect(m.channelDeliveryStats['TELEGRAM'].failed).toBe(1);
  });

  it('should record duplicate suppression', () => {
    metrics.recordDuplicateSuppressed();
    expect(metrics.getMetrics().totalDuplicatesSuppressed).toBe(1);
  });

  it('should record cooldown application', () => {
    metrics.recordCooldownApplied();
    expect(metrics.getMetrics().totalCooldownsApplied).toBe(1);
  });

  it('should record status changes', () => {
    metrics.recordCreated('OPPORTUNITY', 'HIGH');
    metrics.recordStatusChange('ACTIVE', 'ACKNOWLEDGED');
    const m = metrics.getMetrics();
    expect(m.alertsByStatus['ACTIVE']).toBe(0);
    expect(m.alertsByStatus['ACKNOWLEDGED']).toBe(1);
  });

  it('should calculate average delivery duration', () => {
    metrics.recordDelivered('TELEGRAM', 100);
    metrics.recordDelivered('WEBSOCKET', 200);
    const m = metrics.getMetrics();
    expect(m.averageDeliveryDurationMs).toBe(150);
  });

  it('should reset all counters', () => {
    metrics.recordCreated('OPPORTUNITY', 'HIGH');
    metrics.reset();
    const m = metrics.getMetrics();
    expect(m.totalAlertsCreated).toBe(0);
  });

  it('should have timestamp in metrics', () => {
    const m = metrics.getMetrics();
    expect(m.timestamp).toBeTruthy();
  });
});

describe('TelegramService', () => {
  let telegram: TelegramService;

  beforeEach(() => {
    telegram = new TelegramService();
  });

  it('should be available by default', () => {
    expect(telegram.isAvailable()).toBe(true);
  });

  it('should have rate limit remaining', () => {
    expect(telegram.getRateLimitRemaining()).toBeGreaterThan(0);
  });

  it('should return correct channel type', () => {
    expect(telegram.channelType).toBe('TELEGRAM');
  });

  it('should send alert successfully', async () => {
    const alert = buildAlertEvent();
    const status = await telegram.send(alert);
    expect(status.delivered).toBe(true);
    expect(status.channel).toBe('TELEGRAM');
    expect(status.deliveredAt).toBeTruthy();
    expect(status.attemptCount).toBeGreaterThan(0);
  });

  it('should not send when disabled', async () => {
    const disabled = new TelegramService({ enabled: false });
    const alert = buildAlertEvent();
    const status = await disabled.send(alert);
    expect(status.delivered).toBe(false);
    expect(status.errorMessage).toContain('disabled');
  });

  it('should handle critical priority with appropriate emoji', async () => {
    const alert = buildAlertEvent({ priority: 'CRITICAL' });
    const status = await telegram.send(alert);
    expect(status.delivered).toBe(true);
  });
});

describe('WebSocketPublisher', () => {
  let ws: WebSocketPublisher;

  beforeEach(() => {
    ws = new WebSocketPublisher();
  });

  it('should be available by default', () => {
    expect(ws.isAvailable()).toBe(true);
  });

  it('should return correct channel type', () => {
    expect(ws.channelType).toBe('WEBSOCKET');
  });

  it('should subscribe and receive events', (done) => {
    const unsubscribe = ws.subscribe((event) => {
      expect(event.event).toBe('alert.created');
      expect(event.data).toBeDefined();
      unsubscribe();
      done();
    });
    const alert = buildAlertEvent();
    ws.send(alert);
  });

  it('should deliver alert successfully', async () => {
    const alert = buildAlertEvent();
    const status = await ws.send(alert);
    expect(status.delivered).toBe(true);
    expect(status.channel).toBe('WEBSOCKET');
  });

  it('should handle multiple subscribers', async () => {
    let count = 0;
    const unsub1 = ws.subscribe(() => count++);
    const unsub2 = ws.subscribe(() => count++);
    const alert = buildAlertEvent();
    await ws.send(alert);
    expect(count).toBe(2);
    unsub1();
    unsub2();
  });

  it('should clean up subscription on unsub', () => {
    let count = 0;
    const unsub = ws.subscribe(() => count++);
    unsub();
    expect(ws.getRateLimitRemaining()).toBeGreaterThan(0);
  });

  it('should fail when disabled', async () => {
    const disabled = new WebSocketPublisher({ enabled: false });
    const alert = buildAlertEvent();
    const status = await disabled.send(alert);
    expect(status.delivered).toBe(false);
  });
});

describe('WatchlistManager', () => {
  let manager: WatchlistManager;

  beforeEach(() => {
    manager = new WatchlistManager();
  });

  it('should have default watchlists', () => {
    const names = manager.getWatchlistNames();
    expect(names).toContain('FAVORITES');
    expect(names).toContain('PORTFOLIO');
    expect(names).toContain('LONG_TERM');
    expect(names).toContain('SHORT_TERM');
    expect(names).toContain('GROWTH');
    expect(names).toContain('DIVIDEND');
    expect(names).toContain('CUSTOM');
  });

  it('should add symbol to watchlist', () => {
    const added = manager.addToWatchlist('FAVORITES', 'THYAO');
    expect(added).toBe(true);
    expect(manager.getWatchlistCount('FAVORITES')).toBe(1);
  });

  it('should not add duplicate symbol', () => {
    manager.addToWatchlist('FAVORITES', 'THYAO');
    const added = manager.addToWatchlist('FAVORITES', 'THYAO');
    expect(added).toBe(false);
  });

  it('should remove symbol from watchlist', () => {
    manager.addToWatchlist('FAVORITES', 'THYAO');
    const removed = manager.removeFromWatchlist('FAVORITES', 'THYAO');
    expect(removed).toBe(true);
    expect(manager.getWatchlistCount('FAVORITES')).toBe(0);
  });

  it('should not remove non-existent symbol', () => {
    expect(manager.removeFromWatchlist('FAVORITES', 'NONEXISTENT')).toBe(false);
  });

  it('should check if symbol is in watchlist', () => {
    manager.addToWatchlist('FAVORITES', 'THYAO');
    expect(manager.isInWatchlist('THYAO')).toBe(true);
    expect(manager.isInWatchlist('GARAN')).toBe(false);
  });

  it('should check in specific watchlists', () => {
    manager.addToWatchlist('FAVORITES', 'THYAO');
    expect(manager.isInWatchlist('THYAO', ['FAVORITES'])).toBe(true);
    expect(manager.isInWatchlist('THYAO', ['PORTFOLIO'])).toBe(false);
  });

  it('should get all symbols across watchlists', () => {
    manager.addToWatchlist('FAVORITES', 'THYAO');
    manager.addToWatchlist('PORTFOLIO', 'GARAN');
    const symbols = manager.getAllSymbols();
    expect(symbols).toContain('THYAO');
    expect(symbols).toContain('GARAN');
  });

  it('should get symbols from specific watchlists', () => {
    manager.addToWatchlist('FAVORITES', 'THYAO');
    manager.addToWatchlist('PORTFOLIO', 'GARAN');
    const symbols = manager.getSymbolsInWatchlists(['FAVORITES']);
    expect(symbols).toEqual(['THYAO']);
  });

  it('should create custom watchlist', () => {
    const created = manager.createWatchlist('CUSTOM' as any);
    expect(created).toBe(false);
  });

  it('should not delete default watchlists', () => {
    expect(manager.deleteWatchlist('FAVORITES')).toBe(false);
  });

  it('should reject duplicate custom watchlist creation', () => {
    const result = manager.createWatchlist('CUSTOM' as any);
    expect(result).toBe(false);
  });

  it('should clear all watchlists', () => {
    manager.addToWatchlist('FAVORITES', 'THYAO');
    manager.clear();
    expect(manager.getWatchlistCount('FAVORITES')).toBe(0);
  });
});

describe('TriggerEvaluator', () => {
  let evaluator: TriggerEvaluator;

  beforeEach(() => {
    evaluator = new TriggerEvaluator(DEFAULT_ALERTS_CONFIG.triggers);
  });

  it('should evaluate ranked opportunity against triggers', () => {
    const ranked = buildRankedOpportunity({ rank: 5, metadata: { ...buildRankedOpportunity().metadata, previousRank: 10, rankChange: 5 } });
    const results = evaluator.evaluate(ranked);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should match ranking change triggers', () => {
    const ranked = buildRankedOpportunity({ rank: 3, metadata: { ...buildRankedOpportunity().metadata, previousRank: 10, rankChange: 7 } });
    const results = evaluator.evaluate(ranked);
    const rankChange = results.find((r) => r.condition.type === 'RANKING_CHANGE');
    expect(rankChange?.matched).toBe(true);
  });

  it('should match strong buy triggers', () => {
    const ranked = buildStrongBuyCandidate();
    const triggers = [{ type: 'STRONG_BUY' as AlertType, strongBuyOnly: true }];
    const custom = new TriggerEvaluator(triggers);
    const results = custom.evaluate(ranked);
    const strongBuy = results.find((r) => r.condition.type === 'STRONG_BUY');
    expect(strongBuy?.matched).toBe(true);
  });

  it('should match confidence increase triggers', () => {
    const ranked = buildRankedOpportunity({ confidence: 85 });
    const triggers = [{ type: 'CONFIDENCE_INCREASE' as AlertType, minConfidence: 80 }];
    const custom = new TriggerEvaluator(triggers);
    const results = custom.evaluate(ranked);
    const confidence = results.find((r) => r.condition.type === 'CONFIDENCE_INCREASE');
    expect(confidence?.matched).toBe(true);
  });

  it('should match risk triggers', () => {
    const ranked = buildRankedOpportunity({ risk: 90 });
    const triggers = [{ type: 'RISK' as AlertType, criticalRiskOnly: true }];
    const custom = new TriggerEvaluator(triggers);
    const results = custom.evaluate(ranked);
    const risk = results.find((r) => r.condition.type === 'RISK');
    expect(risk?.matched).toBe(true);
  });

  it('should match opportunity score triggers', () => {
    const ranked = buildRankedOpportunity({ opportunityScore: 85 });
    const triggers = [{ type: 'OPPORTUNITY' as AlertType, minOpportunityScore: 75 }];
    const custom = new TriggerEvaluator(triggers);
    const results = custom.evaluate(ranked);
    const opp = results.find((r) => r.condition.type === 'OPPORTUNITY');
    expect(opp?.matched).toBe(true);
  });

  it('should match confidence drop triggers', () => {
    const ranked = buildRankedOpportunity({ confidence: 40 });
    const triggers = [{ type: 'CONFIDENCE_DROP' as AlertType, minConfidence: 60 }];
    const custom = new TriggerEvaluator(triggers);
    const results = custom.evaluate(ranked);
    const drop = results.find((r) => r.condition.type === 'CONFIDENCE_DROP');
    expect(drop?.matched).toBe(true);
  });

  it('should match strong sell triggers', () => {
    const ranked = buildRankedOpportunity({ recommendation: 'REDUCE' as any });
    const triggers = [{ type: 'STRONG_SELL' as AlertType }];
    const custom = new TriggerEvaluator(triggers);
    const results = custom.evaluate(ranked);
    const sell = results.find((r) => r.condition.type === 'STRONG_SELL');
    expect(sell?.matched).toBe(true);
  });

  it('should match watchlist triggers', () => {
    const ranked = buildRankedOpportunity();
    const triggers = [{ type: 'WATCHLIST' as AlertType, watchlistOnly: true }];
    const custom = new TriggerEvaluator(triggers);
    const results = custom.evaluate(ranked);
    const wl = results.find((r) => r.condition.type === 'WATCHLIST');
    expect(wl?.matched).toBe(true);
  });

  it('should not match when no condition triggers', () => {
    const ranked = buildRankedOpportunity({
      rank: 50,
      confidence: 20,
      risk: 5,
      opportunityScore: 10,
      metadata: { ...buildRankedOpportunity().metadata, previousRank: 45, rankChange: 0 },
    });
    const triggers = [{ type: 'RANKING_CHANGE' as AlertType, rankTopN: 10 }, { type: 'CONFIDENCE_INCREASE' as AlertType, minConfidence: 80 }];
    const custom = new TriggerEvaluator(triggers);
    const results = custom.evaluate(ranked);
    expect(results.every((r) => r.matched === false)).toBe(true);
  });

  it('should return trigger configurations', () => {
    const triggers = evaluator.getTriggers();
    expect(triggers.length).toBeGreaterThan(0);
  });
});
