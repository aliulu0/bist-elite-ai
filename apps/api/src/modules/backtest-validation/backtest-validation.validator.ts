import { Injectable, Optional } from '@nestjs/common';
import { OHLCV } from '../indicators/indicator.types';
import {
  HistoricalDatasetValidationResult,
  TimestampError,
  PriceError,
  VolumeError,
  MissingBar,
  Outlier,
  SplitEvent,
  DividendAdjustment,
} from './backtest-validation.types';
import {
  BacktestValidationConfig,
  DEFAULT_BACKTEST_VALIDATION_CONFIG,
} from './backtest-validation.config';

@Injectable()
export class HistoricalDatasetValidator {
  private readonly config: BacktestValidationConfig;

  constructor(@Optional() config?: Partial<BacktestValidationConfig>) {
    this.config = { ...DEFAULT_BACKTEST_VALIDATION_CONFIG, ...config };
  }

  validate(data: OHLCV[]): HistoricalDatasetValidationResult {
    if (!data || data.length === 0) {
      return this.emptyResult('No data provided');
    }

    const timestampErrors = this.validateTimestamps(data);
    const duplicateBars = timestampErrors.filter((e) => e.type === 'duplicate');
    const priceErrors = this.validateOHLC(data);
    const volumeErrors = this.validateVolume(data);
    const missingBars = this.findMissingBars(data);
    const splitDetected = this.detectSplits(data);
    const dividendAdjusted = this.detectDividendAdjustments(data);
    const outliers = this.detectOutliers(data);
    const warnings = this.buildWarnings(
      data,
      timestampErrors,
      priceErrors,
      volumeErrors,
      missingBars,
      outliers,
    );

    const qualityScore = this.calculateQualityScore(
      data.length,
      timestampErrors,
      priceErrors,
      volumeErrors,
      missingBars,
      outliers,
    );

    const isValid =
      qualityScore >= this.config.completeness.minCompletenessPercent &&
      data.length >= this.config.completeness.minDataPoints &&
      priceErrors.length === 0;

    return {
      qualityScore,
      isValid,
      missingBars,
      duplicateBars,
      splitDetected,
      dividendAdjusted,
      timestampErrors,
      priceErrors,
      volumeErrors,
      outliers,
      warnings,
      metadata: {
        totalBars: data.length,
        validBars: data.length - timestampErrors.filter((e) => e.type === 'duplicate').length,
        dateRange: {
          start: data[0]?.timestamp,
          end: data[data.length - 1]?.timestamp,
        },
      },
    };
  }

  private validateTimestamps(data: OHLCV[]): TimestampError[] {
    const errors: TimestampError[] = [];
    const seen = new Map<string, number>();

    for (let i = 0; i < data.length; i++) {
      const ts = data[i].timestamp;

      if (!ts || isNaN(Date.parse(ts))) {
        errors.push({ index: i, timestamp: ts, type: 'invalid_format', message: `Invalid timestamp at index ${i}` });
        continue;
      }

      if (seen.has(ts)) {
        errors.push({
          index: i,
          timestamp: ts,
          type: 'duplicate',
          message: `Duplicate timestamp at index ${i} (first seen at ${seen.get(ts)})`,
        });
        continue;
      }
      seen.set(ts, i);

      if (this.config.timestamps.requireAscending && i > 0) {
        const prev = new Date(data[i - 1].timestamp).getTime();
        const curr = new Date(ts).getTime();
        if (curr <= prev) {
          errors.push({
            index: i,
            timestamp: ts,
            type: 'out_of_order',
            message: `Timestamp at index ${i} is not after previous timestamp`,
          });
        }
      }
    }

    return errors;
  }

