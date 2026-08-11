import { Injectable, Optional } from '@nestjs/common';
import { OHLCV, Timeframe } from '../indicators/indicator.types';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import {
  CompanyProfile,
  FinancialRatios,
  BalanceSheet,
  IncomeStatement,
  CompanySector,
} from '../market-data/interfaces/fundamental.types';
import {
  HistoricalDataset,
  CorporateAction,
  FundamentalData,
  ProviderMetadata,
  PipelineMetadata,
} from './historical-data.types';
import {
  HistoricalDataPipelineConfig,
  DEFAULT_PIPELINE_CONFIG,
} from './historical-data.config';
import { mapToFundamentalData } from '../analysis-pipeline/fundamental.mapper';

export interface PipelineInput {
  symbol: string;
  timeframe: Timeframe;
  priceData: MarketDataPoint[];
  corporateActions?: CorporateAction[];
  companyProfile?: CompanyProfile | null;
  financialRatios?: FinancialRatios | null;
  balanceSheet?: BalanceSheet | null;
  incomeStatement?: IncomeStatement | null;
  sector?: CompanySector | null;
  providerCurrency?: string;
  providerTimezone?: string;
  providerExchange?: string;
}

@Injectable()
export class HistoricalDataPipeline {
  private readonly config: HistoricalDataPipelineConfig;

