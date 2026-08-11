import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';
import { sma } from '../common/indicator-utils';

@Injectable()
export class VolumeSpikeIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe, threshold = 2.0): IndicatorResult {
    const period = this.config.volumeSma.period;
    const volumes = data.map((d) => d.volume);
    const volSma = sma(volumes, period);
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    const values: number[] = [];
    for (let i = 0; i < volumes.length; i++) {
      if (isNaN(volSma[i]) || volSma[i] === 0) {
        values.push(NaN);
      } else {
        values.push(volumes[i] / volSma[i]);
      }
    }

    const lastValue = values[values.length - 1];
    const isSpike = !isNaN(lastValue) && lastValue >= threshold;

    return {
      indicator: 'VolumeSpike',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastValue) ? null : lastValue,
      metadata: { period, threshold, isSpike, values },
      isValid: !isNaN(lastValue),
    };
  }
}
