import { Injectable } from '@nestjs/common';
import {
  RecommendationRecord,
  TrackRecommendationInput,
  RecommendationHistoryQuery,
  RecommendationHistoryResult,
  SuccessAnalytics,
  PerformanceDashboard,
  RecommendationStatus,
  RecommendationOutcome,
  MarketRegime,
  RecommendationTrackerConfig,
  RECOMMENDATION_TRACKER_DEFAULTS,
  WindowPerformance,
  PriceData,
  RecommendationPerformance,
  EliteScoreAnalysis,
  AIAnalysisReview,
  StrategyPerformanceAnalysis,
  SectorPerformanceAnalysis,
  FailureAnalysis,
} from './types';
import { PerformanceEvaluationService } from './performance-evaluation.service';
import { EliteScoreAnalyzerService } from './elite-score-analyzer.service';
import { AIAnalysisReviewerService } from './ai-analysis-reviewer.service';
import { StrategyAnalyzerService } from './strategy-analyzer.service';
import { FailureAnalyzerService } from './failure-analyzer.service';
import { RecommendationReportGeneratorService } from './recommendation-report-generator.service';

@Injectable()
export class RecommendationTrackerService {
  private recommendations = new Map<string, RecommendationRecord>();
  private priceHistories = new Map<string, PriceData[]>();
  private evaluationCache = new Map<string, WindowPerformance>();
  private config: RecommendationTrackerConfig;

  constructor(
    private readonly performanceEvaluation: PerformanceEvaluationService,
    private readonly eliteScoreAnalyzer: EliteScoreAnalyzerService,
    private readonly aiAnalysisReviewer: AIAnalysisReviewerService,
    private readonly strategyAnalyzer: StrategyAnalyzerService,
    private readonly failureAnalyzer: FailureAnalyzerService,
    private readonly reportGenerator: RecommendationReportGeneratorService,
    config?: Partial<RecommendationTrackerConfig>,
  ) {
    this.config = {
      ...RECOMMENDATION_TRACKER_DEFAULTS,
      ...config,
      successThresholds: {
        ...RECOMMENDATION_TRACKER_DEFAULTS.successThresholds,
        ...config?.successThresholds,
      },
      alertThresholds: {
        ...RECOMMENDATION_TRACKER_DEFAULTS.alertThresholds,
        ...config?.alertThresholds,
      },
      metricWeights: {
        ...RECOMMENDATION_TRACKER_DEFAULTS.metricWeights,
        ...config?.metricWeights,
      },
      tracking: {
        ...RECOMMENDATION_TRACKER_DEFAULTS.tracking,
        ...config?.tracking,
      },
    };
  }

  trackRecommendation(input: TrackRecommendationInput): RecommendationRecord {
    const id = this.generateId();
    const now = new Date().toISOString();

    const record: RecommendationRecord = {
      id,
      stockSymbol: input.stockSymbol,
      stockName: input.stockName,
      status: RecommendationStatus.CREATED,
      outcome: RecommendationOutcome.PENDING,
      entryPrice: input.entryPrice,
      entryDate: now,
      entryEliteScore: input.entryEliteScore,
      entryConfidence: input.entryConfidence,
      entryConsensusScore: input.entryConsensusScore,
      strategyUsed: input.strategyUsed,
      marketRegime: input.marketRegime,
      timeframeConsensus: input.timeframeConsensus,
      sector: input.sector,
      targetPrice: input.targetPrice,
      stopLossPrice: input.stopLossPrice,
      notificationId: input.notificationId,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata,
    };

    this.recommendations.set(id, record);
    return record;
  }

