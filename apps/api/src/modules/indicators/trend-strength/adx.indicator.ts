import { Injectable } from '@nestjs/common';
import { IndicatorResult, OHLCV, Timeframe } from '../indicator.types';
import { IndicatorConfig, DEFAULT_INDICATOR_CONFIG } from '../indicator.config';

@Injectable()
export class AdxIndicator {
  private readonly config: IndicatorConfig;

  constructor() {
    this.config = DEFAULT_INDICATOR_CONFIG;
  }

  calculate(data: OHLCV[], timeframe: Timeframe): IndicatorResult {
    const period = this.config.adx.period;
    const lastTimestamp = data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();

    if (data.length < period + 1) {
      return {
        indicator: 'ADX',
        timeframe,
        timestamp: lastTimestamp,
        value: null,
        metadata: { period, adx: NaN, diPlus: NaN, diMinus: NaN },
        isValid: false,
      };
    }

    const trList: number[] = [];
    const diPlusList: number[] = [];
    const diMinusList: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const highDiff = data[i].high - data[i - 1].high;
      const lowDiff = data[i - 1].low - data[i].low;
      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close),
      );
      trList.push(tr);
      diPlusList.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
      diMinusList.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
    }

    const smoothTR = this.wilderSmooth(trList, period);
    const smoothDIPlus = this.wilderSmooth(diPlusList, period);
    const smoothDIMinus = this.wilderSmooth(diMinusList, period);

    const dxValues: number[] = [];
    for (let i = 0; i < smoothTR.length; i++) {
      if (smoothTR[i] === 0) {
        dxValues.push(0);
        continue;
      }
      const dip = (smoothDIPlus[i] / smoothTR[i]) * 100;
      const dim = (smoothDIMinus[i] / smoothTR[i]) * 100;
      const sum = dip + dim;
      dxValues.push(sum === 0 ? 0 : (Math.abs(dip - dim) / sum) * 100);
    }

    const adxValues = this.wilderSmooth(dxValues, period);

    const lastAdx = adxValues[adxValues.length - 1];
    const lastDip = smoothTR.length > 0 ? (smoothDIPlus[smoothDIPlus.length - 1] / smoothTR[smoothTR.length - 1]) * 100 : NaN;
    const lastDim = smoothTR.length > 0 ? (smoothDIMinus[smoothDIMinus.length - 1] / smoothTR[smoothTR.length - 1]) * 100 : NaN;

    return {
      indicator: 'ADX',
      timeframe,
      timestamp: lastTimestamp,
      value: isNaN(lastAdx) ? null : { adx: lastAdx, diPlus: lastDip, diMinus: lastDim },
      metadata: { period, adxValues, diPlusValues: smoothDIPlus, diMinusValues: smoothDIMinus },
      isValid: !isNaN(lastAdx),
    };
  }

  private wilderSmooth(values: number[], period: number): number[] {
    const result: number[] = [];
    if (values.length < period) return values.map(() => NaN);

    let sum = 0;
    for (let i = 0; i < period; i++) sum += values[i];
    result.push(sum / period);

    for (let i = period; i < values.length; i++) {
      result.push((result[result.length - 1] * (period - 1) + values[i]) / period);
    }
    return result;
  }
}
