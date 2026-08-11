import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PipelineStepDto {
  @ApiProperty({ example: 'indicators' })
  step!: string;

  @ApiProperty({ example: 12 })
  durationMs!: number;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiPropertyOptional({ example: undefined })
  error?: string;
}

export class AnalysisMetadataDto {
  @ApiProperty({ example: 150 })
  totalDurationMs!: number;

  @ApiProperty({ example: 13 })
  stepsCompleted!: number;

  @ApiProperty({ example: 13 })
  stepsSuccessful!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  analyzedAt!: string;
}

export class AnalysisResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'THYAO' })
  symbol!: string;

  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ example: true })
  isValid!: boolean;

  @ApiProperty({ type: Object })
  indicators!: any;

  @ApiProperty({ type: Object })
  marketStructure!: any;

  @ApiProperty({ type: Object })
  smartMoney!: any;

  @ApiProperty({ type: Object })
  technicalRules!: any;

  @ApiProperty({ type: Object })
  technicalScore!: any;

  @ApiProperty({ type: Object })
  technicalSummary!: any;

  @ApiProperty({ type: Object })
  financialRules!: any;

  @ApiProperty({ type: Object })
  financialScore!: any;

  @ApiProperty({ type: Object })
  financialSummary!: any;

  @ApiProperty({ type: Object })
  confluence!: any;

  @ApiProperty({ type: Object })
  candidate!: any;

  @ApiProperty({ type: Object })
  opportunity!: any;

  @ApiProperty({ type: Object })
  eliteScore!: any;

  @ApiProperty({ type: [PipelineStepDto] })
  pipelineSteps!: PipelineStepDto[];

  @ApiProperty({ type: AnalysisMetadataDto })
  metadata!: any;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class AnalysisErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Symbol is required' })
  error!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
