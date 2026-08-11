import { Injectable, Logger } from '@nestjs/common';
import { PredictionService } from '../prediction/prediction.service';
import { PredictionRegistry } from '../prediction/prediction-registry';
import { PredictionResult, PredictionTimeframe } from '../prediction/prediction.types';
import { AIResearchHubService } from '../ai-research/ai-research-hub.service';
import { EliteScoreRegistry } from '../ai-elite-score/elite-score.registry';
import { OpportunityRegistry } from '../ai-opportunity/opportunity-registry.service';
import { DecisionRegistry } from '../decision/decision-registry.service';
import { SymbolRegistryService } from '../market-data/symbol-registry/symbol-registry.service';
import { BistSymbolEntry } from '../market-data/symbol-registry/symbol-registry.types';
import { EarlyOpportunityEngine } from './early-opportunity.engine';
import {
  EarlyOpportunityResult,
  EarlyOpportunitySymbolInput,
  EARLY_OPPORTUNITY_PRIMARY_TIMEFRAME,
  EARLY_OPPORTUNITY_TIMEFRAMES,
} from './early-opportunity.types';

const SCAN_CONCURRENCY = 12;
const DEFAULT_LIMIT = 10;

export interface EarlyOpportunityScanOptions {
  limit?: number;
  timeframes?: PredictionTimeframe[];
}

@Injectable()
export class EarlyOpportunityService {
  private readonly logger = new Logger(EarlyOpportunityService.name);

  constructor(
    private readonly predictionService: PredictionService,
    private readonly predictionRegistry: PredictionRegistry,
    private readonly aiResearchHub: AIResearchHubService,
    private readonly eliteScoreRegistry: EliteScoreRegistry,
    private readonly opportunityRegistry: OpportunityRegistry,
    private readonly decisionRegistry: DecisionRegistry,
    private readonly symbolRegistry: SymbolRegistryService,
    private readonly engine: EarlyOpportunityEngine,
  ) {}

  async scanAll(options?: EarlyOpportunityScanOptions): Promise<EarlyOpportunityResult[]> {
    const limit = Math.max(1, options?.limit ?? DEFAULT_LIMIT);
    const detailed = await this.scanAllDetailed(options);
    return detailed
      .map((d) => d.result)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async scanAllDetailed(
    options?: EarlyOpportunityScanOptions,
  ): Promise<Array<{ input: EarlyOpportunitySymbolInput; result: EarlyOpportunityResult }>> {
    const timeframes = options?.timeframes ?? EARLY_OPPORTUNITY_TIMEFRAMES;
    const symbols = this.symbolRegistry.getActiveSymbols();

    const detailed = await this.mapWithConcurrency(symbols, SCAN_CONCURRENCY, (symbol) =>
      this.buildAndScore(symbol, timeframes),
    );

    return detailed.filter(
      (d): d is { input: EarlyOpportunitySymbolInput; result: EarlyOpportunityResult } => d !== null,
    );
  }

  async scanTicker(
    ticker: string,
    options?: { timeframes?: PredictionTimeframe[] },
  ): Promise<EarlyOpportunityResult | null> {
    const symbol = this.symbolRegistry.getSymbol(ticker);
    if (!symbol) return null;
    const timeframes = options?.timeframes ?? EARLY_OPPORTUNITY_TIMEFRAMES;
    const detailed = await this.buildAndScore(symbol, timeframes);
    return detailed?.result ?? null;
  }

  async scanTickerDetailed(
    ticker: string,
    options?: { timeframes?: PredictionTimeframe[] },
  ): Promise<{ input: EarlyOpportunitySymbolInput; result: EarlyOpportunityResult } | null> {
    const symbol = this.symbolRegistry.getSymbol(ticker);
    if (!symbol) return null;
    const timeframes = options?.timeframes ?? EARLY_OPPORTUNITY_TIMEFRAMES;
    return this.buildAndScore(symbol, timeframes);
  }

  private async buildAndScore(
    symbol: BistSymbolEntry,
    timeframes: readonly PredictionTimeframe[],
  ): Promise<{ input: EarlyOpportunitySymbolInput; result: EarlyOpportunityResult } | null> {
    try {
      const predictions = await this.collectPredictions(symbol.canonicalTicker, timeframes);
      const hasValid = predictions.some((p) => p.isValid);
      if (!hasValid) {
        return null;
      }

      const consensus = await this.aiResearchHub
        .getConsensus(symbol.canonicalTicker)
        .catch(() => null);

      const input: EarlyOpportunitySymbolInput = {
        ticker: symbol.canonicalTicker,
        company: symbol.companyName,
        sector: symbol.sector,
        predictions,
        consensus,
        eliteScore: this.eliteScoreRegistry.get(symbol.canonicalTicker)?.result ?? null,
        opportunity: this.opportunityRegistry.get(symbol.canonicalTicker)?.result ?? null,
        decision: this.decisionRegistry.get(symbol.canonicalTicker)?.result ?? null,
      };

      const result = this.engine.evaluate(input);
      return { input, result };
    } catch (error) {
      this.logger.debug(
        `Early opportunity scan skipped for ${symbol.canonicalTicker}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private async collectPredictions(
    ticker: string,
    timeframes: readonly PredictionTimeframe[],
  ): Promise<PredictionResult[]> {
    const primary = await this.predictionService.getPrediction(
      ticker,
      EARLY_OPPORTUNITY_PRIMARY_TIMEFRAME,
    );

    const extra: PredictionResult[] = [];
    for (const tf of timeframes) {
      if (tf === EARLY_OPPORTUNITY_PRIMARY_TIMEFRAME) continue;
      const cached = this.predictionRegistry.get(ticker, tf);
      if (cached?.isValid) {
        extra.push(cached);
      }
    }

    return [primary, ...extra];
  }

  private async mapWithConcurrency<TItem, TResult>(
    items: TItem[],
    concurrency: number,
    fn: (item: TItem, index: number) => Promise<TResult>,
  ): Promise<TResult[]> {
    const results: TResult[] = new Array(items.length);
    let i = 0;
    const worker = async () => {
      while (true) {
        const index = i;
        i += 1;
        if (index >= items.length) return;
        results[index] = await fn(items[index], index);
      }
    };
    const workers = Array.from(
      { length: Math.min(concurrency, items.length) },
      () => worker(),
    );
    await Promise.all(workers);
    return results;
  }
}
