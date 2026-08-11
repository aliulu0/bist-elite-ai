import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';
import { rsi as calcRsi } from '../common/indicator-utils';

@Injectable()
export class RsiIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const period = this.config.rsi.period;
    const closes = data.map((d) => d.close);
    const values = calcRsi(closes, period);
    const lastValue = values[values.length - 1];
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    return {
      indicator: 'RSI',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastValue) ? null : lastValue,
      metadata: { period, values },
      isValid: !isNaN(lastValue),
    };
  }
}
