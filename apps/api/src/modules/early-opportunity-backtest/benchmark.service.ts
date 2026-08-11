import { Injectable } from '@nestjs/common';
import { BacktestHorizon, BACKTEST_HORIZONS, HORIZON_DAYS, BenchmarkComparisonResult } from './early-opportunity-backtest.types';
import { OHLCV } from '../indicators/indicator.types';

@Injectable()
export class BenchmarkService {
  compare(
    ticker: string,
    decisionDate: string,
    stockCandles: OHLCV[],
    benchmarkCandles: OHLCV[] | null,
    horizon: BacktestHorizon = '3M',
  ): BenchmarkComparisonResult {
    if (!benchmarkCandles || benchmarkCandles.length === 0) {
      return {
        ticker,
        decisionDate,
        horizon,
        stockReturn: null,
        benchmarkReturn: null,
        excessReturn: null,
        relativeSuccess: null,
        benchmarkAvailable: false,
      };
    }

    const days = HORIZON_DAYS[horizon];
    const decisionTime = new Date(decisionDate).getTime();
    const endTime = decisionTime + days * 86400000;

    const stockStartIdx = this.findClosestBefore(stockCandles, decisionTime);
    const stockEndIdx = this.findClosestBefore(stockCandles, endTime);
    const benchStartIdx = this.findClosestBefore(benchmarkCandles, decisionTime);
    const benchEndIdx = this.findClosestBefore(benchmarkCandles, endTime);

    if (stockStartIdx < 0 || stockEndIdx <= stockStartIdx || benchStartIdx < 0 || benchEndIdx <= benchStartIdx) {
      return {
        ticker,
        decisionDate,
        horizon,
        stockReturn: null,
        benchmarkReturn: null,
        excessReturn: null,
        relativeSuccess: null,
        benchmarkAvailable: true,
      };
    }

    const stockStartPrice = stockCandles[stockStartIdx].close;
    const stockEndPrice = stockCandles[stockEndIdx].close;
    const benchStartPrice = benchmarkCandles[benchStartIdx].close;
    const benchEndPrice = benchmarkCandles[benchEndIdx].close;

    const stockReturn = ((stockEndPrice / stockStartPrice) - 1) * 100;
    const benchmarkReturn = ((benchEndPrice / benchStartPrice) - 1) * 100;
    const excessReturn = stockReturn - benchmarkReturn;
    const relativeSuccess = stockReturn > benchmarkReturn;

    return {
      ticker,
      decisionDate,
      horizon,
      stockReturn,
      benchmarkReturn,
      excessReturn,
      relativeSuccess,
      benchmarkAvailable: true,
    };
  }

  compareAllHorizons(
    ticker: string,
    decisionDate: string,
    stockCandles: OHLCV[],
    benchmarkCandles: OHLCV[] | null,
  ): BenchmarkComparisonResult[] {
    return BACKTEST_HORIZONS.map((h) => this.compare(ticker, decisionDate, stockCandles, benchmarkCandles, h));
  }

  private findClosestBefore(candles: OHLCV[], targetTime: number): number {
    let best = -1;
    for (let i = 0; i < candles.length; i++) {
      const ts = new Date(candles[i].timestamp).getTime();
      if (ts <= targetTime) {
        best = i;
      } else {
        break;
      }
    }
    return best;
  }
}