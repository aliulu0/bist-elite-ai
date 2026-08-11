import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';

@Injectable()
export class MomentumOscillatorIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const period = this.config.momentumOscillator.period;
    const closes = data.map((d) => d.close);
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    const values: number[] = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < period) {
        values.push(NaN);
        continue;
      }
      values.push(closes[i] - closes[i - period]);
    }

    const lastValue = values[values.length - 1];

    return {
      indicator: 'MomentumOscillator',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastValue) ? null : lastValue,
      metadata: { period, values },
      isValid: !isNaN(lastValue),
    };
  }
}
