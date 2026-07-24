import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarketDataPointDto {
  @ApiProperty({ example: 'THYAO.IS' })
  symbol!: string;

  @ApiProperty({ example: '1d' })
  timeframe!: string;

  @ApiProperty({ example: 105.5 })
  open!: number;

  @ApiProperty({ example: 112.3 })
  high!: number;

  @ApiProperty({ example: 103.1 })
  low!: number;

  @ApiProperty({ example: 108.7 })
  close!: number;

  @ApiProperty({ example: 1500000 })
  volume!: number;

  @ApiProperty({ example: '2025-01-15T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 'valid', enum: ['valid', 'partial', 'invalid'] })
  validationStatus!: string;
}

export class LatestPriceResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: MarketDataPointDto, nullable: true })
  data!: MarketDataPointDto | null;

  @ApiPropertyOptional()
  error?: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class HistoryResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [MarketDataPointDto] })
  data!: MarketDataPointDto[];

  @ApiPropertyOptional()
  error?: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 100 })
  total!: number;
}

export class TimeframesResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [String], example: ['4h', '1d', '1w', '1m', '3m', '6m'] })
  data!: string[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ProviderStatusDto {
  @ApiProperty({ example: 'yahoo-finance' })
  name!: string;

  @ApiProperty({ example: true })
  healthy!: boolean;
}

export class ProvidersResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [ProviderStatusDto] })
  data!: ProviderStatusDto[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Symbol is required' })
  error!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
