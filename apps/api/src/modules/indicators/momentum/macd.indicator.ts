import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';
import { ema } from '../common/indicator-utils';

@Injectable()
export class MacdIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const { fastPeriod, slowPeriod, signalPeriod } = this.config.macd;
    const closes = data.map((d) => d.close);
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    const fastEma = ema(closes, fastPeriod);
    const slowEma = ema(closes, slowPeriod);

    const macdLine: number[] = [];
    for (let i = 0; i < closes.length; i++) {
      if (isNaN(fastEma[i]) || isNaN(slowEma[i])) {
        macdLine.push(NaN);
      } else {
        macdLine.push(fastEma[i] - slowEma[i]);
      }
    }

    const validMacd = macdLine.filter((v) => !isNaN(v));
    const signalLine = validMacd.length >= signalPeriod ? ema(validMacd, signalPeriod) : [];

    const fullSignal: number[] = [];
    let signalIdx = 0;
    for (let i = 0; i < macdLine.length; i++) {
      if (isNaN(macdLine[i])) {
        fullSignal.push(NaN);
      } else {
        fullSignal.push(signalIdx < signalLine.length ? signalLine[signalIdx] : NaN);
        signalIdx++;
      }
    }

    const histogram: number[] = [];
    for (let i = 0; i < macdLine.length; i++) {
      if (isNaN(macdLine[i]) || isNaN(fullSignal[i])) {
        histogram.push(NaN);
      } else {
        histogram.push(macdLine[i] - fullSignal[i]);
      }
    }

    const lastMacd = macdLine[macdLine.length - 1];
    const lastSignal = fullSignal[fullSignal.length - 1];
    const lastHist = histogram[histogram.length - 1];

    return {
      indicator: 'MACD',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastMacd) ? null : {
        macd: lastMacd,
        signal: lastSignal,
        histogram: lastHist,
      },
      metadata: {
        fastPeriod,
        slowPeriod,
        signalPeriod,
        macdLine,
        signalLine: fullSignal,
        histogram,
      },
      isValid: !isNaN(lastMacd),
    };
  }
}
