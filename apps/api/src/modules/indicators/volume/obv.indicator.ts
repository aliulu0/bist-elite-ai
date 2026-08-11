import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';

@Injectable()
export class ObvIndicator {
  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    if (data.length === 0) {
      return {
        indicator: 'OBV',
        timeframe,
        timestamp: lastTimestamp,
        value: null,
        metadata: { values: [] },
        isValid: false,
      };
    }

    const values: number[] = [0];
    for (let i = 1; i < data.length; i++) {
      if (data[i].close > data[i - 1].close) {
        values.push(values[i - 1] + data[i].volume);
      } else if (data[i].close < data[i - 1].close) {
        values.push(values[i - 1] - data[i].volume);
      } else {
        values.push(values[i - 1]);
      }
    }

    const lastValue = values[values.length - 1];

    return {
      indicator: 'OBV',
      timeframe,
      timestamp: lastTimestamp,
      value: lastValue,
      metadata: { values },
      isValid: true,
    };
  }
}