  private validateOHLC(data: OHLCV[]): PriceError[] {
    const errors: PriceError[] = [];
    const cfg = this.config.ohlcIntegrity;

    for (let i = 0; i < data.length; i++) {
      const bar = data[i];

      if (bar.high < bar.low) {
        errors.push({
          index: i,
          timestamp: bar.timestamp,
          type: 'high_below_low',
          message: `High (${bar.high}) is below Low (${bar.low}) at index ${i}`,
        });
      }

      if (bar.open < 0 || bar.high < 0 || bar.low < 0 || bar.close < 0) {
        errors.push({
          index: i,
          timestamp: bar.timestamp,
          type: 'negative_price',
          message: `Negative price detected at index ${i}`,
        });
        continue;
      }

      if (bar.open === 0 || bar.high === 0 || bar.low === 0 || bar.close === 0) {
        errors.push({
          index: i,
          timestamp: bar.timestamp,
          type: 'zero_price',
          message: `Zero price detected at index ${i}`,
        });
        continue;
      }

      if (cfg.requireHighGteOpen && bar.high < bar.open) {
        errors.push({
          index: i,
          timestamp: bar.timestamp,
          type: 'open_out_of_range',
          message: `High (${bar.high}) is below Open (${bar.open}) at index ${i}`,
        });
      }

      if (cfg.requireHighGteClose && bar.high < bar.close) {
        errors.push({
          index: i,
          timestamp: bar.timestamp,
          type: 'close_out_of_range',
          message: `High (${bar.high}) is below Close (${bar.close}) at index ${i}`,
        });
      }

      if (cfg.requireLowLteOpen && bar.low > bar.open) {
        errors.push({
          index: i,
          timestamp: bar.timestamp,
          type: 'open_out_of_range',
          message: `Low (${bar.low}) is above Open (${bar.open}) at index ${i}`,
        });
      }

      if (cfg.requireLowLteClose && bar.low > bar.close) {
        errors.push({
          index: i,
          timestamp: bar.timestamp,
          type: 'close_out_of_range',
          message: `Low (${bar.low}) is above Close (${bar.close}) at index ${i}`,
        });
      }
    }

    return errors;
  }

  private validateVolume(data: OHLCV[]): VolumeError[] {
    const errors: VolumeError[] = [];

    for (let i = 0; i < data.length; i++) {
      const bar = data[i];

      if (bar.volume < 0) {
        errors.push({
          index: i,
          timestamp: bar.timestamp,
          type: 'negative_volume',
          message: `Negative volume at index ${i}`,
        });
      } else if (bar.volume === 0) {
        errors.push({
          index: i,
          timestamp: bar.timestamp,
          type: 'zero_volume',
          message: `Zero volume at index ${i}`,
        });
      }
    }

    return errors;
  }

  private findMissingBars(data: OHLCV[]): MissingBar[] {
    const missing: MissingBar[] = [];
    const cfg = this.config.timestamps;

    if (data.length < 2 || cfg.allowGaps) return missing;

    for (let i = 1; i < data.length; i++) {
      const prev = new Date(data[i - 1].timestamp).getTime();
      const curr = new Date(data[i].timestamp).getTime();
      const diff = curr - prev;
      const expected = cfg.expectedIntervalMs;
      const maxGap = expected * cfg.maxGapMultiplier;

      if (diff > maxGap) {
        const missed = Math.floor(diff / expected) - 1;
        for (let j = 1; j <= missed; j++) {
          const expectedTs = new Date(prev + expected * j).toISOString();
          missing.push({ expectedTimestamp: expectedTs, expectedIndex: i + j });
        }
      }
    }

    return missing;
  }

  private detectSplits(data: OHLCV[]): SplitEvent[] {
    const events: SplitEvent[] = [];
    const cfg = this.config.splitDetection;

    if (!cfg.enabled || data.length < 2) return events;

    for (let i = 1; i < data.length; i++) {
      const prevClose = data[i - 1].close;
      const currOpen = data[i].open;

      if (prevClose <= 0) continue;

      const changePercent = ((currOpen - prevClose) / prevClose) * 100;

      if (Math.abs(changePercent) >= cfg.priceChangeThresholdPercent) {
        const estimatedRatio = this.estimateSplitRatio(Math.abs(changePercent));
        events.push({
          index: i,
          timestamp: data[i].timestamp,
          priceChangePercent: changePercent,
          estimatedRatio,
        });
      }
    }

    return events;
  }

  private detectDividendAdjustments(data: OHLCV[]): DividendAdjustment[] {
    const adjustments: DividendAdjustment[] = [];
    const cfg = this.config.dividendAdjustment;

    if (!cfg.enabled || data.length < 2) return adjustments;

    for (let i = 1; i < data.length; i++) {
      const prevClose = data[i - 1].close;
      const currOpen = data[i].open;

      if (prevClose <= 0) continue;

      const changePercent = ((currOpen - prevClose) / prevClose) * 100;

      if (
        changePercent < -cfg.gapDownThresholdPercent &&
        Math.abs(changePercent) < this.config.splitDetection.priceChangeThresholdPercent
      ) {
        const volumeSpike =
          data[i].volume > data[i - 1].volume * cfg.volumeSpikeMultiplier;
        adjustments.push({
          index: i,
          timestamp: data[i].timestamp,
          priceChangePercent: changePercent,
          volumeSpike,
        });
      }
    }

    return adjustments;
  }

