import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EarlyOpportunityIntelligenceService } from '../ai-early-opportunity/early-opportunity.intelligence.service';
import { SelfLearningService } from '../ai-early-opportunity/self-learning/self-learning.service';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { LatestPriceIncrementalService } from '../market-data/incremental/latest-price-incremental.service';
import { SymbolRegistryService } from '../market-data/symbol-registry/symbol-registry.service';
import { BacktestService } from '../backtest/backtest.service';
import { CacheService } from '../../common/cache/cache.service';
import { PortfolioIntelligenceEngine } from './portfolio-intelligence.engine';
import { PortfolioIntelligenceRegistry } from './portfolio-intelligence.registry';
import {
  PORTFOLIO_INTELLIGENCE_CACHE_TTL_MS,
  PORTFOLIO_INTELLIGENCE_NAMESPACE,
  PORTFOLIO_OPPORTUNITIES_NOT_HELD_LIMIT,
} from './portfolio-intelligence.config';
import {
  PortfolioAnalysis,
  PortfolioLearning,
  PortfolioOpportunity,
  PortfolioPositionInput,
  PortfolioSnapshot,
  PositionAnalysis,
  PositionEnrichment,
  TelegramReportType,
} from './portfolio-intelligence.types';

const CACHE_KEY_ANALYSIS = 'analysis';
const CACHE_KEY_OPPORTUNITIES = 'opportunities';

@Injectable()
export class PortfolioIntelligenceService {
  private readonly logger = new Logger(PortfolioIntelligenceService.name);

  constructor(
    private readonly engine: PortfolioIntelligenceEngine,
    private readonly registry: PortfolioIntelligenceRegistry,
    private readonly earlyOpportunityIntelligenceService: EarlyOpportunityIntelligenceService,
    private readonly selfLearningService: SelfLearningService,
    private readonly latestPrice: LatestPriceIncrementalService,
    private readonly symbolRegistry: SymbolRegistryService,
    private readonly backtestService: BacktestService,
    private readonly cacheService: CacheService,
  ) {}

  // ------------------------------------------------------------------ positions

  addPosition(input: PortfolioPositionInput): StoredPortfolioPositionView {
    const stored = this.registry.upsertPosition(input);
    this.invalidateAnalysisCache();
    return this.toView(stored);
  }

  updatePosition(ticker: string, input: Partial<PortfolioPositionInput>): StoredPortfolioPositionView {
    const existing = this.registry.getPosition(ticker);
    if (!existing) {
      throw new NotFoundException(`Portföyde pozisyon bulunamadı: ${ticker}`);
    }
    const stored = this.registry.upsertPosition({
      ...existing,
      ...input,
      ticker,
    });
    this.invalidateAnalysisCache();
    return this.toView(stored);
  }

  removePosition(ticker: string): { removed: boolean; ticker: string } {
    const removed = this.registry.removePosition(ticker);
    this.invalidateAnalysisCache();
    return { removed, ticker: ticker.toUpperCase() };
  }

  listPositions(): StoredPortfolioPositionView[] {
    return this.registry.getAllPositions().map((p) => this.toView(p));
  }

  private toView(stored: {
    ticker: string;
    quantity: number;
    averageCost: number;
    currentPrice: number | null;
    manualTarget: number | null;
    manualStop: number | null;
    notes: string | null;
    portfolioWeight: number | null;
    createdAt: string;
    updatedAt: string;
  }): StoredPortfolioPositionView {
    return { ...stored };
  }

  // ------------------------------------------------------------------ analysis

