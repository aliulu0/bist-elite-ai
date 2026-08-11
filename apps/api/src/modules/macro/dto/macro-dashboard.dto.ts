import { MacroDataPoint, MacroDataSnapshot, MarketImpact, MarketRegimeType, MacroAlertEvent } from '../macro.types';
import { TCMBDecisionRecord } from '../macro-elite.types';
import { TCMBDecisionAnalysis } from '../engines/tcmb-decision-analyzer';
import { ApiProperty } from '@nestjs/swagger';

export interface MacroDashboardSnapshotDto {
  macroScore: number | null;
  regime: MarketRegimeType | null;
  tcmb: {
    policyRate: MacroDataPoint | null;
    decisionText: MacroDataPoint | null;
    lastDecision: TCMBDecisionAnalysis | null;
  } | null;
  keyIndicators: MacroDataPoint[];
  fetchedAt: string;
}

export interface MacroHistoricalPointDto {
  source: string;
  timestamp: string;
  value: number;
}

export interface TCMBDecisionHistoryDto {
  decisions: TCMBDecisionRecord[];
  total: number;
}

export interface MacroAlertDto {
  id: string;
  type: MacroAlertEvent['type'];
  title: string;
  message: string;
  severity: MacroAlertEvent['severity'];
  source: string;
  timestamp: string;
}

export interface SectorModelDto {
  sector: string;
  impact: MarketImpact;
  impactScore: number;
  bestScore: number;
  scoreSource: 'ranking' | 'macro_elite' | 'unavailable';
  drivers: string[];
  updatedAt: string;
}

export class MacroEliteCardDto {
  @ApiProperty({ example: 58 })
  score!: number;

  @ApiProperty({ example: 72 })
  confidence!: number;

  @ApiProperty({ example: 'stable', enum: ['improving', 'stable', 'deteriorating'] })
  trend!: string;

  @ApiProperty({ example: 'moderate', enum: ['low', 'moderate', 'high', 'extreme'] })
  riskLevel!: string;

  @ApiProperty({ example: 'selective', enum: ['opportunistic', 'selective', 'defensive', 'cash'] })
  recommendation!: string;

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z' })
  lastUpdated!: string;
}

export class MacroTrendCardDto {
  @ApiProperty({ example: 'stable', enum: ['improving', 'stable', 'deteriorating'] })
  trend!: string;

  @ApiProperty({ example: 0 })
  change!: number;

  @ApiProperty({ example: 58 })
  currentScore!: number;

  @ApiProperty({ example: 58, nullable: true })
  previousScore!: number | null;

  @ApiProperty({ type: [String] })
  drivers!: string[];

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z' })
  timestamp!: string;
}

export class MacroRiskCardDto {
  @ApiProperty({ example: 'moderate', enum: ['low', 'moderate', 'high', 'extreme'] })
  level!: string;

  @ApiProperty({ example: 42 })
  score!: number;

  @ApiProperty({ type: [String] })
  drivers!: string[];

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z' })
  timestamp!: string;
}

export class MacroOpportunityDto {
  @ApiProperty({ example: 'THYAO' })
  ticker!: string;

  @ApiProperty({ example: 'Türk Hava Yolları' })
  name!: string;

  @ApiProperty({ example: 'Transportation' })
  sector!: string;

  @ApiProperty({ example: 71 })
  eliteScore!: number;

  @ApiProperty({ example: 58 })
  macroScore!: number;

  @ApiProperty({ example: 66 })
  combinedConfidence!: number;

  @ApiProperty({ example: 'high', enum: ['high', 'medium', 'low'] })
  priority!: string;

  @ApiProperty({ example: 'positive' })
  sectorImpact!: MarketImpact;
}

export class MacroDashboardBundleDto {
  @ApiProperty({ type: Object })
  snapshot!: MacroDashboardSnapshotDto;

  @ApiProperty({ type: [Object] })
  history!: MacroHistoricalPointDto[];

  @ApiProperty({ type: Object })
  decisionHistory!: TCMBDecisionHistoryDto;

  @ApiProperty({ type: [Object] })
  alerts!: MacroAlertDto[];

  @ApiProperty({ type: [Object] })
  sectors!: SectorModelDto[];

  @ApiProperty({ type: MacroEliteCardDto })
  elite!: MacroEliteCardDto;

  @ApiProperty({ type: MacroTrendCardDto })
  trendCard!: MacroTrendCardDto;

  @ApiProperty({ type: MacroRiskCardDto })
  riskCard!: MacroRiskCardDto;

  @ApiProperty({ type: [MacroOpportunityDto] })
  opportunities!: MacroOpportunityDto[];

  @ApiProperty({
    type: 'object',
    properties: {
      action: { type: 'string', example: 'selective' },
      summary: { type: 'string' },
      reasons: { type: 'array', items: { type: 'string' } },
      score: { type: 'number', example: 58 },
    },
  })
  recommendation!: unknown;

  @ApiProperty({
    type: 'object',
    properties: {
      eliteConfidence: { type: 'number', example: 70 },
      macroConfidence: { type: 'number', example: 72 },
      combined: { type: 'number', example: 71 },
      weightElite: { type: 'number', example: 0.5 },
      weightMacro: { type: 'number', example: 0.5 },
      calculatedAt: { type: 'string' },
    },
  })
  combinedConfidence!: unknown;

  @ApiProperty({ type: Object })
  observability!: unknown;

  @ApiProperty({ type: Object })
  raw!: MacroDataSnapshot;
}
