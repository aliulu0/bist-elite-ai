import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Timeframe } from '../../indicators/indicator.types';
import {
  LiquidityQuality,
  MomentumLabel,
  PredictionResult,
  PredictionScenario,
  PredictionSignal,
  PredictionTimeframe,
  RiskLevel,
  TrendDirectionLabel,
  TrendStrengthLabel,
} from '../prediction.types';

export class PredictionScenarioDto {
  @ApiProperty({ example: 'bullish', enum: ['bullish', 'neutral', 'bearish'] })
  bias!: PredictionScenario['bias'];

  @ApiProperty({ example: 'Yükseliş Senaryosu' })
  title!: string;

  @ApiProperty({ example: 'Fiyatın 170 hedef seviyesine doğru ilerlemesi' })
  description!: string;

  @ApiProperty({ example: 91, description: 'Olasılık (%)' })
  probability!: number;

  @ApiProperty({ example: 'Fiyat EMA/SMA yapısı üzerinde kalırsa ve momentum pozitif kalırsa' })
  trigger!: string;

  @ApiProperty({ example: 6.4, description: 'Senaryo beklenen getiri (%)' })
  expectedReturn!: number;
}

export class PredictionSignalDto {
  @ApiProperty({ example: 'trend_bullish' })
  type!: string;

  @ApiProperty({ example: 82 })
  strength!: number;

  @ApiProperty({ example: 'Fiyat yapısı yükseliş eğiliminde' })
  description!: string;
}

export class PredictionHoldingPeriodDto {
  @ApiProperty({ example: 4 })
  value!: number;

  @ApiProperty({ example: 'days', enum: ['hours', 'days', 'weeks', 'months'] })
  unit!: string;
}

export class PredictionDto {
  @ApiProperty({ example: 'ASELS.IS' })
  ticker!: string;

  @ApiProperty({ example: '1d', enum: ['1h', '2h', '4h', '1d', '1w', '1m', '3m', '6m'] })
  timeframe!: PredictionTimeframe;

  @ApiProperty({ example: '1d', description: 'Analiz için kullanılan veri zaman dilimi' })
  dataTimeframe!: Timeframe;

  @ApiProperty({ example: 91, description: 'Yükseliş olasılığı (%)' })
  bullishProbability!: number;

  @ApiProperty({ example: 9, description: 'Düşüş olasılığı (%)' })
  bearishProbability!: number;

  @ApiProperty({ example: 0, description: 'Yatay olasılık (%)' })
  neutralProbability!: number;

  @ApiProperty({ example: 92, description: 'Güven oranı (%)' })
  confidence!: number;

  @ApiProperty({ example: 'strong', enum: ['strong', 'moderate', 'weak'] })
  trendStrength!: TrendStrengthLabel;

  @ApiProperty({ example: 'up', enum: ['up', 'down', 'sideways'] })
  trendDirection!: TrendDirectionLabel;

  @ApiProperty({ example: 'strong_bullish', enum: ['strong_bullish', 'bullish', 'neutral', 'bearish', 'strong_bearish'] })
  momentum!: MomentumLabel;

  @ApiProperty({ example: 6.4, description: 'Beklenen getiri (%)' })
  expectedReturn!: number;

  @ApiProperty({ example: 2.1, description: 'Beklenen oynaklık (%)' })
  expectedVolatility!: number;

  @ApiProperty({ example: 'medium', enum: ['low', 'medium', 'high'] })
  risk!: RiskLevel;

  @ApiProperty({ example: 42 })
  riskScore!: number;

  @ApiProperty({ example: 'high', enum: ['high', 'medium', 'low'] })
  liquidityQuality!: LiquidityQuality;

  @ApiProperty({ type: PredictionHoldingPeriodDto })
  expectedHoldingPeriod!: PredictionHoldingPeriodDto;

  @ApiPropertyOptional({ type: Object, nullable: true, example: { min: 158, max: 161 } })
  entryZone!: { min: number; max: number } | null;

  @ApiPropertyOptional({ example: 154, nullable: true })
  stopZone!: number | null;

  @ApiPropertyOptional({ example: 170, nullable: true })
  target1!: number | null;

  @ApiPropertyOptional({ example: 177, nullable: true })
  target2!: number | null;

  @ApiPropertyOptional({ example: 1.7, nullable: true })
  riskRewardRatio!: number | null;

  @ApiProperty({ type: PredictionScenarioDto, isArray: true })
  scenarios!: PredictionScenarioDto[];

  @ApiProperty({ type: PredictionSignalDto, isArray: true })
  signals!: PredictionSignalDto[];

  @ApiProperty({ type: Object })
  backtestAccuracy!: { winRate: number; totalTrades: number; sharpeRatio: number; isValid: boolean };

  @ApiPropertyOptional({ example: 'TRUE', nullable: true })
  verification!: string | null;

  @ApiPropertyOptional({ example: 94, nullable: true })
  catalystScore!: number | null;

  @ApiProperty({ example: 93 })
  smartMoneyScore!: number;

  @ApiProperty({ example: '2026-08-07T12:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: true })
  isValid!: boolean;

  static from(result: PredictionResult): PredictionDto {
    return { ...result };
  }
}

export class PredictionTopDto {
  @ApiProperty({ type: PredictionDto, isArray: true })
  results!: PredictionDto[];

  @ApiProperty({ example: '2026-08-07T12:00:00.000Z' })
  generatedAt!: string;
}

export class PredictionRefreshDto {
  @ApiProperty({ example: 'ASELS.IS' })
  ticker!: string;

  @ApiProperty({ type: PredictionDto })
  result!: PredictionDto;
}
