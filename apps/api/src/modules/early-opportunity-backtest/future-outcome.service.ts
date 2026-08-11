import { Injectable } from '@nestjs/common';
import { OHLCV } from '../indicators/indicator.types';
import { BacktestHorizon, HORIZON_DAYS, HorizonOutcome, FutureOutcome } from './early-opportunity-backtest.types';

@Injectable()
export class FutureOutcomeService {
  calculate(
    ticker: string,
    decisionDate: string,
    candles: OHLCV[],
    horizons: BacktestHorizon[],
    entryPrice: number,
    stop: number | null,
    target1: number | null,
    commission: number = 0,
    slippage: number = 0,
  ): FutureOutcome {
    const decisionIdx = this.findDecisionIndex(candles, decisionDate);
    if (decisionIdx < 0 || decisionIdx >= candles.length - 1) {
      return {
        ticker,
        decisionDate,
        outcomes: horizons.map((h) => this.emptyOutcome(h, entryPrice)),
        overallMaxDrawdown: 0,
        overallMaxFavorableExcursion: 0,
        overallMaxAdverseExcursion: 0,
        dataAvailable: false,
      };
    }

    const outcomes: HorizonOutcome[] = [];
    let overallMaxDrawdown = 0;
    let overallMaxFavorableExcursion = 0;
    let overallMaxAdverseExcursion = 0;

    for (const horizon of horizons) {
      const days = HORIZON_DAYS[horizon];
      const horizonEndIdx = this.findHorizonEndIndex(candles, decisionIdx, days);
      const outcome = this.calculateHorizonOutcome(
        candles, decisionIdx, horizonEndIdx, horizon, days,
        entryPrice, stop, target1, commission, slippage,
      );
      outcomes.push(outcome);
      overallMaxDrawdown = Math.max(overallMaxDrawdown, outcome.maxDrawdownAfterSignal);
      overallMaxFavorableExcursion = Math.max(overallMaxFavorableExcursion, outcome.maxFavorableExcursion);
      overallMaxAdverseExcursion = Math.max(overallMaxAdverseExcursion, outcome.maxAdverseExcursion);
    }

    return {
      ticker,
      decisionDate,
      outcomes,
      overallMaxDrawdown,
      overallMaxFavorableExcursion,
      overallMaxAdverseExcursion,
      dataAvailable: true,
    };
  }

  private findDecisionIndex(candles: OHLCV[], decisionDate: string): number {
    const decisionTime = new Date(decisionDate).getTime();
    for (let i = candles.length - 1; i >= 0; i--) {
      if (new Date(candles[i].timestamp).getTime() <= decisionTime) {
        return i;
      }
    }
    return -1;
  }

  private findHorizonEndIndex(candles: OHLCV[], startIdx: number, days: number): number {
    if (startIdx < 0) return -1;
    const startTime = new Date(candles[startIdx].timestamp).getTime();
    const endTime = startTime + days * 86400000;
    for (let i = startIdx; i < candles.length; i++) {
      if (new Date(candles[i].timestamp).getTime() > endTime) {
        return i - 1;
      }
    }
    return candles.length - 1;
  }

  private calculateHorizonOutcome(
    candles: OHLCV[], decisionIdx: number, horizonEndIdx: number,
    horizon: BacktestHorizon, days: number,
    entryPrice: number, stop: number | null, target1: number | null,
    commission: number, slippage: number,
  ): HorizonOutcome {
    if (horizonEndIdx < 0 || horizonEndIdx <= decisionIdx) {
      return this.emptyOutcome(horizon, entryPrice);
    }

    const effectiveEntry = entryPrice * (1 + slippage / 100);
    const exitCandle = candles[horizonEndIdx];
    const exitPriceRaw = exitCandle.close;
    const exitPrice = exitPriceRaw * (1 - slippage / 100);
    const commissionCost = commission / 100;

    const absoluteReturn = exitPrice - effectiveEntry;
    const percentageReturn = ((exitPrice / effectiveEntry) - 1 - commissionCost * 2) * 100;

    let maxFavorableExcursion = 0;
    let maxAdverseExcursion = 0;
    let maxDrawdownAfterSignal = 0;
    let timeToPositiveReturn: number | null = null;
    let timeToTarget: number | null = null;
    let timeToStop: number | null = null;
    let targetReached = false;
    let stopReached = false;

    let peak = effectiveEntry;

    for (let i = decisionIdx + 1; i <= horizonEndIdx; i++) {
      const c = candles[i];
      const high = c.high;
      const low = c.low;

      const favorableExcursion = ((high / effectiveEntry) - 1) * 100;
      const adverseExcursion = ((low / effectiveEntry) - 1) * 100;
      maxFavorableExcursion = Math.max(maxFavorableExcursion, favorableExcursion);
      maxAdverseExcursion = Math.min(maxAdverseExcursion, adverseExcursion);

      if (c.close > effectiveEntry && timeToPositiveReturn === null) {
        const daysSince = (new Date(c.timestamp).getTime() - new Date(candles[decisionIdx].timestamp).getTime()) / 86400000;
        timeToPositiveReturn = Math.round(daysSince);
      }

      if (stop != null && low <= stop && timeToStop === null) {
        timeToStop = Math.round((new Date(c.timestamp).getTime() - new Date(candles[decisionIdx].timestamp).getTime()) / 86400000);
        stopReached = true;
      }

      if (target1 != null && high >= target1 && timeToTarget === null) {
        timeToTarget = Math.round((new Date(c.timestamp).getTime() - new Date(candles[decisionIdx].timestamp).getTime()) / 86400000);
        targetReached = true;
      }

      if (c.close > peak) peak = c.close;
      const drawdown = ((peak - c.close) / peak) * 100;
      maxDrawdownAfterSignal = Math.max(maxDrawdownAfterSignal, drawdown);
    }

    return {
      horizon,
      horizonDays: days,
      entryPrice: effectiveEntry,
      exitPrice,
      absoluteReturn,
      percentageReturn,
      maxFavorableExcursion,
      maxAdverseExcursion,
      maxDrawdownAfterSignal,
      timeToPositiveReturn,
      timeToTarget,
      timeToStop,
      targetReached,
      stopReached,
      dataAvailable: true,
    };
  }

  private emptyOutcome(horizon: BacktestHorizon, entryPrice: number): HorizonOutcome {
    return {
      horizon,
      horizonDays: HORIZON_DAYS[horizon],
      entryPrice,
      exitPrice: null,
      absoluteReturn: null,
      percentageReturn: null,
      maxFavorableExcursion: 0,
      maxAdverseExcursion: 0,
      maxDrawdownAfterSignal: 0,
      timeToPositiveReturn: null,
      timeToTarget: null,
      timeToStop: null,
      targetReached: false,
      stopReached: false,
      dataAvailable: false,
    };
  }
}