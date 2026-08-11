import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AccumulationLevel,
  DistributionLevel,
  LiquidityLevel,
  MoneyFlowDirection,
  RiskLevel,
  SmartMoneyScoreResult,
} from '../smart-money.types';

export class SmartMoneyScoreDto {
  @ApiProperty({ example: 'ASELS.IS' })
  ticker!: string;

  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ example: 93, description: 'Smart Money puanı (0-100)' })
  smartMoneyScore!: number;

  @ApiProperty({ example: 78, description: 'Likidite puanı (0-100)' })
  liquidityScore!: number;

  @ApiProperty({ example: 85, description: 'Hacim puanı (0-100)' })
  volumeScore!: number;

  @ApiProperty({ example: 90, description: 'Birikim puanı (0-100)' })
  accumulationScore!: number;

  @ApiProperty({ example: 15, description: 'Dağıtım puanı (0-100)' })
  distributionScore!: number;

  @ApiProperty({ example: 2.4, description: 'Göreli hacim (x)' })
  relativeVolume!: number;

  @ApiProperty({ example: 2.1, description: 'Hacim sıçraması (x)' })
  volumeSpike!: number;

  @ApiProperty({ example: 0.35, description: 'Hacim SMA eğilimi (fraksiyonel)' })
  volumeSmaTrend!: number;

  @ApiProperty({ example: 'strong_positive', enum: ['strong_positive', 'positive', 'neutral', 'negative', 'strong_negative'] })
  moneyFlow!: MoneyFlowDirection;

  @ApiProperty({ example: 82 })
  moneyFlowScore!: number;

  @ApiProperty({ example: 'accumulating', enum: ['accumulating', 'distributing', 'neutral'] })
  institutionalActivity!: 'accumulating' | 'distributing' | 'neutral';

  @ApiProperty({ example: 91, description: 'Güven oranı (%)' })
  confidence!: number;

  @ApiProperty({ example: 'low', enum: ['low', 'medium', 'high'] })
  risk!: RiskLevel;

  @ApiProperty({ example: 22 })
  riskScore!: number;

  @ApiProperty({ example: 'high', enum: ['high', 'medium', 'low'] })
  liquidity!: LiquidityLevel;

  @ApiProperty({ example: 'very_strong', enum: ['very_strong', 'strong', 'moderate', 'weak', 'none'] })
  accumulationLevel!: AccumulationLevel;

  @ApiProperty({ example: 'low', enum: ['very_high', 'high', 'moderate', 'low', 'none'] })
  distributionLevel!: DistributionLevel;

  @ApiProperty({ example: 2500000 })
  avgDailyVolume!: number;

  @ApiProperty({ example: 8 })
  accumulationDays!: number;

  @ApiProperty({ example: 2 })
  distributionDays!: number;

  @ApiProperty({ example: true })
  breakoutVolume!: boolean;

  @ApiProperty({ type: Object, isArray: true })
  signals!: Array<{ type: string; strength: number; description: string }>;

  @ApiPropertyOptional({ example: 'TRUE', nullable: true })
  verification!: string | null;

  @ApiPropertyOptional({ example: 94, nullable: true })
  catalystScore!: number | null;

  @ApiProperty({ example: '2026-08-07T12:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: true })
  isValid!: boolean;

  static from(result: SmartMoneyScoreResult): SmartMoneyScoreDto {
    return { ...result };
  }
}

export class SmartMoneyTopDto {
  @ApiProperty({ type: SmartMoneyScoreDto, isArray: true })
  results!: SmartMoneyScoreDto[];

  @ApiProperty({ example: '2026-08-07T12:00:00.000Z' })
  generatedAt!: string;
}

export class SmartMoneyRefreshDto {
  @ApiProperty({ example: 'ASELS.IS' })
  ticker!: string;

  @ApiProperty({ type: SmartMoneyScoreDto })
  result!: SmartMoneyScoreDto;
}