  async getAnalysis(useCache = true): Promise<PortfolioAnalysis> {
    if (useCache) {
      const cached = this.cacheService.get<PortfolioAnalysis>(
        CACHE_KEY_ANALYSIS,
        PORTFOLIO_INTELLIGENCE_NAMESPACE,
      );
      if (cached) return cached;
    }

    const positions = this.registry.getAllPositions();
    const enriched = await this.enrichPositions(positions);
    const analyzed = await this.analyzePositions(enriched);
    const analysis = this.engine.analyzePortfolio(
      analyzed,
      positions.reduce((sum, p) => sum + (p.portfolioWeight ?? 0) * 0, 0),
      new Date().toISOString(),
    );

    this.saveSnapshot(analysis);
    this.cacheService.set(
      CACHE_KEY_ANALYSIS,
      analysis,
      PORTFOLIO_INTELLIGENCE_CACHE_TTL_MS,
      PORTFOLIO_INTELLIGENCE_NAMESPACE,
    );
    return analysis;
  }

  private saveSnapshot(analysis: PortfolioAnalysis): void {
    const snapshot: Omit<PortfolioSnapshot, 'id'> = {
      generatedAt: analysis.generatedAt,
      score: analysis.score,
      statusKey: analysis.statusKey,
      statusLabel: analysis.statusLabel,
      totalValue: analysis.risk.totalValue,
      positionScores: Object.fromEntries(
        analysis.positions.map((p) => [p.ticker, p.earlyOpportunityScore]),
      ),
      positionStatuses: Object.fromEntries(
        analysis.positions.map((p) => [p.ticker, p.status]),
      ),
    };
    this.registry.saveSnapshot(snapshot);
  }

  async refresh(): Promise<PortfolioAnalysis> {
    this.invalidateAnalysisCache();
    return this.getAnalysis(false);
  }

  private async enrichPositions(
    positions: { ticker: string; quantity: number; averageCost: number; currentPrice: number | null }[],
  ): Promise<PositionEnrichment[]> {
    const results: PositionEnrichment[] = [];
    for (const position of positions) {
      results.push(await this.enrichPosition(position.ticker));
    }
    return results;
  }

  private async enrichPosition(ticker: string): Promise<PositionEnrichment> {
    const normalized = ticker.toUpperCase();
    const [intelligence, priceState, symbol] = await Promise.all([
      this.earlyOpportunityIntelligenceService.getEarlyOpportunity(normalized).catch((error) => {
        this.logger.warn(`Early opportunity fetch failed for ${normalized}: ${this.errorMessage(error)}`);
        return null;
      }),
      this.latestPrice.getLatestPriceIncremental(normalized, '1d').catch(() => null),
      this.symbolRegistry.getSymbol(normalized),
    ]);

    const latestPrice = priceState?.price ?? null;
    return {
      intelligence,
      multiTimeframe: intelligence?.multiTimeframe ?? null,
      latestPrice,
      symbol: symbol ?? null,
    };
  }

  private async analyzePositions(
    enriched: PositionEnrichment[],
  ): Promise<PositionAnalysis[]> {
    const registryPositions = this.registry.getAllPositions();
    const analyses: PositionAnalysis[] = [];

    for (let i = 0; i < registryPositions.length; i += 1) {
      const position = registryPositions[i];
      const enrichment = enriched[i];
      if (!position) continue;
      analyses.push(await this.buildPositionAnalysis(position, enrichment));
    }

    const totalValue = analyses.reduce((sum, p) => sum + p.positionValue, 0);
    for (const analysis of analyses) {
      analysis.portfolioWeight = totalValue > 0 ? (analysis.positionValue / totalValue) * 100 : 0;
    }
    const sectorMap = new Map<string, number>();
    for (const analysis of analyses) {
      sectorMap.set(analysis.sector || 'Diğer', (sectorMap.get(analysis.sector || 'Diğer') ?? 0) + analysis.portfolioWeight);
    }
    for (const analysis of analyses) {
      analysis.sectorWeight = sectorMap.get(analysis.sector || 'Diğer') ?? 0;
    }

    return analyses;
  }

