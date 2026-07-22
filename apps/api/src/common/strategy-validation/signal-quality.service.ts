import { Injectable } from '@nestjs/common';
import { SignalQualityMetrics, SignalAction, TradeRecord, ValidationConfig, VALIDATION_CONFIG_DEFAULTS } from './types';

@Injectable()
export class SignalQualityService {
  calculate(
    signals: Array<{
      date: string;
      action: SignalAction;
      confidence: number;
      price: number;
    }>,
    trades: TradeRecord[],
    config?: Partial<ValidationConfig>
  ): SignalQualityMetrics {
    const cfg = { ...VALIDATION_CONFIG_DEFAULTS, ...config };

    if (!signals || signals.length === 0) {
      return this.getEmptyMetrics();
    }

    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    const signalDates = new Set(signals.map(s => s.date));
    const tradeDates = new Set(trades.map(t => t.entryDate));

    for (const signal of signals) {
      const correspondingTrade = trades.find(t => t.entryDate === signal.date);

      if (signal.action === SignalAction.BUY || signal.action === SignalAction.SELL) {
        if (correspondingTrade) {
          if (correspondingTrade.pnl > 0) {
            truePositives++;
          } else {
            falsePositives++;
          }
        } else {
          const isWinningSignal = this.evaluateSignalOutcome(signal, trades);
          if (isWinningSignal) {
            truePositives++;
          } else {
            falsePositives++;
          }
        }
      } else {
        if (correspondingTrade) {
          falseNegatives++;
        } else {
          trueNegatives++;
        }
      }
    }

    for (const trade of trades) {
      if (!signalDates.has(trade.entryDate)) {
        if (trade.pnl < 0) {
          trueNegatives++;
        } else {
          falseNegatives++;
        }
      }
    }

    const totalSignals = truePositives + falsePositives + trueNegatives + falseNegatives;
    const precision = (truePositives + falsePositives) > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;
    const recall = (truePositives + falseNegatives) > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;
    const f1Score = (precision + recall) > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;

    const falsePositiveRate = (falsePositives + trueNegatives) > 0
      ? falsePositives / (falsePositives + trueNegatives)
      : 0;
    const falseNegativeRate = (falseNegatives + truePositives) > 0
      ? falseNegatives / (falseNegatives + truePositives)
      : 0;

    const correctSignals = truePositives + trueNegatives;

    const signalConfidences = signals.map(s => s.confidence);
    const signalStability = this.calculateStability(signalConfidences);
    const signalConsistency = this.calculateConsistency(signals, trades);

    return {
      precision,
      recall,
      f1Score,
      falsePositiveRate,
      falseNegativeRate,
      signalStability,
      signalConsistency,
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
      totalSignals,
      correctSignals,
    };
  }

  private getEmptyMetrics(): SignalQualityMetrics {
    return {
      precision: 0,
      recall: 0,
      f1Score: 0,
      falsePositiveRate: 1,
      falseNegativeRate: 1,
      signalStability: 0,
      signalConsistency: 0,
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0,
      totalSignals: 0,
      correctSignals: 0,
    };
  }

  private evaluateSignalOutcome(
    signal: { date: string; action: SignalAction; price: number },
    trades: TradeRecord[]
  ): boolean {
    const signalTime = new Date(signal.date).getTime();
    const nearbyTrade = trades.find(t => {
      const tradeTime = new Date(t.entryDate).getTime();
      const diffDays = Math.abs(tradeTime - signalTime) / (24 * 60 * 60 * 1000);
      return diffDays <= 3;
    });

    if (nearbyTrade) {
      if (signal.action === SignalAction.BUY) {
        return nearbyTrade.exitPrice > signal.price;
      } else if (signal.action === SignalAction.SELL) {
        return nearbyTrade.exitPrice < signal.price;
      }
    }

    return false;
  }

  private calculateStability(confidences: number[]): number {
    if (confidences.length < 2) return 0;
    const mean = confidences.reduce((s, v) => s + v, 0) / confidences.length;
    const variance = confidences.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / confidences.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
    return Math.max(0, 1 - cv);
  }

  private calculateConsistency(
    signals: Array<{ date: string; action: SignalAction; confidence: number; price: number }>,
    trades: TradeRecord[]
  ): number {
    if (signals.length < 2) return 0;

    let consistentCount = 0;
    let totalPairs = 0;

    for (let i = 0; i < signals.length - 1; i++) {
      const current = signals[i];
      const next = signals[i + 1];

      const currentTrade = trades.find(t => t.entryDate === current.date);
      const nextTrade = trades.find(t => t.entryDate === next.date);

      if (currentTrade && nextTrade) {
        totalPairs++;
        if ((currentTrade.pnl > 0 && nextTrade.pnl > 0) ||
          (currentTrade.pnl < 0 && nextTrade.pnl < 0)) {
          consistentCount++;
        }
      }
    }

    return totalPairs > 0 ? consistentCount / totalPairs : 0;
  }
}
