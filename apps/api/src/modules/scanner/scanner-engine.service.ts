import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  ScannerResult,
  ScannerConfig,
  ScannerSortMode,
  ScannerGroupBy,
  ScannerMetrics,
  ScanMode,
  ScanHistoryEntry,
  ScannerResultMetadata,
  SCANNER_VERSION,
} from './scanner.types';
import { DEFAULT_SCANNER_CONFIG as DEFAULT_CONFIG } from './scanner.config';
import { OpportunityResult } from '../opportunity-detection/opportunity-detection.types';
import { FilterEngine } from './services/filter-engine.service';
import { Ranker } from './services/ranker.service';
import { SortEngine } from './services/sort-engine.service';
import { Categorizer } from './services/categorizer.service';
import { Grouper } from './services/grouper.service';
import { DuplicateMerger } from './services/duplicate-merger.service';
import { HistoryTracker } from './services/history-tracker.service';
import { WatchlistManager } from './services/watchlist-manager.service';
import { ScannerMetricsCollector } from './services/scanner-metrics-collector.service';

@Injectable()
export class ScannerEngine {
  private readonly logger = new Logger(ScannerEngine.name);
  private readonly config: ScannerConfig;
  private readonly filterEngine: FilterEngine;
  private readonly ranker: Ranker;
  private readonly sortEngine: SortEngine;
  private readonly categorizer: Categorizer;
  private readonly grouper: Grouper;
  private readonly duplicateMerger: DuplicateMerger;
  private readonly historyTracker: HistoryTracker;
  private readonly watchlistManager: WatchlistManager;
  private readonly metricsCollector: ScannerMetricsCollector;

  constructor(@Optional() config?: Partial<ScannerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.filterEngine = new FilterEngine(this.config.filters);
    this.ranker = new Ranker(this.config.ranking);
    this.sortEngine = new SortEngine();
    this.categorizer = new Categorizer(this.config.categoryThresholds);
    this.grouper = new Grouper(this.config.groupConfig);
    this.duplicateMerger = new DuplicateMerger(this.config.duplicateMerge);
    this.historyTracker = new HistoryTracker();
    this.watchlistManager = new WatchlistManager(this.config.watchlists);
    this.metricsCollector = new ScannerMetricsCollector();
  }

