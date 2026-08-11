import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';
import { ema } from '../common/indicator-utils';

@Injectable()
export class EmaIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe, period?: number): IndicatorResult[] {
    const periods = period ? [period] : this.config.ema.periods;
    const closes = data.map((d) => d.close);
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    return periods.map((p) => {
      const values = ema(closes, p);
      const lastValue = values[values.length - 1];
      return {
        indicator: `EMA_${p}`,
        timeframe,
        timestamp: lastTimestamp,
        value: isNaN(lastValue) ? null : lastValue,
        metadata: { period: p, values },
        isValid: !isNaN(lastValue),
      };
    });
  }
}
