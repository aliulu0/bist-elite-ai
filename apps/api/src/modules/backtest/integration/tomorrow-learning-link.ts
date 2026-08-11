import { Injectable } from '@nestjs/common';
import { BacktestResult } from '../backtest.types';
import { TomorrowFeedbackResultDto } from '../dto/strategy-ranking.dto';

export interface TomorrowFeedbackInput {
  symbol: string;
  predictedScore: number;
  actualReturn: number;
  result?: BacktestResult;
}

@Injectable()
export class TomorrowLearningLink {
  applyFeedback(input: TomorrowFeedbackInput): TomorrowFeedbackResultDto {
    const { symbol, predictedScore: predicted, actualReturn: actual, result } = input;
    const delta = Math.round((actual - predicted) * 100) / 100;
    let direction: 'UPGRADE' | 'DOWNGRADE' | 'KEEP';
    if (delta > 0.5) direction = 'UPGRADE';
    else if (delta < -0.5) direction = 'DOWNGRADE';
    else direction = 'KEEP';

    let confidence = 0.5;
    let reason: string;
    if (result) {
      const sharpe = result.risk.sharpeRatio;
      const winRate = result.performance.winRate;
      const reliability = (winRate / 100 + (Number.isFinite(sharpe) ? Math.max(0, Math.min(2, sharpe)) / 2 : 0)) / 2;
      confidence = Math.max(0, Math.min(1, reliability));
      reason =
        direction === 'UPGRADE'
          ? `Gerçekleşen getiri tahmine göre üstünde (${delta.toFixed(2)} puan). Backtest güven skoru: ${(confidence * 100).toFixed(1)}%.`
          : direction === 'DOWNGRADE'
            ? `Gerçekleşen getiri tahmine göre altında (${delta.toFixed(2)} puan). Backtest güven skoru: ${(confidence * 100).toFixed(1)}%.`
            : `Gerçekleşen getiri tahmine paralel (${delta.toFixed(2)} puan). Backtest güven skoru: ${(confidence * 100).toFixed(1)}%.`;
    } else {
      reason =
        direction === 'UPGRADE'
          ? `Gerçekleşen getiri tahmine göre üstünde (${delta.toFixed(2)} puan).`
          : direction === 'DOWNGRADE'
            ? `Gerçekleşen getiri tahmine göre altında (${delta.toFixed(2)} puan).`
            : `Gerçekleşen getiri tahmine paralel (${delta.toFixed(2)} puan).`;
    }

    return {
      symbol,
      predicted,
      actual,
      delta,
      direction,
      confidence: Math.round(confidence * 1000) / 1000,
      reason,
    };
  }
}
