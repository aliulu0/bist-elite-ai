import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';
import { rsi as calcRsi, stdev } from '../common/indicator-utils';

@Injectable()
export class StochasticRsiIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const { period, kPeriod, dPeriod } = this.config.stochasticRsi;
    const closes = data.map((d) => d.close);
    const rsiValues = calcRsi(closes, period);
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    const validRsi = rsiValues.filter((v) => !isNaN(v));
    if (validRsi.length < kPeriod) {
      return {
        indicator: 'StochasticRSI',
        timeframe,
        timestamp: lastTimestamp,
        value: null,
        metadata: { period, kPeriod, dPeriod, k: NaN, d: NaN },
        isValid: false,
      };
    }

    const stochK: number[] = [];
    for (let i = 0; i < rsiValues.length; i++) {
      if (i < kPeriod - 1) {
        stochK.push(NaN);
        continue;
      }
      let min = Infinity;
      let max = -Infinity;
      for (let j = i - kPeriod + 1; j <= i; j++) {
        if (!isNaN(rsiValues[j])) {
          if (rsiValues[j] < min) min = rsiValues[j];
          if (rsiValues[j] > max) max = rsiValues[j];
        }
      }
      stochK.push(max === min ? 50 : ((rsiValues[i] - min) / (max - min)) * 100);
    }

    const kSma = this.sma(stochK, dPeriod);
    const lastK = stochK[stochK.length - 1];
    const lastD = kSma[kSma.length - 1];

    return {
      indicator: 'StochasticRSI',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastK) ? null : { k: lastK, d: lastD },
      metadata: { period, kPeriod, dPeriod, kValues: stochK, dValues: kSma },
      isValid: !isNaN(lastK),
    };
  }

  private sma(values: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
        continue;
      }
      let sum = 0;
      let count = 0;
      for (let j = i - period + 1; j <= i; j++) {
        if (!isNaN(values[j])) {
          sum += values[j];
          count++;
        }
      }
      result.push(count === period ? sum / period : NaN);
    }
    return result;
  }
}
