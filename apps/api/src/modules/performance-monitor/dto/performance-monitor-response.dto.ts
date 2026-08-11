import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PerformanceMetricStatsDto {
  @ApiProperty({ example: 'api_response_time' })
  name!: string;

  @ApiProperty({ example: 'api_response', enum: ['engine_execution', 'pipeline', 'scheduler', 'provider_latency', 'cache', 'system', 'api_response'] })
  category!: string;

  @ApiProperty({ example: 150 })
  count!: number;

  @ApiProperty({ example: 12.5 })
  min!: number;

  @ApiProperty({ example: 980.3 })
  max!: number;

  @ApiProperty({ example: 245.7 })
  avg!: number;

  @ApiProperty({ example: 230.1 })
  p50!: number;

  @ApiProperty({ example: 890.2 })
  p95!: number;

  @ApiProperty({ example: 950.0 })
  p99!: number;

  @ApiProperty({ example: 240.5 })
  lastValue!: number;

  @ApiProperty({ example: 1700000000000 })
  lastTimestamp!: number;

  @ApiProperty({ example: 250.3 })
  rollingAvg!: number;
}

export class PerformanceSystemDto {
  @ApiProperty({ example: 52428800 })
  memoryUsageBytes!: number;

  @ApiProperty({ example: 35651584 })
  heapUsedBytes!: number;

  @ApiProperty({ example: 67108864 })
  heapTotalBytes!: number;

  @ApiProperty({ example: 2097152 })
  externalBytes!: number;

  @ApiProperty({ example: 3600000 })
  uptimeMs!: number;

  @ApiProperty({ example: 12.5 })
  cpuUsagePercent!: number;

  @ApiProperty({ example: 73400320 })
  rssBytes!: number;
}

export class PerformanceCacheDto {
  @ApiProperty({ example: 1250 })
  hits!: number;

  @ApiProperty({ example: 50 })
  misses!: number;

  @ApiProperty({ example: 96.15 })
  hitRate!: number;

  @ApiProperty({ example: 1300 })
  totalOperations!: number;
}

export class PerformanceHealthDto {
  @ApiProperty({ example: 'HEALTHY', enum: ['HEALTHY', 'DEGRADED', 'UNHEALTHY'] })
  status!: string;

  @ApiProperty({ type: [PerformanceMetricStatsDto] })
  metrics!: PerformanceMetricStatsDto[];

  @ApiProperty({ type: PerformanceSystemDto })
  system!: PerformanceSystemDto;

  @ApiProperty({ type: PerformanceCacheDto })
  cache!: PerformanceCacheDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class PerformanceSnapshotDto {
  @ApiProperty({ type: [PerformanceMetricStatsDto] })
  metrics!: PerformanceMetricStatsDto[];

  @ApiProperty({ type: PerformanceSystemDto })
  system!: PerformanceSystemDto;

  @ApiProperty({ type: PerformanceCacheDto })
  cache!: PerformanceCacheDto;

  @ApiProperty({ type: PerformanceHealthDto })
  health!: PerformanceHealthDto;

  @ApiProperty({ example: 42 })
  totalRecorded!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class PerformancePageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: PerformanceSnapshotDto })
  data!: PerformanceSnapshotDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class PerformanceHealthPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: PerformanceHealthDto })
  data!: PerformanceHealthDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class PerformanceCachePageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: PerformanceCacheDto })
  data!: PerformanceCacheDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class PerformanceSystemPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: PerformanceSystemDto })
  data!: PerformanceSystemDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class PerformanceMetricsPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [PerformanceMetricStatsDto] })
  data!: PerformanceMetricStatsDto[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class PerformanceCategoryPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [PerformanceMetricStatsDto] })
  data!: PerformanceMetricStatsDto[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class PerformanceMetricPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: PerformanceMetricStatsDto })
  data!: PerformanceMetricStatsDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class PerformanceResetResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'All metrics have been reset' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class PerformanceMetricResetResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "Metric 'api_response_time' has been reset" })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class PerformanceErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Metric not found' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
