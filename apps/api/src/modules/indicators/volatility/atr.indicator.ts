import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';
import { trueRange } from '../common/indicator-utils';

@Injectable()
export class AtrIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const period = this.config.atr.period;
    const tr = trueRange(data);
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    const atrValues: number[] = [];
    for (let i = 0; i < tr.length; i++) {
      if (i < period - 1) {
        atrValues.push(NaN);
        continue;
      }
      if (i === period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += tr[j];
        atrValues.push(sum / period);
        continue;
      }
      atrValues.push((atrValues[i - 1] * (period - 1) + tr[i]) / period);
    }

    const lastValue = atrValues[atrValues.length - 1];

    return {
      indicator: 'ATR',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastValue) ? null : lastValue,
      metadata: { period, values: atrValues },
      isValid: !isNaN(lastValue),
    };
  }
}
