import { Injectable, Logger } from '@nestjs/common';
import { MarketDataOrchestrator } from '../../market-data/orchestrator/market-data-orchestrator';
import { MarketDataPoint } from '../../market-data/interfaces/market-data.types';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import {
  DataQualityFlag,
  DataQualityFlagType,
  DataQualityReport,
  DATA_QUALITY_CHECK_DEFAULTS,
} from '../interfaces';

@Injectable()
export class DataQualityService {
  private readonly logger = new Logger(DataQualityService.name);

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  async validateDataForTicker(ticker: string, timeframe: string = '1d'): Promise<DataQualityReport> {
    const result = await this.orchestrator.fetchHistoricalData(ticker, timeframe);
    const flags: DataQualityFlag[] = [];

    if (!result || !result.data || result.data.length === 0) {
      flags.push({
        ticker,
        timeframe,
        flagType: 'INSUFFICIENT_HISTORY',
        severity: 'ERROR',
        message: `No historical data available for ${ticker} (${timeframe})`,
        affectedFields: ['all'],
        detectedAt: new Date().toISOString(),
      });
    } else {
      const points = result.data;
      flags.push(...this.validateOHLCV(points, ticker, timeframe));
      flags.push(...this.validateTimestamps(points, ticker, timeframe));
      flags.push(...this.validateVolume(points, ticker, timeframe));
      flags.push(...this.validateHistory(points, ticker, timeframe));
    }

    const overallQuality = this.calculateOverallQuality(flags);

    return {
      ticker,
      flags,
      overallQuality,
      generatedAt: new Date().toISOString(),
    };
  }

  async validateDataPoints(points: MarketDataPoint[], ticker: string, timeframe: string): Promise<DataQualityFlag[]> {
    const flags: DataQualityFlag[] = [];
    flags.push(...this.validateOHLCV(points, ticker, timeframe));
    flags.push(...this.validateTimestamps(points, ticker, timeframe));
    flags.push(...this.validateVolume(points, ticker, timeframe));
    flags.push(...this.validateHistory(points, ticker, timeframe));
    return flags;
  }

  private validateOHLCV(points: any[], ticker: string, timeframe: string): DataQualityFlag[] {
    const flags: DataQualityFlag[] = [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const { open, high, low, close, volume } = point;

      if (open === undefined || high === undefined || low === undefined || close === undefined) {
        flags.push({
          ticker: ticker.toUpperCase(),
          timeframe,
          flagType: 'MISSING_OHLCV',
          severity: 'ERROR',
          message: `Missing OHLCV data at index ${i}`,
          affectedFields: ['open', 'high', 'low', 'close'],
          detectedAt: new Date().toISOString(),
        });
        continue;
      }

      if (high < low) {
        flags.push({
          ticker: ticker.toUpperCase(),
          timeframe,
          flagType: 'INVALID_OHLC_RELATIONSHIP',
          severity: 'ERROR',
          message: `High (${high}) < Low (${low}) at index ${i}`,
          affectedFields: ['high', 'low'],
          detectedAt: new Date().toISOString(),
        });
      }

      if (close > high || close < low) {
        flags.push({
          ticker: ticker.toUpperCase(),
          timeframe,
          flagType: 'INVALID_OHLC_RELATIONSHIP',
          severity: 'ERROR',
          message: `Close (${close}) outside High-Low range at index ${i}`,
          affectedFields: ['close', 'high', 'low'],
          detectedAt: new Date().toISOString(),
        });
      }

      if (open > high || open < low) {
        flags.push({
          ticker: ticker.toUpperCase(),
          timeframe,
          flagType: 'INVALID_OHLC_RELATIONSHIP',
          severity: 'ERROR',
          message: `Open (${open}) outside High-Low range at index ${i}`,
          affectedFields: ['open', 'high', 'low'],
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return flags;
  }

  private validateTimestamps(points: any[], ticker: string, timeframe: string): DataQualityFlag[] {
    const flags: DataQualityFlag[] = [];
    const timestamps = points.map(p => p.timestamp || p.date).filter(Boolean);

    for (let i = 1; i < timestamps.length; i++) {
      const current = new Date(timestamps[i]).getTime();
      const previous = new Date(timestamps[i - 1]).getTime();

      if (current === previous) {
        flags.push({
          ticker: ticker.toUpperCase(),
          timeframe,
          flagType: 'DUPLICATE_TIMESTAMP',
          severity: 'WARNING',
          message: `Duplicate timestamp at index ${i}: ${timestamps[i]}`,
          affectedFields: ['timestamp'],
          detectedAt: new Date().toISOString(),
        });
      }

      if (current < previous) {
        flags.push({
          ticker: ticker.toUpperCase(),
          timeframe,
          flagType: 'UNSORTED_TIMESTAMPS',
          severity: 'WARNING',
          message: `Timestamps not sorted at index ${i}: ${timestamps[i]} < ${timestamps[i - 1]}`,
          affectedFields: ['timestamp'],
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return flags;
  }

  private validateVolume(points: any[], ticker: string, timeframe: string): DataQualityFlag[] {
    const flags: DataQualityFlag[] = [];

    for (let i = 0; i < points.length; i++) {
      const volume = points[i].volume;
      if (volume !== undefined && volume < 0) {
        flags.push({
          ticker: ticker.toUpperCase(),
          timeframe,
          flagType: 'NEGATIVE_VOLUME',
          severity: 'ERROR',
          message: `Negative volume at index ${i}: ${volume}`,
          affectedFields: ['volume'],
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return flags;
  }

  private validateHistory(points: any[], ticker: string, timeframe: string): DataQualityFlag[] {
    const flags: DataQualityFlag[] = [];

    if (points.length < DATA_QUALITY_CHECK_DEFAULTS.minHistoryPoints) {
      flags.push({
        ticker: ticker.toUpperCase(),
        timeframe,
        flagType: 'INSUFFICIENT_HISTORY',
        severity: 'WARNING',
        message: `Insufficient history: ${points.length} points (minimum ${DATA_QUALITY_CHECK_DEFAULTS.minHistoryPoints})`,
        affectedFields: ['all'],
        detectedAt: new Date().toISOString(),
      });
    }

    if (points.length >= 2) {
      const first = points[0];
      const last = points[points.length - 1];
      const timeDiff = new Date(last.timestamp || last.date).getTime() - new Date(first.timestamp || first.date).getTime();
      const expectedDays = timeframe === '1d' ? points.length : points.length * 7;
      const actualDays = timeDiff / (1000 * 60 * 60 * 24);
      
      if (actualDays < expectedDays * 0.5) {
        flags.push({
          ticker: ticker.toUpperCase(),
          timeframe,
          flagType: 'ABNORMAL_GAP',
          severity: 'WARNING',
          message: `Possible data gap: ${actualDays.toFixed(1)} days vs expected ~${expectedDays}`,
          affectedFields: ['timestamp', 'date'],
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return flags;
  }

  private calculateOverallQuality(flags: DataQualityFlag[]): DataQualityReport['overallQuality'] {
    const errors = flags.filter(f => f.severity === 'ERROR').length;
    const warnings = flags.filter(f => f.severity === 'WARNING').length;

    if (errors >= 3) return 'POOR';
    if (errors >= 1 || warnings >= 5) return 'FAIR';
    if (warnings >= 1) return 'GOOD';
    return 'EXCELLENT';
  }
}