  scan(
    opportunities: OpportunityResult[],
    mode: ScanMode = 'FULL',
    sortMode?: ScannerSortMode,
    groupBy?: ScannerGroupBy,
  ): {
    candidates: ScannerResult[];
    groups: Map<string, ScannerResult[]>;
    metrics: ScannerMetrics;
  } {
    const startTime = Date.now();
    this.metricsCollector.reset();

    try {
      const merged = this.duplicateMerger.merge(opportunities);

      const candidateResults: ScannerResult[] = [];
      let rejectedCount = 0;

      for (const { opportunity, duplicateCount, history } of merged) {
        try {
          const filterResult = this.filterEngine.evaluateFilter(opportunity);
          if (!filterResult.passed) {
            this.metricsCollector.recordRejection();
            rejectedCount++;
            continue;
          }

          const analysisScore = opportunity.opportunityScore * 0.9 + opportunity.confidence * 0.1;
          const scannerScore = this.ranker.calculateScannerScore(
            opportunity,
            analysisScore,
            history,
            duplicateCount,
          );

          if (scannerScore < this.config.minScoreThreshold) {
            this.metricsCollector.recordRejection();
            rejectedCount++;
            continue;
          }

          const candidate = this.buildScannerResult(opportunity, scannerScore, history, duplicateCount, mode);
          candidateResults.push(candidate);

          this.metricsCollector.recordCandidate(
            scannerScore,
            opportunity.confidence,
            this.ranker.calculateRisk(opportunity.risks, opportunity.warnings),
            candidate.category,
            opportunity.opportunityLevel,
            opportunity.priority,
            duplicateCount,
          );
        } catch (error) {
          this.logger.warn(`Failed to process ${opportunity.symbol}: ${error instanceof Error ? error.message : String(error)}`);
          this.metricsCollector.recordRejection();
          rejectedCount++;
        }
      }

      const sorted = this.sortEngine.sort(candidateResults, sortMode ?? this.config.sortMode);
      const categorized = this.categorizer.categorizeAll(sorted);
      const finalResults = categorized.slice(0, this.config.maxResults);

      this.historyTracker.trackAll(finalResults);
      this.watchlistManager.populateAll(finalResults);

      const groups = this.grouper.group(finalResults, groupBy ?? 'NONE');
      const scanDurationMs = Date.now() - startTime;

      const metrics = this.metricsCollector.getMetrics(
        scanDurationMs,
        opportunities.length,
        this.filterEngine.getStats(),
        mode,
      );

      return { candidates: finalResults, groups, metrics };
    } catch (error) {
      this.logger.error(`Scan failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  scanSingle(symbol: string, opportunity: OpportunityResult): ScannerResult | null {
    const results = this.scan([opportunity], 'SINGLE');
    return results.candidates.length > 0 ? results.candidates[0] : null;
  }

  scanSector(opportunities: OpportunityResult[], sector: string): {
    candidates: ScannerResult[];
    metrics: ScannerMetrics;
  } {
    const sectorOpps = opportunities.filter(
      (o) => o.opportunityTypes.some((t) => t === 'SECTOR_ROTATION'),
    );
    const results = this.scan(sectorOpps, 'SECTOR');
    return { candidates: results.candidates, metrics: results.metrics };
  }

  scanWatchlist(watchlistName: string, opportunities: OpportunityResult[]): {
    candidates: ScannerResult[];
    metrics: ScannerMetrics;
  } {
    const results = this.scan(opportunities, 'WATCHLIST');
    return { candidates: results.candidates, metrics: results.metrics };
  }

  scanIncremental(opportunities: OpportunityResult[]): {
    candidates: ScannerResult[];
    metrics: ScannerMetrics;
  } {
    const results = this.scan(opportunities, 'INCREMENTAL');
    return { candidates: results.candidates, metrics: results.metrics };
  }

  getHistory(symbol: string): ScanHistoryEntry[] {
    return this.historyTracker.getHistory(symbol);
  }

  getWatchlist(name: string): ScannerResult[] {
    return this.watchlistManager.getWatchlist(name as any);
  }

  getAllWatchlists(): Map<string, ScannerResult[]> {
    return this.watchlistManager.getAllWatchlists() as Map<string, ScannerResult[]>;
  }

  private buildScannerResult(
    opportunity: OpportunityResult,
    scannerScore: number,
    history: ScanHistoryEntry[],
    duplicateCount: number,
    mode: ScanMode,
  ): ScannerResult {
    const firstSeen = this.historyTracker.getFirstSeen(opportunity.symbol) ?? opportunity.timestamp;
    const lastSeen = this.historyTracker.getLastSeen(opportunity.symbol) ?? opportunity.timestamp;
    const scoreDelta = this.historyTracker.getScoreDelta(opportunity.symbol);
    const priorityDelta = this.historyTracker.getPriorityDelta(opportunity.symbol);
    const categoryDelta = this.historyTracker.getCategoryDelta(opportunity.symbol);

    return {
      symbol: opportunity.symbol,
      scannerScore,
      opportunityScore: opportunity.opportunityScore,
      confidence: opportunity.confidence,
      risk: this.ranker.calculateRisk(opportunity.risks, opportunity.warnings),
      priority: opportunity.priority,
      age: opportunity.age,
      opportunityLevel: opportunity.opportunityLevel,
      opportunityTypes: opportunity.opportunityTypes,
      category: 'CUSTOM',
      recommendation: opportunity.recommendation,
      reasons: opportunity.reasons,
      strengths: opportunity.strengths,
      weaknesses: opportunity.weaknesses,
      risks: opportunity.risks,
      timestamp: opportunity.timestamp,
      firstSeen,
      lastSeen,
      status: 'ACTIVE',
      metadata: {
        scanDurationMs: 0,
        filterPassed: true,
        filterRejectionReason: null,
        duplicateCount,
        historyEntries: history.length,
        scoreDelta,
        priorityDelta: priorityDelta as any,
        categoryDelta,
        aggregationQuality: opportunity.metadata?.aggregationQuality ?? 0,
        providerConfidence: opportunity.metadata?.providerConfidence ?? 0,
        supportingMetrics: opportunity.supportingMetrics,
        penalties: opportunity.penalties,
        scanMode: mode,
      },
    };
  }
}