  private async buildPositionAnalysis(
    position: {
      ticker: string;
      quantity: number;
      averageCost: number;
      currentPrice: number | null;
      manualTarget: number | null;
      manualStop: number | null;
      notes: string | null;
      portfolioWeight: number | null;
    },
    enrichment: PositionEnrichment,
  ): Promise<PositionAnalysis> {
    const intel = enrichment.intelligence;
    const mtf = enrichment.multiTimeframe;
    const currentPrice =
      enrichment.latestPrice ??
      position.currentPrice ??
      intel?.entryZone?.max ??
      position.averageCost;

    const positionValue = position.quantity * currentPrice;
    const investedCapital = position.quantity * position.averageCost;
    const unrealizedPnl = positionValue - investedCapital;
    const unrealizedPnlPercent = investedCapital > 0 ? (unrealizedPnl / investedCapital) * 100 : 0;

    const riskScore =
      intel?.risk === 'high'
        ? 70
        : intel?.risk === 'medium'
          ? 45
          : 20;

    const classification = this.engine.classifyPositionStatus({
      pnlPercent: unrealizedPnlPercent,
      riskScore,
      earlyOpportunityScore: intel?.earlyOpportunityScore ?? 0,
      confidence: intel?.confidence ?? 0,
      smartMoneyScore: intel?.smartMoney?.score ?? null,
    });

    return {
      ticker: position.ticker.toUpperCase(),
      company: intel?.company ?? enrichment.symbol?.companyName ?? position.ticker.toUpperCase(),
      sector: intel?.sector ?? enrichment.symbol?.sector ?? 'Diğer',
      quantity: position.quantity,
      averageCost: position.averageCost,
      currentPrice: Math.round(currentPrice * 100) / 100,
      positionValue: Math.round(positionValue * 100) / 100,
      investedCapital: Math.round(investedCapital * 100) / 100,
      unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
      unrealizedPnlPercent: Math.round(unrealizedPnlPercent * 100) / 100,
      portfolioWeight: 0,
      sectorWeight: 0,
      riskLevel: intel?.risk ?? 'unknown',
      riskScore,
      eliteScore: intel?.eliteScore ?? 0,
      earlyOpportunityScore: intel?.earlyOpportunityScore ?? 0,
      earlyOpportunityLevel: intel?.earlyOpportunityLevel ?? null,
      multiTimeframeScore: mtf?.multiTimeframeScore ?? intel?.multiTimeframe?.multiTimeframeScore ?? null,
      bullishPercent: intel?.bullishPercent ?? mtf?.bullishPercent ?? 0,
      confidence: intel?.confidence ?? mtf?.confidence ?? 0,
      expectedReturn: intel?.expectedReturn ?? mtf?.expectedReturn ?? 0,
      smartMoneyScore: intel?.smartMoney?.score ?? null,
      catalystScore: intel?.catalyst?.score ?? null,
      verificationStatus: intel?.verificationStatus ?? 'unknown',
      entryZone: intel?.entryZone ?? null,
      stop: intel?.stop ?? position.manualStop ?? null,
      target1: intel?.target1 ?? position.manualTarget ?? null,
      target2: intel?.target2 ?? null,
      riskRewardRatio: intel?.riskRewardRatio ?? null,
      holdingPeriod: intel?.holdingPeriod ?? null,
      trendStage: mtf?.trendStage ?? intel?.multiTimeframe?.trendStage ?? null,
      momentum: intel?.momentum ?? mtf?.strengthLabel ?? null,
      liquidityQuality: intel?.liquidityQuality ?? null,
      status: classification.status,
      recommendation: classification.recommendation,
      recommendationReason: classification.recommendationReason,
      evaluation: this.buildEvaluationText(intel, mtf),
    };
  }

