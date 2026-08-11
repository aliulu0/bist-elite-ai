import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { TCMBDecisionAnalysis } from '../engines/tcmb-decision-analyzer';

export class MacroConfidenceQueryDto {
  @ApiPropertyOptional({
    description: 'Elite (micro) confidence — accepts 0-1 or 0-100 scale',
    example: 0.7,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  eliteConfidence?: number;
}

export class MacroRecommendationDto {
  @ApiProperty({ example: 'selective', enum: ['opportunistic', 'selective', 'defensive', 'cash'] })
  action!: string;

  @ApiProperty({ example: 'Macro conditions mixed (score 58); prefer selective, high-quality positions.' })
  summary!: string;

  @ApiProperty({ type: [String] })
  reasons!: string[];

  @ApiProperty({ example: 58 })
  score!: number;
}

export class MacroRiskDto {
  @ApiProperty({ example: 'moderate', enum: ['low', 'moderate', 'high', 'extreme'] })
  level!: string;

  @ApiProperty({ example: 42 })
  score!: number;

  @ApiProperty({ type: [String] })
  drivers!: string[];
}

export class MacroEliteComponentDto {
  @ApiProperty({ example: 'monetaryPolicy' })
  name!: string;

  @ApiProperty({ example: 45 })
  score!: number;

  @ApiProperty({ example: 0.25 })
  weight!: number;

  @ApiProperty({ example: 11.25 })
  weighted!: number;

  @ApiProperty({ example: 'ready', enum: ['ready', 'pending', 'stale'] })
  status!: string;

  @ApiProperty({ example: 'monetaryPolicy component score 45' })
  detail!: string;
}

export class MacroDecisionDto {
  @ApiProperty({ example: '1f0a2b3c-...' })
  id!: string;

  @ApiProperty({ example: '2026-07-24' })
  meetingDate!: string;

  @ApiProperty({ example: 42.5, nullable: true })
  policyRate!: number | null;

  @ApiProperty({ example: 45.0, nullable: true })
  previousPolicyRate!: number | null;

  @ApiProperty({ type: Object })
  analysis!: TCMBDecisionAnalysis;

  @ApiProperty()
  rawText!: string;

  @ApiProperty()
  storedAt!: string;
}

export class MacroEliteResultDto {
  @ApiProperty({ example: 58 })
  eliteScore!: number;

  @ApiProperty({ example: 72 })
  confidence!: number;

  @ApiProperty({ example: 'stable', enum: ['improving', 'stable', 'deteriorating'] })
  trend!: string;

  @ApiProperty({ type: MacroRiskDto })
  risk!: MacroRiskDto;

  @ApiProperty({ type: MacroRecommendationDto })
  recommendation!: MacroRecommendationDto;

  @ApiProperty({ type: [MacroEliteComponentDto] })
  components!: MacroEliteComponentDto[];

  @ApiProperty({ type: MacroDecisionDto, nullable: true })
  decision!: MacroDecisionDto | null;

  @ApiProperty()
  calculatedAt!: string;
}

export class MacroTrendDto {
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

  @ApiProperty()
  timestamp!: string;
}

export class CombinedConfidenceDto {
  @ApiProperty({ example: 70 })
  eliteConfidence!: number;

  @ApiProperty({ example: 72 })
  macroConfidence!: number;

  @ApiProperty({ example: 71 })
  combined!: number;

  @ApiProperty({ example: 0.5 })
  weightElite!: number;

  @ApiProperty({ example: 0.5 })
  weightMacro!: number;

  @ApiProperty()
  calculatedAt!: string;
}

export class ProviderObservabilityDto {
  @ApiProperty({ example: 'tcmb' })
  name!: string;

  @ApiProperty({ example: true })
  connected!: boolean;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ example: 5 })
  priority!: number;

  @ApiProperty({ example: 'CLOSED', enum: ['CLOSED', 'OPEN', 'HALF_OPEN'] })
  circuitState!: string;

  @ApiProperty({ example: 420000, nullable: true })
  lastSuccessAgeMs!: number | null;

  @ApiProperty({ example: '2026-07-31T10:00:00.000Z', nullable: true })
  lastHealthCheck!: string | null;

  @ApiProperty({ example: 12 })
  totalRequests!: number;

  @ApiProperty({ example: 10 })
  successfulRequests!: number;

  @ApiProperty({ example: 2 })
  failedRequests!: number;

  @ApiProperty({ example: 180 })
  avgLatencyMs!: number;
}

export class MacroObservabilityDto {
  @ApiProperty({ example: 58 })
  macroScore!: number;

  @ApiProperty({ example: 72 })
  macroConfidence!: number;

  @ApiProperty({
    type: 'object',
    properties: {
      ageHours: { type: 'number', nullable: true, example: 168.5 },
      source: { type: 'string', nullable: true, example: 'tcmb-decision-analyzer' },
      meetingDate: { type: 'string', nullable: true, example: '2026-07-24' },
      sentiment: { type: 'string', nullable: true, example: 'neutral' },
    },
  })
  decision!: {
    ageHours: number | null;
    source: string | null;
    meetingDate: string | null;
    sentiment: string | null;
  };

  @ApiProperty({ type: [ProviderObservabilityDto] })
  providers!: ProviderObservabilityDto[];

  @ApiProperty()
  lastUpdate!: string;
}
