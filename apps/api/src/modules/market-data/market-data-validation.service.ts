import { Injectable, Logger } from '@nestjs/common';
import { MarketDataPoint, ValidationStatus, ValidationResult } from './interfaces';

@Injectable()
export class MarketDataValidationService {
  private readonly logger = new Logger(MarketDataValidationService.name);

  validateDataPoint(point: Partial<MarketDataPoint>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!point.symbol || typeof point.symbol !== 'string') {
      errors.push('symbol is required and must be a string');
    }

    if (!point.timeframe || typeof point.timeframe !== 'string') {
      errors.push('timeframe is required and must be a string');
    }

    if (typeof point.open !== 'number' || !Number.isFinite(point.open)) {
      errors.push('open must be a valid number');
    }

    if (typeof point.high !== 'number' || !Number.isFinite(point.high)) {
      errors.push('high must be a valid number');
    }

    if (typeof point.low !== 'number' || !Number.isFinite(point.low)) {
      errors.push('low must be a valid number');
    }

    if (typeof point.close !== 'number' || !Number.isFinite(point.close)) {
      errors.push('close must be a valid number');
    }

    if (typeof point.volume !== 'number' || !Number.isFinite(point.volume)) {
      errors.push('volume must be a valid number');
    }

    if (!point.timestamp || typeof point.timestamp !== 'string') {
      errors.push('timestamp is required and must be a string');
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    if (point.high! < point.low!) {
      errors.push('high must be >= low');
    }

    if (point.high! < point.open!) {
      errors.push('high must be >= open');
    }

    if (point.high! < point.close!) {
      errors.push('high must be >= close');
    }

    if (point.low! > point.open!) {
      errors.push('low must be <= open');
    }

    if (point.low! > point.close!) {
      errors.push('low must be <= close');
    }

    if (point.volume! < 0) {
      errors.push('volume must be >= 0');
    }

    if (point.open! <= 0 || point.high! <= 0 || point.low! <= 0 || point.close! <= 0) {
      warnings.push('OHLC values should be > 0');
    }

    if (point.timestamp) {
      const date = new Date(point.timestamp);
      if (Number.isNaN(date.getTime())) {
        errors.push('timestamp is not a valid date');
      } else if (date > new Date()) {
        warnings.push('timestamp is in the future');
      }
    }

    const status: ValidationStatus =
      errors.length > 0 ? 'invalid' : warnings.length > 0 ? 'partial' : 'valid';

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      _status: status,
    } as ValidationResult & { _status: ValidationStatus };
  }

  validateDataPoints(points: MarketDataPoint[]): MarketDataPoint[] {
    const validated: MarketDataPoint[] = [];
    const seen = new Set<string>();
    let duplicates = 0;

    for (const point of points) {
      const result = this.validateDataPoint(point);

      if (!result.isValid) {
        this.logger.warn(
          `Invalid data point for ${point.symbol} (${point.timeframe}): ${result.errors.join(', ')}`,
        );
        point.validationStatus = 'invalid';
      } else if (result.warnings.length > 0) {
        point.validationStatus = 'partial';
      } else {
        point.validationStatus = 'valid';
      }

      const key = `${point.symbol}|${point.timestamp}`;
      if (seen.has(key)) {
        duplicates++;
        point.validationStatus = 'invalid';
        this.logger.warn(`Duplicate candle for ${point.symbol} at ${point.timestamp}`);
      } else {
        seen.add(key);
      }

      validated.push(point);
    }

    if (duplicates > 0) {
      this.logger.warn(`${duplicates} duplicate candle(s) detected across ${points.length} points`);
    }

    return validated;
  }

  getStatus(point: Partial<MarketDataPoint>): ValidationStatus {
    const result = this.validateDataPoint(point);
    if (!result.isValid) return 'invalid';
    if (result.warnings.length > 0) return 'partial';
    return 'valid';
  }
}
