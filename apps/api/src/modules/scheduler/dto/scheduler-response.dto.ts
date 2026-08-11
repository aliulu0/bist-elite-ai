import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JobExecutionDto {
  @ApiProperty({ example: 'marketOpenScan' })
  jobName!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  startedAt!: string;

  @ApiPropertyOptional({ example: '2025-01-15T12:00:01.234Z' })
  completedAt!: string | null;

  @ApiProperty({ example: 1234 })
  durationMs!: number;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiPropertyOptional({ example: 'Failed to fetch data' })
  error!: string | null;

  @ApiProperty({ type: Object })
  metadata!: Record<string, unknown>;
}

export class JobStateDto {
  @ApiProperty({ example: 'marketOpenScan' })
  jobName!: string;

  @ApiProperty({ example: 'idle', enum: ['idle', 'running', 'completed', 'failed', 'disabled'] })
  status!: string;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ example: 900000 })
  intervalMs!: number;

  @ApiPropertyOptional({ type: JobExecutionDto })
  lastExecution!: JobExecutionDto | null;

  @ApiProperty({ example: 42 })
  totalExecutions!: number;

  @ApiProperty({ example: 0 })
  consecutiveFailures!: number;
}

export class SchedulerStatusResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: true })
  running!: boolean;

  @ApiProperty({ type: [JobStateDto] })
  jobs!: JobStateDto[];

  @ApiProperty({ example: 3600000 })
  uptime!: number;

  @ApiProperty({ example: 128 })
  totalExecutions!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ExecuteJobResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'marketOpenScan' })
  jobName!: string;

  @ApiProperty({ example: true })
  executionSuccess!: boolean;

  @ApiProperty({ example: 1234 })
  durationMs!: number;

  @ApiPropertyOptional({ example: 'Failed to fetch data' })
  error!: string | null;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class SchedulerErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Scheduler not running' })
  error!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
