import { Injectable, Logger } from '@nestjs/common';
import { ScannerRegistry } from './scanner-registry.service';
import { StrategyRegistry } from './strategy-registry.service';
import { EliteScannerEngine } from './elite-scanner-engine.service';
import { ScannerFilter } from './scanner-filter.service';
import { ScoreEngine } from '../scoring/score-engine.service';
import { DecisionEngine } from '../decision/decision-engine.service';
import { DecisionRegistry } from '../decision/decision-registry.service';
import { OpportunityEngine } from '../ai-opportunity/opportunity-engine.service';
import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EntryService } from '../entry/entry.service';
import { AnalystService } from '../analyst/analyst.service';
import {
  EliteScanResponse,
  EliteScannerConfig,
  ScannerFilterOptions,
  ScanSummary,
  StrategyInfo,
  EliteScannerResult,
} from './elite-scanner.types';
import { DecisionDimensionScores, DecisionInput } from '../decision/decision.types';
import { DEFAULT_ELITE_SCANNER_CONFIG } from './elite-scanner.config';

export interface ScannerOverview {
  baslik: string;
  toplamHisse: number;
  aktifHisse: number;
  sektorSayisi: number;
  stratejiSayisi: number;
  stratejiler: StrategyInfo[];
  sonTarama: ScanSummary | null;
}

export interface ScannerTopResult {
  ticker: string;
  company: string;
  sector: string | null;
  aiScore: number | null;
  aiConfidence: number | null;
  strategyId: string;
  strategyName: string;
  scannedAt: string;
}

export interface ScannerFilterRequest {
  minAiScore?: number;
  minConfidence?: number;
  minStrategyScore?: number;
  sector?: string;
  assetType?: string;
  activeOnly?: boolean;
  limit?: number;
}

