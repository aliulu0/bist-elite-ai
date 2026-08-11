import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';

@Injectable()
export class CmfIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const period = this.config.cmf.period;
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    const mfv = data.map((d) => {
      const hlRange = d.high - d.low;
      if (hlRange === 0) return 0;
      return ((d.close - d.low) - (d.high - d.close)) / hlRange * d.volume;
    });

    const values: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        values.push(NaN);
        continue;
      }
      let mfvSum = 0;
      let volSum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        mfvSum += mfv[j];
        volSum += data[j].volume;
      }
      values.push(volSum === 0 ? 0 : mfvSum / volSum);
    }

    const lastValue = values[values.length - 1];

    return {
      indicator: 'CMF',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastValue) ? null : lastValue,
      metadata: { period, values },
      isValid: !isNaN(lastValue),
    };
  }
}
