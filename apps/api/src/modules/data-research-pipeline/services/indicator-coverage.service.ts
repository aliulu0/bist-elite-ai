import { Injectable, Logger } from '@nestjs/common';
import { IndicatorEngine } from '../../indicators/indicator-engine.service';
import {
  IndicatorCoverageEntry,
  IndicatorCoverageReport,
} from '../interfaces';

@Injectable()
export class IndicatorCoverageService {
  private readonly logger = new Logger(IndicatorCoverageService.name);

  constructor(private readonly indicatorEngine: IndicatorEngine) {}

  async getIndicatorCoverage(): Promise<IndicatorCoverageReport> {
    const indicators = this.getSupportedIndicators();
    const indicatorsWithCoverage: IndicatorCoverageEntry[] = indicators.map(ind => ({
      indicatorName: ind,
      available: true,
      timeframes: ['1h', '2h', '4h', '1d', '1w', '1m', '3m', '6m'],
      source: 'builtin' as const,
      lastComputed: new Date().toISOString(),
    }));

    const bySource: Record<string, number> = {};
    for (const ind of indicatorsWithCoverage) {
      bySource[ind.source] = (bySource[ind.source] || 0) + 1;
    }

    return {
      indicators: indicatorsWithCoverage,
      summary: {
        total: indicatorsWithCoverage.length,
        available: indicatorsWithCoverage.filter(i => i.available).length,
        bySource,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private getSupportedIndicators(): string[] {
    return [
      'SMA', 'EMA', 'WMA', 'DEMA', 'TEMA', 'KAMA', 'T3',
      'RSI', 'RSI_WILDER', 'STOCH', 'STOCHRSI', 'MFI',
      'MACD', 'MACDEXT', 'MACDFIX',
      'BBANDS', 'BBANDS_PERCENTB',
      'ATR', 'NATR', 'TRANGE',
      'ADX', 'ADXR', 'DX', 'MINUS_DI', 'PLUS_DI', 'MINUS_DM', 'PLUS_DM',
      'AROON', 'AROONOSC',
      'CCI', 'CMO', 'MOM', 'ROC', 'ROCP', 'ROCR', 'ROCR100',
      'OBV', 'AD', 'ADOSC',
      'HT_DCPERIOD', 'HT_DCPHASE', 'HT_PHASOR', 'HT_SINE', 'HT_TRENDLINE', 'HT_TRENDMODE',
      'BOP', 'AVGPRICE', 'MEDPRICE', 'TYPPRICE', 'WCLPRICE',
      'ULTOSC', 'WILLR',
      'SUPERTREND', 'ICHIMOKU', 'PARABOLIC_SAR',
      'VWAP', 'VWMA', 'MVWAP',
      'VOLUME_PROFILE', 'POC', 'VAH', 'VAL',
    ];
  }
}