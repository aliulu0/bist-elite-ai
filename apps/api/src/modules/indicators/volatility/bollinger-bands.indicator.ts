import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';
import { sma, stdev } from '../common/indicator-utils';

@Injectable()
export class BollingerBandsIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const { period, stdDev } = this.config.bollingerBands;
    const closes = data.map((d) => d.close);
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    const middle = sma(closes, period);
    const std = stdev(closes, period);

    const upper: number[] = [];
    const lower: number[] = [];
    const bandwidth: number[] = [];
    const percentB: number[] = [];

    for (let i = 0; i < closes.length; i++) {
      if (isNaN(middle[i]) || isNaN(std[i])) {
        upper.push(NaN);
        lower.push(NaN);
        bandwidth.push(NaN);
        percentB.push(NaN);
        continue;
      }
      const u = middle[i] + stdDev * std[i];
      const l = middle[i] - stdDev * std[i];
      upper.push(u);
      lower.push(l);
      bandwidth.push(u === l ? 0 : ((u - l) / middle[i]) * 100);
      percentB.push(u === l ? 0.5 : (closes[i] - l) / (u - l));
    }

    const lastUpper = upper[upper.length - 1];
    const lastLower = lower[lower.length - 1];
    const lastMiddle = middle[middle.length - 1];
    const lastBw = bandwidth[bandwidth.length - 1];
    const lastPb = percentB[percentB.length - 1];

    return {
      indicator: 'BollingerBands',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastUpper) ? null : {
        upper: lastUpper,
        middle: lastMiddle,
        lower: lastLower,
        bandwidth: lastBw,
        percentB: lastPb,
      },
      metadata: {
        period,
        stdDev,
        upper,
        middle,
        lower,
        bandwidth,
        percentB,
      },
      isValid: !isNaN(lastUpper),
    };
  }
}
