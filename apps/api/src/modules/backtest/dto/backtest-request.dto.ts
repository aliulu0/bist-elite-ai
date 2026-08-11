import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min, IsInt } from 'class-validator';
import { Timeframe } from '../../indicators/indicator.types';
import { BacktestType, TimeRange } from '../backtest.types';

export class BacktestRequestDto {
  @ApiPropertyOptional({ example: 'THYAO.IS', description: 'Geriye döndürülecek hisse sembolü', required: true })
  @IsString()
  symbol!: string;

  @ApiPropertyOptional({ example: '1d', enum: ['4h', '1d', '1w', '1m', '3m', '6m'], description: 'Zaman çerçevesi', required: true })
  @IsOptional()
  @IsEnum({ '4h': '4h', '1d': '1d', '1w': '1w', '1m': '1m', '3m': '3m', '6m': '6m' })
  timeframe?: Timeframe = '1d';

  @ApiPropertyOptional({
    example: 'indicator',
    enum: ['elite-score', 'opportunity', 'strategy', 'momentum', 'indicator', 'portfolio', 'multi-factor'],
    description: 'Backtest stratejisi tipi',
  })
  @IsOptional()
  @IsEnum({
    'elite-score': 'elite-score',
    opportunity: 'opportunity',
    strategy: 'strategy',
    momentum: 'momentum',
    indicator: 'indicator',
    portfolio: 'portfolio',
    'multi-factor': 'multi-factor',
  })
  backtestType?: BacktestType = 'indicator';

  @ApiPropertyOptional({ example: '1Y', enum: ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '10Y', 'max'], description: 'Zaman aralığı' })
  @IsOptional()
  @IsEnum({ '1M': '1M', '3M': '3M', '6M': '6M', '1Y': '1Y', '2Y': '2Y', '3Y': '3Y', '5Y': '5Y', '10Y': '10Y', max: 'max' })
  timeRange?: TimeRange = '1Y';

  @ApiPropertyOptional({ example: 100000, description: 'Başlangıç sermayesi', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  initialCapital?: number = 100000;

  @ApiPropertyOptional({ example: 'XU030.IS', description: 'Bankacılama karşılığı sembolü' })
  @IsOptional()
  @IsString()
  benchmarkTicker?: string;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Başlangıç tarihi (ISO)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Bitiş tarihi (ISO)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 252, description: 'Maksimum bар sayısı', minimum: 2 })
  @IsOptional()
  @IsInt()
  @Min(2)
  limit?: number;
}
