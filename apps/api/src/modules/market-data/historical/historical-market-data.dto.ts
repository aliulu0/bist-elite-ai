import { IsString, IsOptional, IsIn, IsBoolean, IsArray, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PLATFORM_TIMEFRAMES } from '../coverage/coverage-report.types';

export const HISTORICAL_TIMEFRAMES: readonly string[] = [...PLATFORM_TIMEFRAMES];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'date must be in YYYY-MM-DD format';

export class HistoricalStatusQueryDto {
  @ApiPropertyOptional({ enum: HISTORICAL_TIMEFRAMES, default: '1d', description: 'Timeframe' })
  @IsOptional()
  @IsString()
  @IsIn(HISTORICAL_TIMEFRAMES)
  timeframe?: string;
}

export class HistoricalRangeQueryDto extends HistoricalStatusQueryDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)', example: '2023-01-01' })
  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  from?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2026-12-31' })
  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  to?: string;
}

export class HistoricalBackfillBodyDto {
  @ApiPropertyOptional({ enum: HISTORICAL_TIMEFRAMES, default: '1d', description: 'Timeframe' })
  @IsOptional()
  @IsIn(HISTORICAL_TIMEFRAMES)
  timeframe?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)', example: '2023-01-01' })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  from?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2026-12-31' })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: DATE_MESSAGE })
  to?: string;

  @ApiPropertyOptional({ description: 'Force full re-fetch of the window even when already complete', default: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({ description: 'Concurrent range fetches (1-4)', default: 1, minimum: 1, maximum: 4 })
  @IsOptional()
  concurrency?: number;
}

export class HistoricalBulkBackfillBodyDto extends HistoricalBackfillBodyDto {
  @ApiPropertyOptional({ type: [String], description: 'Symbols; defaults to all active BIST symbols' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symbols?: string[];
}