  private buildEvaluationText(
    intel: PositionEnrichment['intelligence'],
    mtf: PositionEnrichment['multiTimeframe'],
  ): string {
    const parts: string[] = [];
    if (intel?.smartMoney?.score !== undefined && intel.smartMoney.score !== null) {
      parts.push(`Smart Money skoru ${intel.smartMoney.score}`);
    }
    if (mtf?.multiTimeframeScore !== undefined && mtf?.multiTimeframeScore !== null) {
      parts.push(`MTF skoru ${mtf.multiTimeframeScore}`);
    }
    if (intel?.catalyst?.score !== undefined && intel.catalyst.score !== null) {
      parts.push(`Katalizör skoru ${intel.catalyst.score}`);
    }
    if (intel?.verificationStatus) {
      parts.push(`Doğrulama: ${intel.verificationStatus}`);
    }
    return parts.join(', ') || 'Değerlendirme verisi yetersiz.';
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  // ------------------------------------------------------------------ opportunities

  async getOpportunities(): Promise<PortfolioAnalysis['opportunities']> {
    const cached = this.cacheService.get<PortfolioAnalysis['opportunities']>(
      CACHE_KEY_OPPORTUNITIES,
      PORTFOLIO_INTELLIGENCE_NAMESPACE,
    );
    if (cached) return cached;

    const positions = this.registry.getAllPositions();
    const held = new Set(positions.map((p) => p.ticker.toUpperCase()));

    let candidates: PortfolioOpportunity[] = [];
    const top = await this.earlyOpportunityIntelligenceService
      .getEarlyOpportunities({}, { limit: PORTFOLIO_OPPORTUNITIES_NOT_HELD_LIMIT + 5 })
      .catch((error) => {
        this.logger.warn(`getEarlyOpportunities failed: ${this.errorMessage(error)}`);
        return [];
      });

    candidates = top
      .filter((r) => !held.has(r.ticker.toUpperCase()))
      .map((r) => ({
        ticker: r.ticker,
        company: r.company,
        sector: r.sector,
        earlyOpportunityScore: r.earlyOpportunityScore,
        earlyOpportunityLevel: r.earlyOpportunityLevel,
        eliteScore: r.eliteScore,
        confidence: r.confidence,
        expectedReturn: r.expectedReturn,
        riskLevel: r.risk,
        smartMoneyScore: r.smartMoney?.score ?? null,
        catalystScore: r.catalyst?.score ?? null,
        multiTimeframeScore: r.multiTimeframe?.multiTimeframeScore ?? null,
        decisionScore: r.decision?.decisionScore ?? null,
        decisionStatus: r.decision?.decisionStatus ?? null,
        earlyOpportunity: r.decision?.earlyOpportunity ?? null,
        reasons: r.reasons,
        evaluatedAt: r.evaluatedAt,
        fitsRisk: false,
        increasesConcentration: false,
        improvesDiversification: false,
        sectorOverlap: false,
      }));

    const analysis = await this.getAnalysis(true);
    const opportunities = this.engine.buildOpportunitiesSection(analysis.positions, analysis.risk, candidates);

    this.cacheService.set(
      CACHE_KEY_OPPORTUNITIES,
      opportunities,
      PORTFOLIO_INTELLIGENCE_CACHE_TTL_MS,
      PORTFOLIO_INTELLIGENCE_NAMESPACE,
    );
    return opportunities;
  }

  // ------------------------------------------------------------------ sub-reports

  async getRisk(): Promise<PortfolioAnalysis['risk']> {
    const analysis = await this.getAnalysis(true);
    return analysis.risk;
  }

  async getRebalance(): Promise<PortfolioAnalysis['rebalance']> {
    const analysis = await this.getAnalysis(true);
    return analysis.rebalance;
  }

  async getScenarios(): Promise<PortfolioAnalysis['scenarios']> {
    const analysis = await this.getAnalysis(true);
    return analysis.scenarios;
  }

  async getHistory(): Promise<PortfolioSnapshot[]> {
    return this.registry.getHistory();
  }

  async getSnapshotComparison(): Promise<import('./portfolio-intelligence.types').SnapshotComparison | null> {
    return this.registry.compareSnapshots();
  }

  // ------------------------------------------------------------------ learning

  async getLearning(): Promise<PortfolioLearning> {
    const history = this.registry.getHistory();
    const latest = this.registry.getLatestSnapshot();
    const modifiers = this.selfLearningService.getAllModifiers();
    if (!latest || history.length < 2) {
      return {
        snapshotCount: history.length,
        recommendationAccuracy: modifiers.length > 0
          ? Math.round(modifiers.reduce((sum, m) => sum + m.modifier * 100, 0) / modifiers.length * 100) / 100
          : null,
        positionClassificationAccuracy: null,
        expectedVsRealized: [],
      };
    }
    const previous = history[history.length - 2];
    const expectedVsRealized: PortfolioLearning['expectedVsRealized'] = [];
    for (const ticker of Object.keys(latest.positionScores)) {
      const realized = await this.estimateRealizedReturn(ticker).catch(() => null);
      const modifier = this.selfLearningService.getModifier(ticker);
      expectedVsRealized.push({
        ticker,
        snapshot: latest.generatedAt,
        expectedReturn: latest.positionScores[ticker] ?? 0,
        realizedReturn: realized ?? 0,
        error: realized !== null ? realized - (latest.positionScores[ticker] ?? 0) : 0,
        modifier,
      });
    }
    return {
      snapshotCount: history.length,
      recommendationAccuracy:
        modifiers.length > 0
          ? Math.round(modifiers.reduce((sum, m) => sum + m.modifier * 100, 0) / modifiers.length * 100) / 100
          : null,
      positionClassificationAccuracy:
        previous.statusKey === latest.statusKey ? 100 : 50,
      expectedVsRealized,
    };
  }

  private async estimateRealizedReturn(ticker: string): Promise<number | null> {
    try {
      const report = this.backtestService.getReport(ticker.toUpperCase(), '1d', 'indicator');
      const performance = report?.result?.performance as { winRate?: number } | undefined;
      if (performance && typeof performance.winRate === 'number') {
        return Math.round(performance.winRate * 100 * 100) / 100;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ------------------------------------------------------------------ telegram prep

  async getTelegramReport(type: TelegramReportType): Promise<string> {
    const analysis = await this.getAnalysis(true);
    const lines: string[] = [];

    if (type === 'portfolio' || type === 'portfolio-report') {
      lines.push(`📊 Portföy: ${analysis.statusLabel} (Skor: ${analysis.score})`);
      lines.push(`Toplam Değer: ${analysis.risk.totalValue.toLocaleString('tr-TR')} TL`);
      lines.push(`P&L: %${analysis.risk.unrealizedPnlPercent}`);
      lines.push(`Beklenen Getiri: %${analysis.risk.portfolioExpectedReturn}`);
    }
    if (type === 'portfolio-risk' || type === 'portfolio-report') {
      lines.push(`Risk: ${analysis.risk.portfolioRiskScore} | Diversifikasyon: ${analysis.risk.diversificationScore}`);
      for (const warning of analysis.risk.warnings.slice(0, 5)) {
        lines.push(`⚠️ ${warning}`);
      }
    }
    if (type === 'portfolio-opportunities') {
      lines.push('🎯 Fırsatlar:');
      for (const opportunity of analysis.opportunities.newOpportunities.slice(0, 5)) {
        lines.push(`• ${opportunity.ticker} (${opportunity.earlyOpportunityScore})`);
      }
    }
    if (type === 'portfolio-rebalance') {
      lines.push('⚖️ Rebalans:');
      for (const item of analysis.rebalance.slice(0, 5)) {
        lines.push(`• ${item.ticker}: %${item.currentWeight} → %${item.recommendedMin}-%${item.recommendedMax} [${item.status}]`);
      }
    }
    return lines.join('\n') || 'Portföy verisi bulunmuyor.';
  }

  private invalidateAnalysisCache(): void {
    this.cacheService.delete(CACHE_KEY_ANALYSIS, PORTFOLIO_INTELLIGENCE_NAMESPACE);
    this.cacheService.delete(CACHE_KEY_OPPORTUNITIES, PORTFOLIO_INTELLIGENCE_NAMESPACE);
  }
}

export interface StoredPortfolioPositionView {
  ticker: string;
  quantity: number;
  averageCost: number;
  currentPrice: number | null;
  manualTarget: number | null;
  manualStop: number | null;
  notes: string | null;
  portfolioWeight: number | null;
  createdAt: string;
  updatedAt: string;
}
