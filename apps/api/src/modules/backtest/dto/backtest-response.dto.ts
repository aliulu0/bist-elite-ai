import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BacktestResult } from '../backtest.types';
import { LearningSummaryDto } from './learning-report.dto';
import { Timeframe } from '../../indicators/indicator.types';
import { BacktestType, TimeRange } from '../backtest.types';

export class BacktestSummaryDto {
  @ApiProperty({ example: 12.5, description: 'Toplam getiri (%)' })
  totalReturn!: number;

  @ApiProperty({ example: 25.3, description: 'CAGR (%)' })
  cagr!: number;

  @ApiProperty({ example: 1.42, description: 'Sharpe oranı' })
  sharpeRatio!: number;

  @ApiProperty({ example: 8.1, description: 'Maksimum çekilme (%)' })
  maxDrawdown!: number;

  @ApiProperty({ example: 70, description: 'Kazanma oranı (%)' })
  winRate!: number;

  @ApiProperty({ example: 156, description: 'Toplam işlem sayısı' })
  totalTrades!: number;

  @ApiProperty({ example: 2.4, description: 'Profit faktörü' })
  profitFactor!: number;
}

export class BacktestResponseDto {
  @ApiProperty({ example: 'THYAO.IS:1d:indicator', description: 'Backtest kimliği' })
  id!: string;

  @ApiProperty({ example: 'THYAO.IS', description: 'Sembol' })
  symbol!: string;

  @ApiProperty({ example: '1d', enum: ['4h', '1d', '1w', '1m', '3m', '6m'] })
  timeframe!: Timeframe;

  @ApiProperty({ example: 'indicator', enum: ['elite-score', 'opportunity', 'strategy', 'momentum', 'indicator', 'portfolio', 'multi-factor'] })
  backtestType!: BacktestType;

  @ApiProperty({ example: '1Y', enum: ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '10Y', 'max'] })
  timeRange!: TimeRange;

  @ApiProperty({ example: 100000, description: 'Başlangıç sermayeti' })
  initialCapital!: number;

  @ApiProperty({ type: Object, description: 'Tam backtest sonucu' })
  result!: BacktestResult;

  @ApiProperty({ type: LearningSummaryDto, description: 'Öğrenme özetinin kısa çıktığı' })
  learning!: LearningSummaryDto;

  @ApiPropertyOptional({ description: 'Benchmark karşılaştırma özetinin kısa çıktığı', nullable: true, type: Object })
  benchmark?: {
    strategyReturn: number;
    benchmarkReturn: number;
    alpha: number;
    beta: number;
    informationRatio: number;
    isValid: boolean;
  } | null;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z', description: 'Oluşturulma zamanı' })
  createdAt!: string;
}

export class BacktestHistoryItemDto {
  @ApiProperty({ example: 'THYAO.IS:1d:indicator' })
  id!: string;

  @ApiProperty({ example: 'THYAO.IS' })
  symbol!: string;

  @ApiProperty({ example: '1d' })
  timeframe!: Timeframe;

  @ApiProperty({ example: 'indicator' })
  backtestType!: BacktestType;

  @ApiProperty({ example: 12.5 })
  totalReturn!: number;

  @ApiProperty({ example: 1.42 })
  sharpeRatio!: number;

  @ApiProperty({ example: 8.1 })
  maxDrawdown!: number;

  @ApiProperty({ example: 70 })
  winRate!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;
}
