import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProviderRequestDto {
  @ApiProperty({ example: 1700000000000 })
  timestamp!: number;

  @ApiProperty({ example: 245.5 })
  latencyMs!: number;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: false })
  isTimeout!: boolean;

  @ApiPropertyOptional({ example: 'Connection refused' })
  error?: string;
}

export class ProviderStateDto {
  @ApiProperty({ example: 'yahoo_finance' })
  provider!: string;

  @ApiProperty({ example: 'healthy', enum: ['healthy', 'degraded', 'unhealthy', 'unknown'] })
  status!: string;

  @ApiProperty({ example: 150 })
  totalRequests!: number;

  @ApiProperty({ example: 145 })
  successfulRequests!: number;

  @ApiProperty({ example: 5 })
  failedRequests!: number;

  @ApiProperty({ example: 2 })
  timeoutCount!: number;

  @ApiProperty({ example: 0 })
  consecutiveFailures!: number;

  @ApiPropertyOptional({ example: 1700000000000 })
  lastFailureTime!: number | null;

  @ApiPropertyOptional({ example: 1700000005000 })
  lastSuccessTime!: number | null;

  @ApiPropertyOptional({ example: 1700000006000 })
  lastRequestTime!: number | null;

  @ApiPropertyOptional({ example: 1200 })
  recoveryTimeMs!: number | null;

  @ApiProperty({ example: 320.5 })
  avgLatencyMs!: number;

  @ApiProperty({ example: 280.0 })
  p50LatencyMs!: number;

  @ApiProperty({ example: 650.0 })
  p95LatencyMs!: number;

  @ApiProperty({ example: 900.0 })
  p99LatencyMs!: number;

  @ApiProperty({ example: 95 })
  reliabilityScore!: number;

  @ApiProperty({ example: 96.67 })
  successRate!: number;

  @ApiProperty({ example: 3.33 })
  errorRate!: number;

  @ApiProperty({ example: 300000 })
  uptime!: number;
}

export class ProviderSnapshotDto {
  @ApiProperty({ type: [ProviderStateDto] })
  providers!: ProviderStateDto[];

  @ApiProperty({ example: 'healthy', enum: ['healthy', 'degraded', 'unhealthy', 'unknown'] })
  overallStatus!: string;

  @ApiProperty({ example: 4 })
  totalProviders!: number;

  @ApiProperty({ example: 3 })
  healthyCount!: number;

  @ApiProperty({ example: 1 })
  degradedCount!: number;

  @ApiProperty({ example: 0 })
  unhealthyCount!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ProviderSnapshotPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: ProviderSnapshotDto })
  data!: ProviderSnapshotDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ProviderStatePageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: ProviderStateDto })
  data!: ProviderStateDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ProviderHistoryDto {
  @ApiProperty({ type: [ProviderRequestDto] })
  requests!: ProviderRequestDto[];

  @ApiProperty({ example: 150 })
  total!: number;

  @ApiProperty({ example: 50 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}

export class ProviderHistoryPageDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: ProviderHistoryDto })
  data!: ProviderHistoryDto;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ProviderResetResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'All provider statistics have been reset' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ProviderResetSingleResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "Provider 'yahoo_finance' statistics have been reset" })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ProviderErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Invalid provider name' })
  message!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
