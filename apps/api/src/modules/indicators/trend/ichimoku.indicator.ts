import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';
import { sma } from '../common/indicator-utils';

@Injectable()
export class IchimokuIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult[] {
    const { tenkanPeriod, kijunPeriod, senkouBPeriod, displacement } = this.config.ichimoku;
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);
    const closes = data.map((d) => d.close);

    const tenkan = this.midline(highs, lows, tenkanPeriod);
    const kijun = this.midline(highs, lows, kijunPeriod);
    const senkouA = this.senkouA(tenkan, kijun, displacement);
    const senkouB = this.midline(highs, lows, senkouBPeriod);
    const chikou = closes;

    const last = (arr: number[]) => arr[arr.length - 1];

    return [
      {
        indicator: 'Ichimoku_Tenkan',
        timeframe,
        timestamp: lastTimestamp,
        value: isNaN(last(tenkan)) ? null : last(tenkan),
        metadata: { period: tenkanPeriod, values: tenkan },
        isValid: !isNaN(last(tenkan)),
      },
      {
        indicator: 'Ichimoku_Kijun',
        timeframe,
        timestamp: lastTimestamp,
        value: isNaN(last(kijun)) ? null : last(kijun),
        metadata: { period: kijunPeriod, values: kijun },
        isValid: !isNaN(last(kijun)),
      },
      {
        indicator: 'Ichimoku_SenkouA',
        timeframe,
        timestamp: lastTimestamp,
        value: isNaN(last(senkouA)) ? null : last(senkouA),
        metadata: { displacement, values: senkouA },
        isValid: !isNaN(last(senkouA)),
      },
      {
        indicator: 'Ichimoku_SenkouB',
        timeframe,
        timestamp: lastTimestamp,
        value: isNaN(last(senkouB)) ? null : last(senkouB),
        metadata: { period: senkouBPeriod, values: senkouB },
        isValid: !isNaN(last(senkouB)),
      },
      {
        indicator: 'Ichimoku_Chikou',
        timeframe,
        timestamp: lastTimestamp,
        value: last(chikou),
        metadata: { values: chikou },
        isValid: true,
      },
    ];
  }

  private midline(highs: number[], lows: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < highs.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
        continue;
      }
      let highMax = -Infinity;
      let lowMin = Infinity;
      for (let j = i - period + 1; j <= i; j++) {
        if (highs[j] > highMax) highMax = highs[j];
        if (lows[j] < lowMin) lowMin = lows[j];
      }
      result.push((highMax + lowMin) / 2);
    }
    return result;
  }

  private senkouA(tenkan: number[], kijun: number[], displacement: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < tenkan.length; i++) {
      if (isNaN(tenkan[i]) || isNaN(kijun[i])) {
        result.push(NaN);
        continue;
      }
      result.push((tenkan[i] + kijun[i]) / 2);
    }
    return result;
  }
}