export interface ScannerFilterResponse {
  baslik: string;
  toplamHisse: number;
  filtreSonucu: number;
  ortalamaYapayZekaPuani: number | null;
  ortalamaYapayZekaGuveni: number | null;
  sonuclar: EliteScannerResult[];
}

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);
  private readonly config: EliteScannerConfig;
  private lastScanByStrategy = new Map<string, EliteScanResponse>();
  private lastScan: EliteScanResponse | null = null;

  constructor(
    private readonly registry: ScannerRegistry,
    private readonly strategyRegistry: StrategyRegistry,
    private readonly engine: EliteScannerEngine,
    private readonly filter: ScannerFilter,
    private readonly scoreEngine: ScoreEngine,
    private readonly decisionEngine: DecisionEngine,
    private readonly decisionRegistry: DecisionRegistry,
    private readonly opportunityEngine: OpportunityEngine,
    private readonly opportunityRegistry: OpportunityRegistry,
    private readonly entryService: EntryService,
    private readonly analystService: AnalystService,
  ) {
    this.config = DEFAULT_ELITE_SCANNER_CONFIG;
  }

  getOverview(): ScannerOverview {
    return {
      baslik: 'Taramalar',
      toplamHisse: this.registry.getCount(),
      aktifHisse: this.registry.getActiveCount(),
      sektorSayisi: this.registry.getSectors().length,
      stratejiSayisi: this.strategyRegistry.list().length,
      stratejiler: this.strategyRegistry.listInfo(),
      sonTarama: this.lastScan?.summary ?? null,
    };
  }

  getStrategyList(): StrategyInfo[] {
    return this.strategyRegistry.listInfo();
  }

  getSectors(): string[] {
    return this.registry.getSectors();
  }

  async runScan(strategyId: string, filterOptions?: Partial<ScannerFilterOptions>): Promise<EliteScanResponse> {
    const strategy = this.strategyRegistry.get(strategyId);
    if (!strategy) {
      throw new Error(`Strateji bulunamadı: ${strategyId}`);
    }

    const instruments = this.registry.getInstruments({
      activeOnly: filterOptions?.activeOnly ?? true,
      sector: filterOptions?.sector ?? null,
      assetType: filterOptions?.assetType ?? null,
      limit: filterOptions?.limit ?? this.config.filters.limit,
    });

    const response = await this.engine.scan(instruments, strategy);
    await this.enrichWithDecisions(response.results);
    this.lastScan = response;
    this.lastScanByStrategy.set(strategyId, response);
    return response;
  }

  getResults(strategyId?: string): EliteScanResponse | null {
    if (strategyId) {
      return this.lastScanByStrategy.get(strategyId) ?? null;
    }
    return this.lastScan;
  }

  getTopResults(strategyId?: string, limit: number = 10): ScannerTopResult[] {
    const scan = strategyId ? this.lastScanByStrategy.get(strategyId) : this.lastScan;
    if (!scan) return [];
    return scan.results
      .slice(0, limit)
      .map((r) => ({
        ticker: r.ticker,
        company: r.company,
        sector: r.sector,
        aiScore: r.aiScore,
        aiConfidence: r.aiConfidence,
        strategyId: r.strategyId,
        strategyName: r.strategyName,
        scannedAt: r.scannedAt,
      }));
  }

  filterResults(
    request: ScannerFilterRequest,
  ): ScannerFilterResponse {
    const scan = this.lastScan;
    if (!scan) {
      return {
        baslik: 'Tarama Sonuçları',
        toplamHisse: 0,
        filtreSonucu: 0,
        ortalamaYapayZekaPuani: null,
        ortalamaYapayZekaGuveni: null,
        sonuclar: [],
      };
    }

    let filtered = scan.results;

    if (request.minAiScore != null) {
      filtered = filtered.filter((r) => r.aiScore != null && r.aiScore >= request.minAiScore!);
    }
    if (request.minConfidence != null) {
      filtered = filtered.filter((r) => r.aiConfidence != null && r.aiConfidence >= request.minConfidence!);
    }
    if (request.minStrategyScore != null) {
      filtered = filtered.filter((r) => r.strategyScore != null && r.strategyScore >= request.minStrategyScore!);
    }
    if (request.sector) {
      filtered = filtered.filter((r) => r.sector === request.sector);
    }
    if (request.assetType) {
      filtered = filtered.filter((r) => r.ticker); // asset type filtering would need registry lookup
    }
    if (request.activeOnly !== false) {
      // Already filtered at scan time
    }
    if (request.limit && request.limit > 0) {
      filtered = filtered.slice(0, request.limit);
    }

    const avgAiScore =
      filtered.length > 0
        ? filtered.reduce((sum, r) => sum + (r.aiScore ?? 0), 0) / filtered.length
        : null;
    const avgAiConfidence =
      filtered.length > 0
        ? filtered.reduce((sum, r) => sum + (r.aiConfidence ?? 0), 0) / filtered.length
        : null;

    return {
      baslik: 'Tarama Sonuçları',
      toplamHisse: scan.summary.scannedCount,
      filtreSonucu: filtered.length,
      ortalamaYapayZekaPuani: Math.round(avgAiScore ?? 0),
      ortalamaYapayZekaGuveni: Math.round(avgAiConfidence ?? 0),
      sonuclar: filtered,
    };
  }

  private async enrichWithDecisions(results: EliteScannerResult[]): Promise<void> {
    for (const result of results) {
      const input = this.toDecisionInput(result);
      const decision = this.decisionEngine.evaluate(input);
      result.decision = decision;
      this.decisionRegistry.set({
        ticker: result.ticker,
        input,
        result: decision,
        evaluatedAt: decision.evaluatedAt,
      });
      const opportunity: OpportunityResult = this.opportunityEngine.evaluate(
        input,
        decision,
      );
      result.opportunity = opportunity;
      this.opportunityRegistry.set({
        ticker: result.ticker,
        input,
        result: opportunity,
        evaluatedAt: opportunity.evaluatedAt,
      });
      result.entryZone = await this.entryService.computeForTicker(result.ticker, {
        company: result.company,
        price: result.price,
        context: {
          aiScore: opportunity.aiScore,
          aiConfidence: opportunity.aiConfidence,
          decisionScore: opportunity.decisionScore,
          decisionConfidence: opportunity.decisionConfidence,
          opportunityScore: opportunity.opportunityScore,
          opportunityConfidence: opportunity.confidence,
          momentum: opportunity.momentum,
          risk: opportunity.risk,
        },
      });
      result.analyst = await this.analystService.computeForTicker(result.ticker, {
        company: result.company,
        price: result.price,
      });
    }
  }

  private toDecisionInput(result: EliteScannerResult): DecisionInput {
    const dimensions: DecisionDimensionScores = {
      technical: result.technicalScore ?? null,
      fundamental: result.fundamentalScore ?? null,
      momentum: result.momentumScore ?? null,
      trend: result.trendScore ?? null,
      liquidity: result.liquidityScore ?? null,
      risk: result.riskScore ?? null,
      volume: result.volumeScore ?? null,
      quality: result.qualityScore ?? null,
      verification: result.verificationScore ?? null,
      catalyst: result.catalystScore ?? null,
    };
    return {
      ticker: result.ticker,
      company: result.company,
      sector: result.sector,
      price: result.price,
      aiScore: result.aiScore,
      aiConfidence: result.aiConfidence,
      strategyId: result.strategyId,
      strategyName: result.strategyName,
      strategyScore: result.strategyScore,
      strategyConfidence: result.strategyConfidence,
      dimensions,
    };
  }
}