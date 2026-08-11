import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkflowStepResultDto {
  @ApiProperty({ example: 'fetch_data' })
  step!: string;

  @ApiProperty({ example: 'completed', enum: ['pending', 'running', 'completed', 'failed', 'skipped'] })
  status!: string;

  @ApiPropertyOptional({ example: '2025-01-15T12:00:00.000Z' })
  startedAt!: string | null;

  @ApiPropertyOptional({ example: '2025-01-15T12:00:05.000Z' })
  completedAt!: string | null;

  @ApiProperty({ example: 5000 })
  durationMs!: number;

  @ApiProperty({ example: 1 })
  attempt!: number;

  @ApiPropertyOptional({ example: null })
  error!: string | null;

  @ApiProperty({ type: Object })
  metadata!: Record<string, unknown>;
}

export class WorkflowInstanceDto {
  @ApiProperty({ example: 'wf-1700000000000-0a1b' })
  id!: string;

  @ApiProperty({ example: 'single_stock_analysis', enum: ['single_stock_analysis', 'market_scan', 'backtest', 'optimization'] })
  type!: string;

  @ApiProperty({ example: 'running', enum: ['pending', 'queued', 'running', 'completed', 'failed', 'timeout', 'cancelled'] })
  status!: string;

  @ApiPropertyOptional({ example: 'THYAO' })
  symbol!: string | null;

  @ApiProperty({ type: [WorkflowStepResultDto] })
  steps!: WorkflowStepResultDto[];

  @ApiPropertyOptional({ example: 'indicators' })
  currentStep!: string | null;

  @ApiProperty({ example: 25 })
  progress!: number;

  @ApiPropertyOptional({ example: '2025-01-15T12:00:00.000Z' })
  startedAt!: string | null;

  @ApiPropertyOptional({ example: '2025-01-15T12:05:00.000Z' })
  completedAt!: string | null;

  @ApiProperty({ example: 300000 })
  durationMs!: number;

  @ApiProperty({ example: 0 })
  retryCount!: number;

  @ApiProperty({ type: Object })
  metadata!: Record<string, unknown>;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;
}

export class CreateWorkflowResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: WorkflowInstanceDto })
  data!: WorkflowInstanceDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class WorkflowPageDto {
  @ApiProperty({ type: [WorkflowInstanceDto] })
  data!: WorkflowInstanceDto[];

  @ApiProperty({ example: 5 })
  total!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class WorkflowStatisticsDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 100 })
  totalCreated!: number;

  @ApiProperty({ example: 80 })
  totalCompleted!: number;

  @ApiProperty({ example: 10 })
  totalFailed!: number;

  @ApiProperty({ example: 5 })
  totalCancelled!: number;

  @ApiProperty({ example: 3 })
  totalTimedOut!: number;

  @ApiProperty({ example: 5 })
  activeWorkflows!: number;

  @ApiProperty({ example: 300000 })
  avgDurationMs!: number;

  @ApiProperty({ type: Object })
  byType!: Record<string, { created: number; completed: number; failed: number }>;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class WorkflowActionResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: WorkflowInstanceDto })
  data!: WorkflowInstanceDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class WorkflowErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Workflow not found' })
  error!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
