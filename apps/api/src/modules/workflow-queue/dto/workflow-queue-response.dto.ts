import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueueWorkerDto {
  @ApiProperty({ example: 0 })
  id!: number;

  @ApiProperty({ example: false })
  busy!: boolean;

  @ApiPropertyOptional({ example: 'jq-1700000000000-abc' })
  jobId!: string | null;

  @ApiPropertyOptional({ example: '2025-01-15T12:00:00.000Z' })
  startedAt!: string | null;
}

export class QueueJobDto {
  @ApiProperty({ example: 'jq-1700000000000-abc' })
  id!: string;

  @ApiProperty({ example: 'wf-1' })
  workflowId!: string;

  @ApiProperty({ example: 'single_stock_analysis' })
  type!: string;

  @ApiProperty({ example: 'NORMAL', enum: ['CRITICAL', 'VERY_HIGH', 'HIGH', 'NORMAL', 'LOW'] })
  priority!: string;

  @ApiProperty({ example: 'WAITING', enum: ['WAITING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'DEAD_LETTER', 'CANCELLED', 'PAUSED'] })
  state!: string;

  @ApiProperty({ type: Object })
  payload!: unknown;

  @ApiProperty({ example: 0 })
  attempt!: number;

  @ApiProperty({ example: 3 })
  maxAttempts!: number;

  @ApiProperty({ example: 1000 })
  retryDelayMs!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  createdAt!: string;

  @ApiPropertyOptional({ example: '2025-01-15T12:00:01.000Z' })
  startedAt!: string | null;

  @ApiPropertyOptional({ example: '2025-01-15T12:00:05.000Z' })
  completedAt!: string | null;

  @ApiPropertyOptional({ example: '2025-01-15T12:00:03.000Z' })
  failedAt!: string | null;

  @ApiPropertyOptional({ example: 'Handler not found' })
  error!: string | null;

  @ApiProperty({ type: Object, example: {} })
  metadata!: Record<string, unknown>;
}

export class QueueStatisticsDto {
  @ApiProperty({ example: 150 })
  totalEnqueued!: number;

  @ApiProperty({ example: 120 })
  totalCompleted!: number;

  @ApiProperty({ example: 10 })
  totalFailed!: number;

  @ApiProperty({ example: 5 })
  totalCancelled!: number;

  @ApiProperty({ example: 15 })
  totalRetried!: number;

  @ApiProperty({ example: 3 })
  totalDeadLettered!: number;

  @ApiProperty({ example: 2 })
  waitingCount!: number;

  @ApiProperty({ example: 1 })
  runningCount!: number;

  @ApiProperty({ example: 120 })
  completedCount!: number;

  @ApiProperty({ example: 10 })
  failedCount!: number;

  @ApiProperty({ example: 3 })
  deadLetterCount!: number;

  @ApiProperty({ example: 1 })
  activeWorkers!: number;

  @ApiProperty({ example: 4 })
  totalWorkers!: number;

  @ApiProperty({ example: 150.5 })
  avgWaitTimeMs!: number;

  @ApiProperty({ example: 2500.3 })
  avgExecutionTimeMs!: number;

  @ApiProperty({ example: 60000 })
  uptimeMs!: number;
}

export class QueueSnapshotDto {
  @ApiProperty({ type: QueueStatisticsDto })
  statistics!: QueueStatisticsDto;

  @ApiProperty({ type: [QueueJobDto] })
  waitingJobs!: QueueJobDto[];

  @ApiProperty({ type: [QueueJobDto] })
  runningJobs!: QueueJobDto[];

  @ApiProperty({ type: [QueueJobDto] })
  deadLetterJobs!: QueueJobDto[];

  @ApiProperty({ type: [QueueWorkerDto] })
  workers!: QueueWorkerDto[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class QueuePageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: Object })
  data!: { jobs: QueueJobDto[]; total: number; limit: number; offset: number };

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class QueueSnapshotResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: QueueSnapshotDto })
  data!: QueueSnapshotDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class QueueStatisticsResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: QueueStatisticsDto })
  data!: QueueStatisticsDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class QueueJobResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: QueueJobDto })
  data!: QueueJobDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class QueueActionResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Queue started successfully' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class QueueErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Job not found' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
