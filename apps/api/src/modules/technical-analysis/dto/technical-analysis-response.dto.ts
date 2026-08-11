import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IndicatorResultDto {
  @ApiProperty({ example: 'RSI' })
  indicator!: string;

  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ example: '2025-01-15T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 55.3, nullable: true })
  value!: number | number[] | Record<string, number | boolean> | null;

  @ApiProperty({ example: {} })
  metadata!: Record<string, unknown>;

  @ApiProperty({ example: true })
  isValid!: boolean;
}

export class SwingPointDto {
  @ApiProperty({ example: 10 })
  index!: number;

  @ApiProperty({ example: 95.5 })
  price!: number;

  @ApiProperty({ example: '2025-01-10T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 'high', enum: ['high', 'low'] })
  type!: string;
}

export class ZoneDto {
  @ApiProperty({ example: 95.0 })
  upper!: number;

  @ApiProperty({ example: 93.5 })
  lower!: number;

  @ApiProperty({ example: 5 })
  touches!: number;
}

export class MarketStructureDto {
  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ example: 'uptrend', enum: ['uptrend', 'downtrend', 'sideways'] })
  trend!: string;

  @ApiProperty({ type: [SwingPointDto] })
  swingHighs!: SwingPointDto[];

  @ApiProperty({ type: [SwingPointDto] })
  swingLows!: SwingPointDto[];

  @ApiProperty({ type: [ZoneDto] })
  supportZones!: ZoneDto[];

  @ApiProperty({ type: [ZoneDto] })
  resistanceZones!: ZoneDto[];

  @ApiProperty({ example: true })
  isValid!: boolean;
}

export class SmartMoneySignalDto {
  @ApiProperty({ example: 'accumulation' })
  type!: string;

  @ApiProperty({ example: 0.75 })
  strength!: number;

  @ApiProperty({ example: 'Accumulation detected' })
  description!: string;
}

export class SmartMoneyDto {
  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ example: 0.72 })
  accumulationScore!: number;

  @ApiProperty({ example: 0.28 })
  distributionScore!: number;

  @ApiProperty({ example: 'accumulating', enum: ['accumulating', 'distributing', 'neutral'] })
  institutionalActivity!: string;

  @ApiProperty({ example: 0.65 })
  smartMoneyConfidence!: number;

  @ApiProperty({ type: [SmartMoneySignalDto] })
  signals!: SmartMoneySignalDto[];

  @ApiProperty({ example: true })
  isValid!: boolean;
}

export class TechnicalRuleResultDto {
  @ApiProperty({ example: 'EMA_ALIGNMENT' })
  rule!: string;

  @ApiProperty({ example: 'trend' })
  category!: string;

  @ApiProperty({ example: 'PASS', enum: ['PASS', 'WARNING', 'FAIL', 'NOT_AVAILABLE'] })
  status!: string;

  @ApiProperty({ example: 'EMA alignment is bullish' })
  description!: string;

  @ApiProperty({ example: null, nullable: true })
  value!: unknown;

  @ApiProperty({ example: {} })
  metadata!: Record<string, unknown>;
}

export class TechnicalRulesDto {
  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ type: [TechnicalRuleResultDto] })
  rules!: TechnicalRuleResultDto[];

  @ApiProperty({ example: true })
  isValid!: boolean;
}

export class RuleScoreDto {
  @ApiProperty({ example: 'EMA_ALIGNMENT' })
  rule!: string;

  @ApiProperty({ example: 'trend' })
  category!: string;

  @ApiProperty({ example: 'PASS' })
  status!: string;

  @ApiProperty({ example: 8 })
  weight!: number;

  @ApiProperty({ example: 8 })
  contribution!: number;
}

export class TechnicalScoreDto {
  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ example: 72.5 })
  score!: number;

  @ApiProperty({ example: 'B', enum: ['A+', 'A', 'B', 'C', 'D'] })
  grade!: string;

  @ApiProperty({ example: 0.85 })
  confidence!: number;

  @ApiProperty({ type: [RuleScoreDto] })
  ruleBreakdown!: RuleScoreDto[];

  @ApiProperty({ example: true })
  isValid!: boolean;
}

export class TechnicalSummaryDto {
  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ example: 'Technical grade: B (73/100). 8 rules passing. 3 warnings. 2 failing.' })
  summary!: string;

  @ApiProperty({ example: 'Neutral-to-bullish. Some positive signals but mixed conviction.' })
  overallOpinion!: string;

  @ApiProperty({ type: [String], example: ['EMA alignment is bullish (price above all EMAs)'] })
  strengths!: string[];

  @ApiProperty({ type: [String], example: ['RSI is approaching overbought/oversold'] })
  weaknesses!: string[];

  @ApiProperty({ type: [String], example: ['Momentum loss risk'] })
  risks!: string[];

  @ApiProperty({ type: [String], example: ['Mixed signals — wait for clearer confirmation before acting'] })
  recommendations!: string[];

  @ApiProperty({ example: true })
  isValid!: boolean;
}

export class TechnicalAnalysisResponseDto {
  @ApiProperty({ example: 'THYAO' })
  symbol!: string;

  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ type: [IndicatorResultDto] })
  indicatorSummary!: IndicatorResultDto[];

  @ApiProperty({ type: MarketStructureDto })
  marketStructure!: MarketStructureDto;

  @ApiProperty({ type: SmartMoneyDto })
  smartMoney!: SmartMoneyDto;

  @ApiProperty({ type: TechnicalRulesDto })
  technicalRules!: TechnicalRulesDto;

  @ApiProperty({ type: TechnicalScoreDto })
  technicalScore!: TechnicalScoreDto;

  @ApiProperty({ type: TechnicalSummaryDto })
  technicalSummary!: TechnicalSummaryDto;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class TechnicalAnalysisErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Symbol is required' })
  error!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
