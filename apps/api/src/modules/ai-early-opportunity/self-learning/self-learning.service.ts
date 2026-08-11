import { Injectable, Logger } from '@nestjs/common';
import { PredictionResult } from '../../prediction/prediction.types';
import { PredictionRegistry } from '../../prediction/prediction-registry';
import { SelfLearningEngine } from './self-learning.engine';
import { SelfLearningRegistry } from './self-learning.registry';
import { SelfLearningEntry, SelfLearningReport } from '../early-opportunity.types';

const MIN_TRADES_FOR_LEARNING = 3;

export interface SelfLearningOptions {
  minTrades?: number;
}

@Injectable()
export class SelfLearningService {
  private readonly logger = new Logger(SelfLearningService.name);

  constructor(
    private readonly predictionRegistry: PredictionRegistry,
    private readonly engine: SelfLearningEngine,
    private readonly registry: SelfLearningRegistry,
  ) {}

  async runLearningCycle(options?: SelfLearningOptions): Promise<SelfLearningReport> {
    const minTrades = options?.minTrades ?? MIN_TRADES_FOR_LEARNING;
    const predictions = this.predictionRegistry.getAll();

    const modifiers: SelfLearningEntry[] = [];
    let updated = 0;

    for (const pred of predictions) {
      const entry = this.evaluatePrediction(pred, minTrades);
      if (!entry) continue;
      this.registry.upsert(entry);
      modifiers.push(entry);
      updated++;
    }

    this.logger.debug(
      `Self-learning cycle complete: ${updated}/${predictions.length} predictions calibrated`,
    );

    return {
      scanned: predictions.length,
      updated,
      modifiers,
      generatedAt: new Date().toISOString(),
    };
  }

  getModifier(ticker: string): number {
    return this.registry.getModifier(ticker);
  }

  getAllModifiers(): SelfLearningEntry[] {
    return this.registry.getAll();
  }

  clear(): void {
    this.registry.clear();
  }

  private evaluatePrediction(
    pred: PredictionResult,
    minTrades: number,
  ): SelfLearningEntry | null {
    if (!pred.isValid) return null;
    const backtest = pred.backtestAccuracy;
    if (!backtest.isValid || backtest.totalTrades < minTrades) {
      return null;
    }
    const { modifier, rationale } = this.engine.computeModifier(
      pred.bullishProbability,
      backtest.winRate,
    );

    return {
      ticker: pred.ticker,
      predictedBullish: pred.bullishProbability,
      realizedWinRate: backtest.winRate,
      modifier,
      rationale,
      lastUpdated: new Date().toISOString(),
    };
  }
}