  updateRecommendation(
    id: string,
    updates: Partial<RecommendationRecord>,
  ): RecommendationRecord {
    const record = this.recommendations.get(id);
    if (!record) {
      throw new RecommendationNotFoundError(id);
    }

    const updated: RecommendationRecord = {
      ...record,
      ...updates,
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.recommendations.set(id, updated);
    return updated;
  }

  closeRecommendation(
    id: string,
    exitPrice: number,
    exitReason: string,
  ): RecommendationRecord {
    const record = this.recommendations.get(id);
    if (!record) {
      throw new RecommendationNotFoundError(id);
    }

    const actualReturn = record.entryPrice > 0
      ? ((exitPrice - record.entryPrice) / record.entryPrice) * 100
      : 0;

    const outcome = actualReturn > 0.5
      ? RecommendationOutcome.WINNER
      : actualReturn < -0.5
        ? RecommendationOutcome.LOSER
        : RecommendationOutcome.BREAKEVEN;

    const updated: RecommendationRecord = {
      ...record,
      status: RecommendationStatus.FINAL_OUTCOME,
      outcome,
      exitPrice,
      exitDate: new Date().toISOString(),
      exitReason,
      actualReturn,
      holdingPeriodDays: this.calculateHoldingDays(record.entryDate),
      updatedAt: new Date().toISOString(),
    };

    this.recommendations.set(id, updated);
    return updated;
  }

  getRecommendation(id: string): RecommendationRecord | undefined {
    return this.recommendations.get(id);
  }

  getRecommendations(query: RecommendationHistoryQuery): RecommendationHistoryResult {
    const all = Array.from(this.recommendations.values());
    const filtered = all.filter(rec => this.matchesQuery(rec, query));

    const sorted = filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const paged = sorted.slice(offset, offset + limit);

    return {
      recommendations: paged,
      total: sorted.length,
      hasMore: offset + limit < sorted.length,
    };
  }

  getRecommendationHistory(stockSymbol?: string): RecommendationRecord[] {
    const all = Array.from(this.recommendations.values());
    if (stockSymbol) {
      return all.filter(r => r.stockSymbol === stockSymbol);
    }
    return all;
  }

  getActiveRecommendations(): RecommendationRecord[] {
    return Array.from(this.recommendations.values()).filter(
      r => r.status !== RecommendationStatus.FINAL_OUTCOME && r.status !== RecommendationStatus.CANCELLED,
    );
  }

  getCompletedRecommendations(): RecommendationRecord[] {
    return Array.from(this.recommendations.values()).filter(
      r => r.status === RecommendationStatus.FINAL_OUTCOME,
    );
  }

  getRecommendationsByStrategy(strategy: string): RecommendationRecord[] {
    return Array.from(this.recommendations.values()).filter(
      r => r.strategyUsed === strategy,
    );
  }

  getRecommendationsBySector(sector: string): RecommendationRecord[] {
    return Array.from(this.recommendations.values()).filter(
      r => r.sector === sector,
    );
  }

  getSuccessAnalytics(): SuccessAnalytics {
    const completed = this.getCompletedRecommendations();
    return this.calculateSuccessAnalytics(completed);
  }

  getPerformanceDashboard(): PerformanceDashboard {
    const completed = this.getCompletedRecommendations();
    const analytics = this.calculateSuccessAnalytics(completed);

    const windowPerformance: Partial<Record<string, WindowPerformance>> = {};
    for (const window of this.config.evaluationWindows) {
      const windowRecs = completed.slice(0, 100);
      const agg = this.performanceEvaluation.getAggregatePerformance(windowRecs);
      windowPerformance[window] = agg[window];
    }

    const sorted = [...completed].sort((a, b) => (b.actualReturn || 0) - (a.actualReturn || 0));
    const topPerformers = sorted.slice(0, 10).map(r => ({
      symbol: r.stockSymbol,
      return_: r.actualReturn || 0,
      eliteScore: r.entryEliteScore,
    }));
    const worstPerformers = sorted.slice(-10).reverse().map(r => ({
      symbol: r.stockSymbol,
      return_: r.actualReturn || 0,
      eliteScore: r.entryEliteScore,
    }));

    const strategyBreakdown = this.strategyAnalyzer.analyzeStrategyPerformance(completed);
    const sectorBreakdown = this.strategyAnalyzer.analyzeSectorPerformance(completed);

    const recentRecommendations = Array.from(this.recommendations.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    return {
      summary: analytics,
      windowPerformance,
      topPerformers,
      worstPerformers,
      strategyBreakdown,
      sectorBreakdown,
      recentRecommendations,
      generatedAt: new Date().toISOString(),
      disclaimer: 'Bu rapor yalnizca bilgilendirme amaclidir ve yatirim tavsiyesi niteliginde degildir.',
    };
  }

  evaluateRecommendationPerformance(
    id: string,
    priceHistory: PriceData[],
  ): RecommendationPerformance | undefined {
    const rec = this.recommendations.get(id);
    if (!rec) return undefined;
    return this.performanceEvaluation.evaluatePerformance(rec, priceHistory);
  }

  analyzeEliteScore(id: string): EliteScoreAnalysis | undefined {
    const rec = this.recommendations.get(id);
    if (!rec) return undefined;
    const results = this.eliteScoreAnalyzer.analyzeScoreAccuracy([rec]);
    return results[0];
  }

  reviewAIAnalysis(id: string): AIAnalysisReview | undefined {
    const rec = this.recommendations.get(id);
    if (!rec) return undefined;
    const results = this.aiAnalysisReviewer.reviewExplanationConsistency([rec]);
    return results[0];
  }

  analyzeStrategies(): StrategyPerformanceAnalysis[] {
    const completed = this.getCompletedRecommendations();
    return this.strategyAnalyzer.analyzeStrategyPerformance(completed);
  }

  analyzeSectors(): SectorPerformanceAnalysis[] {
    const completed = this.getCompletedRecommendations();
    return this.strategyAnalyzer.analyzeSectorPerformance(completed);
  }

  analyzeFailures(): FailureAnalysis[] {
    const completed = this.getCompletedRecommendations();
    return this.failureAnalyzer.analyzeFailures(completed);
  }

  generateSummaryReport(): string {
    const analytics = this.getSuccessAnalytics();
    const dashboard = this.getPerformanceDashboard();
    return this.reportGenerator.generateSummaryReport(analytics, dashboard);
  }

  generatePerformanceDashboardReport(): string {
    const dashboard = this.getPerformanceDashboard();
    return this.reportGenerator.generatePerformanceDashboard(dashboard);
  }

  generateAccuracyReport(): string {
    const completed = this.getCompletedRecommendations();
    const analyses = this.eliteScoreAnalyzer.analyzeScoreAccuracy(completed);
    return this.reportGenerator.generateAccuracyReport(analyses);
  }

  generateSectorReport(): string {
    const sectors = this.analyzeSectors();
    return this.reportGenerator.generateSectorReport(sectors);
  }

  generateStrategyReport(): string {
    const strategies = this.analyzeStrategies();
    return this.reportGenerator.generateStrategyReport(strategies);
  }

  generateMonthlyReport(year: number, month: number): string {
    const all = Array.from(this.recommendations.values());
    return this.reportGenerator.generateMonthlyReport(all, year, month);
  }

  generateFailureReport(): string {
    const failures = this.analyzeFailures();
    return this.reportGenerator.generateFailureReport(failures);
  }

  updatePriceHistory(symbol: string, prices: PriceData[]): void {
    this.priceHistories.set(symbol, prices);
  }

  getPriceHistory(symbol: string): PriceData[] {
    return this.priceHistories.get(symbol) || [];
  }

  getConfig(): RecommendationTrackerConfig {
    return { ...this.config };
  }

  private calculateSuccessAnalytics(completed: RecommendationRecord[]): SuccessAnalytics {
    if (completed.length === 0) {
      return {
        totalRecommendations: 0,
        winRate: 0,
        lossRate: 0,
        avgGain: 0,
        avgLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        evaluatedAt: new Date().toISOString(),
      };
    }

    const winners = completed.filter(r => (r.actualReturn || 0) > 0);
    const losers = completed.filter(r => (r.actualReturn || 0) < 0);

    const winRate = (winners.length / completed.length) * 100;
    const lossRate = (losers.length / completed.length) * 100;

    const avgGain = winners.length > 0
      ? winners.reduce((s, r) => s + (r.actualReturn || 0), 0) / winners.length
      : 0;
    const avgLoss = losers.length > 0
      ? losers.reduce((s, r) => s + (r.actualReturn || 0), 0) / losers.length
      : 0;

    const grossProfit = winners.reduce((s, r) => s + (r.actualReturn || 0), 0);
    const grossLoss = Math.abs(losers.reduce((s, r) => s + (r.actualReturn || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const returns = completed.map(r => r.actualReturn || 0);
    const sharpeRatio = this.performanceEvaluation.calculateSharpeRatio(returns);
    const sortinoRatio = this.performanceEvaluation.calculateSortinoRatio(returns);

    const truePositives = winners.filter(r => r.entryEliteScore >= 50).length;
    const falsePositives = losers.filter(r => r.entryEliteScore >= 50).length;
    const falseNegatives = winners.filter(r => r.entryEliteScore < 50).length;

    const precision = (truePositives + falsePositives) > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;
    const recall = (truePositives + falseNegatives) > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;
    const f1Score = (precision + recall) > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;

    return {
      totalRecommendations: completed.length,
      winRate,
      lossRate,
      avgGain,
      avgLoss,
      profitFactor,
      sharpeRatio,
      sortinoRatio,
      precision,
      recall,
      f1Score,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private matchesQuery(record: RecommendationRecord, query: RecommendationHistoryQuery): boolean {
    if (query.stockSymbol && record.stockSymbol !== query.stockSymbol) return false;
    if (query.strategy && record.strategyUsed !== query.strategy) return false;
    if (query.sector && record.sector !== query.sector) return false;
    if (query.status && record.status !== query.status) return false;
    if (query.outcome && record.outcome !== query.outcome) return false;
    if (query.startDate && new Date(record.entryDate) < new Date(query.startDate)) return false;
    if (query.endDate && new Date(record.entryDate) > new Date(query.endDate)) return false;
    if (query.minEliteScore !== undefined && record.entryEliteScore < query.minEliteScore) return false;
    if (query.maxEliteScore !== undefined && record.entryEliteScore > query.maxEliteScore) return false;
    return true;
  }

  private calculateHoldingDays(entryDate: string): number {
    const entry = new Date(entryDate);
    const now = new Date();
    const diffMs = now.getTime() - entry.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private generateId(): string {
    return `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export class RecommendationNotFoundError extends Error {
  constructor(id: string) {
    super(`Recommendation not found: ${id}`);
    this.name = 'RecommendationNotFoundError';
  }
}
