import { Injectable, Logger } from '@nestjs/common';
import { PredictionService } from '../../prediction/prediction.service';
import { AIResearchHubService } from '../../ai-research/ai-research-hub.service';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { MultiTimeframeOpportunityEngine } from './multi-timeframe-engine';
import {
  MultiTimeframeOpportunityInput,
  MultiTimeframeOpportunityResult,
  MULTI_TIMEFRAME_TIMEFRAMES,
} from './multi-timeframe.types';
import { PredictionTimeframe } from '../../prediction/prediction.types';

export interface MultiTimeframeAnalyzeOptions {
  timeframes?: PredictionTimeframe[];
}

@Injectable()
export class MultiTimeframeOpportunityService {
  private readonly logger = new Logger(MultiTimeframeOpportunityService.name);

  constructor(
    private readonly predictionService: PredictionService,
    private readonly aiResearchHub: AIResearchHubService,
    private readonly symbolRegistry: SymbolRegistryService,
    private readonly engine: MultiTimeframeOpportunityEngine,
  ) {}

  async analyze(
    ticker: string,
    options?: MultiTimeframeAnalyzeOptions,
  ): Promise<MultiTimeframeOpportunityResult | null> {
    const normalized = ticker.toUpperCase();
    const timeframes = options?.timeframes ?? MULTI_TIMEFRAME_TIMEFRAMES;

    try {
      const predictions = await this.collectAllTimeframes(normalized, timeframes);
      const hasValid = predictions.some((p) => p.isValid);
      if (!hasValid) {
        return null;
      }

      const consensus = await this.aiResearchHub
        .getConsensus(normalized)
        .catch(() => null);

      const symbol = this.symbolRegistry.getSymbol(normalized);

      const input: MultiTimeframeOpportunityInput = {
        ticker: normalized,
        company: symbol?.companyName ?? normalized,
        sector: symbol?.sector ?? '',
        predictions,
        consensus,
      };

      return this.engine.evaluate(input);
    } catch (error) {
      this.logger.debug(
        `Multi-timeframe analysis skipped for ${normalized}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private async collectAllTimeframes(
    ticker: string,
    timeframes: readonly PredictionTimeframe[],
  ): Promise<MultiTimeframeOpportunityInput['predictions']> {
    const results = await Promise.all(
      timeframes.map((tf) => this.predictionService.getPrediction(ticker, tf)),
    );
    return results;
  }
}
