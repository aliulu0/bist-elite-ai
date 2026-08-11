import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';
import { sma } from '../common/indicator-utils';

@Injectable()
export class VolumeSmaIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const period = this.config.volumeSma.period;
    const volumes = data.map((d) => d.volume);
    const values = sma(volumes, period);
    const lastValue = values[values.length - 1];
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    return {
      indicator: 'VolumeSMA',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastValue) ? null : lastValue,
      metadata: { period, values },
      isValid: !isNaN(lastValue),
    };
  }
}