  private detectOutliers(data: OHLCV[]): Outlier[] {
    const outliers: Outlier[] = [];
    const cfg = this.config.outlierDetection;

    if (!cfg.enabled || data.length < cfg.minDataPoints) return outliers;

    const closes = data.map((d) => d.close);
    const volumes = data.map((d) => d.volume);

    const closeStats = this.calculateStats(closes);
    const volumeStats = this.calculateStats(volumes);

    for (let i = 0; i < data.length; i++) {
      const bar = data[i];

      if (Math.abs(bar.close - closeStats.mean) > closeStats.stdDev * cfg.priceStdDevMultiplier) {
        outliers.push({
          index: i,
          timestamp: bar.timestamp,
          field: 'close',
          value: bar.close,
          expectedRange: {
            min: closeStats.mean - closeStats.stdDev * cfg.priceStdDevMultiplier,
            max: closeStats.mean + closeStats.stdDev * cfg.priceStdDevMultiplier,
          },
          deviationPercent:
            ((bar.close - closeStats.mean) / closeStats.mean) * 100,
        });
      }

      if (Math.abs(bar.volume - volumeStats.mean) > volumeStats.stdDev * cfg.volumeStdDevMultiplier) {
        outliers.push({
          index: i,
          timestamp: bar.timestamp,
          field: 'volume',
          value: bar.volume,
          expectedRange: {
            min: Math.max(0, volumeStats.mean - volumeStats.stdDev * cfg.volumeStdDevMultiplier),
            max: volumeStats.mean + volumeStats.stdDev * cfg.volumeStdDevMultiplier,
          },
          deviationPercent:
            volumeStats.mean > 0
              ? ((bar.volume - volumeStats.mean) / volumeStats.mean) * 100
              : 0,
        });
      }
    }

    return outliers;
  }

  private calculateStats(values: number[]): { mean: number; stdDev: number } {
    if (values.length === 0) return { mean: 0, stdDev: 0 };

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }

  private estimateSplitRatio(changePercent: number): string {
    if (changePercent >= 90) return '2:1';
    if (changePercent >= 60) return '3:1';
    if (changePercent >= 40) return '3:2';
    return 'unknown';
  }

  private buildWarnings(
    data: OHLCV[],
    timestampErrors: TimestampError[],
    priceErrors: PriceError[],
    volumeErrors: VolumeError[],
    missingBars: MissingBar[],
    outliers: Outlier[],
  ): string[] {
    const warnings: string[] = [];

    if (timestampErrors.length > 0) {
      warnings.push(`${timestampErrors.length} timestamp issue(s) detected`);
    }
    if (priceErrors.length > 0) {
      warnings.push(`${priceErrors.length} OHLC integrity issue(s) detected`);
    }
    if (volumeErrors.length > 0) {
      warnings.push(`${volumeErrors.length} volume issue(s) detected`);
    }
    if (missingBars.length > 0) {
      warnings.push(`${missingBars.length} missing bar(s) detected`);
    }
    if (outliers.length > 0) {
      warnings.push(`${outliers.length} outlier(s) detected`);
    }

    const zeroVolumeCount = data.filter((d) => d.volume === 0).length;
    if (zeroVolumeCount > data.length * 0.1) {
      warnings.push(`High proportion of zero-volume bars: ${zeroVolumeCount}/${data.length}`);
    }

    return warnings;
  }

  private calculateQualityScore(
    totalBars: number,
    timestampErrors: TimestampError[],
    priceErrors: PriceError[],
    volumeErrors: VolumeError[],
    missingBars: MissingBar[],
    outliers: Outlier[],
  ): number {
    if (totalBars === 0) return 0;

    let score = 100;

    const duplicateCount = timestampErrors.filter((e) => e.type === 'duplicate').length;
    const outOfOrderCount = timestampErrors.filter((e) => e.type === 'out_of_order').length;
    const invalidFormatCount = timestampErrors.filter((e) => e.type === 'invalid_format').length;

    score -= (duplicateCount / totalBars) * 20;
    score -= (outOfOrderCount / totalBars) * 10;
    score -= (invalidFormatCount / totalBars) * 15;
    score -= (priceErrors.length / totalBars) * 30;
    score -= (volumeErrors.length / totalBars) * 5;
    score -= (missingBars.length / totalBars) * 10;
    score -= (outliers.length / totalBars) * 5;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private emptyResult(reason: string): HistoricalDatasetValidationResult {
    return {
      qualityScore: 0,
      isValid: false,
      missingBars: [],
      duplicateBars: [],
      splitDetected: [],
      dividendAdjusted: [],
      timestampErrors: [],
      priceErrors: [],
      volumeErrors: [],
      outliers: [],
      warnings: [reason],
      metadata: { totalBars: 0, validBars: 0 },
    };
  }
}
