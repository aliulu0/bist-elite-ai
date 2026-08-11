import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';

@Injectable()
export class MfiIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const period = this.config.mfi.period;
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    if (data.length < period + 1) {
      return {
        indicator: 'MFI',
        timeframe,
        timestamp: lastTimestamp,
        value: null,
        metadata: { period, values: [] },
        isValid: false,
      };
    }

    const typicalPrices = data.map((d) => (d.high + d.low + d.close) / 3);
    const rawMoneyFlow = typicalPrices.map((tp, i) => tp * data[i].volume);

    const values: number[] = [];
    for (let i = period; i < data.length; i++) {
      let posFlow = 0;
      let negFlow = 0;
      for (let j = i - period + 1; j <= i; j++) {
        if (typicalPrices[j] > typicalPrices[j - 1]) {
          posFlow += rawMoneyFlow[j];
        } else if (typicalPrices[j] < typicalPrices[j - 1]) {
          negFlow += rawMoneyFlow[j];
        }
      }
      const ratio = negFlow === 0 ? 100 : posFlow / negFlow;
      values.push(negFlow === 0 ? 100 : 100 - 100 / (1 + ratio));
    }

    for (let i = 0; i < period; i++) values.unshift(NaN);

    const lastValue = values[values.length - 1];

    return {
      indicator: 'MFI',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastValue) ? null : lastValue,
      metadata: { period, values },
      isValid: !isNaN(lastValue),
    };
  }
}
