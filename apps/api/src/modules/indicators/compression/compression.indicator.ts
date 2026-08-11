import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';
import { sma, stdev, trueRange } from '../common/indicator-utils';

@Injectable()
export class CompressionIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const bbPeriod = this.config.bollingerBands.period;
    const bbStdDev = this.config.bollingerBands.stdDev;
    const atrPeriod = this.config.atr.period;
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    const closes = data.map((d) => d.close);
    const middle = sma(closes, bbPeriod);
    const std = stdev(closes, bbPeriod);

    const bbWidth: number[] = [];
    for (let i = 0; i < closes.length; i++) {
      if (isNaN(middle[i]) || isNaN(std[i]) || middle[i] === 0) {
        bbWidth.push(NaN);
        continue;
      }
      const upper = middle[i] + bbStdDev * std[i];
      const lower = middle[i] - bbStdDev * std[i];
      bbWidth.push(((upper - lower) / middle[i]) * 100);
    }

    const tr = trueRange(data);
    const atrValues: number[] = [];
    for (let i = 0; i < tr.length; i++) {
      if (i < atrPeriod - 1) {
        atrValues.push(NaN);
        continue;
      }
      if (i === atrPeriod - 1) {
        let sum = 0;
        for (let j = 0; j < atrPeriod; j++) sum += tr[j];
        atrValues.push(sum / atrPeriod);
        continue;
      }
      atrValues.push((atrValues[i - 1] * (atrPeriod - 1) + tr[i]) / atrPeriod);
    }

    const atrSma = sma(atrValues, atrPeriod);
    const atrCompression: number[] = [];
    for (let i = 0; i < atrValues.length; i++) {
      if (isNaN(atrValues[i]) || isNaN(atrSma[i]) || atrSma[i] === 0) {
        atrCompression.push(NaN);
        continue;
      }
      atrCompression.push((atrValues[i] / atrSma[i]) * 100);
    }

    const lastBbWidth = bbWidth[bbWidth.length - 1];
    const lastAtrComp = atrCompression[atrCompression.length - 1];
    const isSqueezing = !isNaN(lastBbWidth) && !isNaN(lastAtrComp) && lastBbWidth < 10 && lastAtrComp < 80;

    return {
      indicator: 'Compression',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastBbWidth) ? null : {
        bollingerWidth: lastBbWidth,
        atrCompression: lastAtrComp,
        isSqueezing,
      },
      metadata: { bbWidth, atrCompression, bbPeriod, atrPeriod },
      isValid: !isNaN(lastBbWidth),
    };
  }
}
