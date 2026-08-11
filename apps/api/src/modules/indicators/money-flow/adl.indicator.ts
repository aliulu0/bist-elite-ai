import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';

@Injectable()
export class AdlIndicator {
  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    if (data.length === 0) {
      return {
        indicator: 'ADL',
        timeframe,
        timestamp: lastTimestamp,
        value: null,
        metadata: { values: [] },
        isValid: false,
      };
    }

    const values: number[] = [0];
    for (let i = 0; i < data.length; i++) {
      const hlRange = data[i].high - data[i].low;
      const mfm = hlRange === 0 ? 0 : ((data[i].close - data[i].low) - (data[i].high - data[i].close)) / hlRange;
      const mfv = mfm * data[i].volume;
      values.push(i === 0 ? mfv : values[i] + mfv);
    }

    values.shift();

    const lastValue = values[values.length - 1];

    return {
      indicator: 'ADL',
      timeframe,
      timestamp: lastTimestamp,
      value: lastValue,
      metadata: { values },
      isValid: true,
    };
  }
}