  constructor(@Optional() config?: Partial<HistoricalDataPipelineConfig>) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
  }

  process(input: PipelineInput): HistoricalDataset {
    const warnings: string[] = [];
    const normalizedFields: string[] = [];

    if (!input.priceData || input.priceData.length === 0) {
      return this.emptyResult(input.symbol, input.timeframe, 'No price data provided');
    }

    let bars = this.extractOHLCV(input.priceData);

    const timestampResult = this.normalizeTimestamps(bars);
    bars = timestampResult.bars;
    if (timestampResult.changed) normalizedFields.push('timestamps');
    if (timestampResult.warnings.length > 0) warnings.push(...timestampResult.warnings);

    const ohlcResult = this.normalizeOHLC(bars);
    bars = ohlcResult.bars;
    if (ohlcResult.changed) normalizedFields.push('ohlc');
    if (ohlcResult.warnings.length > 0) warnings.push(...ohlcResult.warnings);

    const volumeResult = this.normalizeVolume(bars);
    bars = volumeResult.bars;
    if (volumeResult.changed) normalizedFields.push('volume');
    if (volumeResult.warnings.length > 0) warnings.push(...volumeResult.warnings);

    if (input.providerCurrency && input.providerCurrency !== this.config.currency.targetCurrency) {
      const currencyResult = this.normalizeCurrency(bars, input.providerCurrency);
      bars = currencyResult.bars;
      if (currencyResult.changed) normalizedFields.push('currency');
      if (currencyResult.warnings.length > 0) warnings.push(...currencyResult.warnings);
    }

    const corporateActions = input.corporateActions ?? [];
    const fundamentals = this.buildFundamentals(input);
    const provider = this.buildProviderMetadata(input);
    const metadata = this.buildMetadata(bars, normalizedFields, warnings, input);

    return {
      symbol: input.symbol,
      timeframe: input.timeframe,
      bars,
      corporateActions,
      fundamentals,
      provider,
      metadata,
    };
  }

  private extractOHLCV(data: MarketDataPoint[]): OHLCV[] {
    return data.map((d) => ({
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
      timestamp: d.timestamp,
    }));
  }

  private normalizeTimestamps(bars: OHLCV[]): { bars: OHLCV[]; changed: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let changed = false;
    let result = [...bars];

    if (this.config.timestamp.deduplicate) {
      const seen = new Set<string>();
      const deduped: OHLCV[] = [];
      for (const bar of result) {
        if (!seen.has(bar.timestamp)) {
          seen.add(bar.timestamp);
          deduped.push(bar);
        } else {
          warnings.push(`Duplicate timestamp removed: ${bar.timestamp}`);
          changed = true;
        }
      }
      result = deduped;
    }

    if (this.config.timestamp.sortAscending) {
      const sorted = [...result].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      if (JSON.stringify(sorted.map((b) => b.timestamp)) !== JSON.stringify(result.map((b) => b.timestamp))) {
        changed = true;
      }
      result = sorted;
    }

    return { bars: result, changed, warnings };
  }

  private normalizeOHLC(bars: OHLCV[]): { bars: OHLCV[]; changed: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let changed = false;
    const decimals = this.config.ohlc.roundDecimals;

    const result = bars.map((bar) => {
      let { open, high, low, close } = bar;

      open = this.roundTo(open, decimals);
      high = this.roundTo(high, decimals);
      low = this.roundTo(low, decimals);
      close = this.roundTo(close, decimals);

      if (this.config.ohlc.ensurePositive) {
        if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
          warnings.push(`Non-positive price at ${bar.timestamp}`);
        }
      }

      if (this.config.ohlc.validateHighLow) {
        if (high < low) {
          warnings.push(`High < Low at ${bar.timestamp}, swapping`);
          [high, low] = [low, high];
          changed = true;
        }
        if (high < open) {
          warnings.push(`High < Open at ${bar.timestamp}`);
          high = Math.max(high, open);
          changed = true;
        }
        if (high < close) {
          warnings.push(`High < Close at ${bar.timestamp}`);
          high = Math.max(high, close);
          changed = true;
        }
        if (low > open) {
          warnings.push(`Low > Open at ${bar.timestamp}`);
          low = Math.min(low, open);
          changed = true;
        }
        if (low > close) {
          warnings.push(`Low > Close at ${bar.timestamp}`);
          low = Math.min(low, close);
          changed = true;
        }
      }

      return { ...bar, open, high, low, close };
    });

    return { bars: result, changed, warnings };
  }

  private normalizeVolume(bars: OHLCV[]): { bars: OHLCV[]; changed: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let changed = false;
    const decimals = this.config.volume.roundDecimals;

    const result = bars.map((bar) => {
      let volume = bar.volume;

      if (this.config.volume.ensureNonNegative && volume < 0) {
        warnings.push(`Negative volume at ${bar.timestamp}, setting to 0`);
        volume = 0;
        changed = true;
      }

      if (volume === 0) {
        if (this.config.volume.zeroVolumeHandling === 'replace_zero') {
          volume = this.config.volume.zeroReplacementValue;
          changed = true;
        } else if (this.config.volume.zeroVolumeHandling === 'remove') {
          return null;
        }
      }

      return { ...bar, volume: this.roundTo(volume, decimals) };
    });

    return {
      bars: result.filter((b): b is OHLCV => b !== null),
      changed,
      warnings,
    };
  }

  private normalizeCurrency(bars: OHLCV[], sourceCurrency: string): { bars: OHLCV[]; changed: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const rates = this.config.currency.conversionRates;
    const sourceRate = rates[sourceCurrency];
    const targetRate = rates[this.config.currency.targetCurrency];

    if (!sourceRate || !targetRate) {
      warnings.push(`Missing conversion rate for ${sourceCurrency} → ${this.config.currency.targetCurrency}`);
      return { bars, changed: false, warnings };
    }

    const factor = sourceRate / targetRate;
    if (factor === 1) return { bars, changed: false, warnings: [] };

    const result = bars.map((bar) => ({
      ...bar,
      open: this.roundTo(bar.open * factor, this.config.ohlc.roundDecimals),
      high: this.roundTo(bar.high * factor, this.config.ohlc.roundDecimals),
      low: this.roundTo(bar.low * factor, this.config.ohlc.roundDecimals),
      close: this.roundTo(bar.close * factor, this.config.ohlc.roundDecimals),
    }));

    return { bars: result, changed: true, warnings: [`Currency converted ${sourceCurrency} → ${this.config.currency.targetCurrency}`] };
  }

  private buildFundamentals(input: PipelineInput): FundamentalData {
    return mapToFundamentalData({
      profile: input.companyProfile,
      ratios: input.financialRatios,
      balance: input.balanceSheet,
      income: input.incomeStatement,
      sector: input.sector,
    });
  }

  private buildProviderMetadata(input: PipelineInput): ProviderMetadata {
    return {
      name: 'pipeline',
      currency: input.providerCurrency ?? this.config.currency.targetCurrency,
      exchange: input.providerExchange ?? 'BIST',
      timezone: input.providerTimezone ?? this.config.timestamp.targetTimezone,
      lastUpdated: new Date().toISOString(),
      reliability: 1.0,
    };
  }

  private buildMetadata(
    bars: OHLCV[],
    normalizedFields: string[],
    warnings: string[],
    input: PipelineInput,
  ): PipelineMetadata {
    return {
      totalBars: bars.length,
      dateRange: {
        start: bars[0]?.timestamp ?? '',
        end: bars[bars.length - 1]?.timestamp ?? '',
      },
      normalizedFields,
      warnings,
      processedAt: new Date().toISOString(),
      sourceProviders: ['pipeline'],
    };
  }

  private roundTo(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  private emptyResult(symbol: string, timeframe: Timeframe, reason: string): HistoricalDataset {
    return {
      symbol,
      timeframe,
      bars: [],
      corporateActions: [],
      fundamentals: {
        priceToBook: null,
        evToEBITDA: null,
        netProfit: null,
        equity: null,
        totalDebt: null,
        totalAssets: null,
        sharesOutstanding: null,
        marketCap: null,
        sector: null,
        companyName: null,
      },
      provider: {
        name: 'pipeline',
        currency: this.config.currency.targetCurrency,
        exchange: 'BIST',
        timezone: this.config.timestamp.targetTimezone,
        lastUpdated: new Date().toISOString(),
        reliability: 0,
      },
      metadata: {
        totalBars: 0,
        dateRange: { start: '', end: '' },
        normalizedFields: [],
        warnings: [reason],
        processedAt: new Date().toISOString(),
        sourceProviders: [],
      },
    };
  }
}
