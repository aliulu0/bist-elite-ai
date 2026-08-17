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

  @ApiPropertyOptional({ example: 'AKBNK', description: 'Symbol the latest price refers to' })
  symbol?: string;

  @ApiPropertyOptional({ example: 105.5, description: 'Latest price' })
  price?: number;

  @ApiPropertyOptional({ example: 103.1, description: 'Previous price' })
  previousPrice?: number;

  @ApiPropertyOptional({ example: 2.4, description: 'Absolute change' })
  change?: number;

  @ApiPropertyOptional({ example: 2.33, description: 'Change percent' })
  changePercent?: number;

  @ApiPropertyOptional({
    example: 'yahoo',
    description: 'Provider that produced this data (cache for a cache hit)',
  })
  provider?: string;

  @ApiPropertyOptional({
    example: '1d',
    nullable: true,
    description: 'Source timeframe the data was fetched at',
  })
  sourceTimeframe?: string | null;

  @ApiPropertyOptional({
    enum: ['fresh', 'stale', 'no-data'],
    description: 'Freshness of the latest price',
  })
  dataFreshness?: 'fresh' | 'stale' | 'no-data';

  @ApiPropertyOptional({ example: true, description: 'Whether the response was served from cache' })
  cached?: boolean;

  @ApiPropertyOptional({
    example: '2025-01-15T12:00:00.000Z',
    description: 'Last time this state was successfully updated',
  })
  lastSuccessfulUpdate?: string | null;

  @ApiPropertyOptional({
    example: 'Veri güncel.',
    description: 'Human-readable Turkish freshness message',
  })
  freshnessMessage?: string;
}

export class LatestPricePointResponseDto {
  @ApiProperty({ example: 'AKBNK' })
  symbol!: string;

  @ApiProperty({ example: 105.5 })
  price!: number;

  @ApiProperty({ example: 103.1 })
  previousPrice!: number;

  @ApiProperty({ example: 2.4 })
  change!: number;

  @ApiProperty({ example: 2.33 })
  changePercent!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 'yahoo' })
  provider!: string;

  @ApiProperty({ example: '1d' })
  sourceTimeframe!: string;

  @ApiProperty({ enum: ['fresh', 'stale', 'no-data'] })
  dataFreshness!: string;

  @ApiProperty({ example: true })
  cached!: boolean;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  lastSuccessfulUpdate!: string;
}

export class LatestPriceApiResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: LatestPricePointResponseDto, nullable: true })
  data!: LatestPricePointResponseDto | null;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class IncrementalUpdateDto {
  @ApiPropertyOptional({ example: true, description: 'Served from cache without a provider call' })
  cacheHit?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether new bars were merged since the last cache write',
  })
  incrementalUpdate?: boolean;

  @ApiPropertyOptional({
    example: 'yahoo',
    description: 'Provider used for the latest fetch (null if cache served it)',
  })
  providerUsed?: string | null;

  @ApiPropertyOptional({ example: 30, description: 'Bar count before this request' })
  previousBarCount?: number;

  @ApiPropertyOptional({ example: 1, description: 'New bars merged in this request' })
  newBarCount?: number;

  @ApiPropertyOptional({ example: 31, description: 'Bar count after merge' })
  mergedBarCount?: number;

  @ApiPropertyOptional({
    example: '2026-08-09T10:00:00.000Z',
    description: 'Last cached bar timestamp',
  })
  lastCachedTimestamp?: string | null;

  @ApiPropertyOptional({
    example: '2026-08-10T10:00:00.000Z',
    description: 'Latest bar timestamp in the returned series',
  })
  latestTimestamp?: string | null;

  @ApiPropertyOptional({
    enum: ['fresh', 'stale', 'no-data'],
    description: 'Freshness of the returned series',
  })
  dataFreshness?: 'fresh' | 'stale' | 'no-data';

  @ApiPropertyOptional({
    enum: ['validated', 'unvalidated', 'invalid', 'none'],
    description: 'Validation status of the series',
  })
  validationStatus?: 'validated' | 'unvalidated' | 'invalid' | 'none';

  @ApiPropertyOptional({ example: true, description: 'Explicit stale flag (stale-but-valid data)' })
  stale?: boolean;
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

  @ApiPropertyOptional({
    example: 'yahoo',
    description: 'Provider that produced this result (cache for a cache hit)',
  })
  provider?: string;

  @ApiPropertyOptional({ example: false, description: 'Whether the data was served from cache' })
  cached?: boolean;

  @ApiPropertyOptional({
    example: '4h',
    nullable: true,
    description:
      'Fetchable timeframe the result was sourced from (set when the requested timeframe was normalised)',
  })
  sourceTimeframe?: string | null;

  @ApiPropertyOptional({ type: IncrementalUpdateDto, description: 'Incremental update metadata' })
  incremental?: IncrementalUpdateDto;
}

export class TimeframeStatusDto {
  @ApiProperty({ example: '4h' })
  timeframe!: string;

  @ApiProperty({ example: 'DERIVED', enum: ['REAL', 'DERIVED', 'UNAVAILABLE'] })
  status!: string;

  @ApiProperty({ example: '4h' })
  predictionTarget!: string;

  @ApiProperty({ type: [String], example: ['yahoo'] })
  providers!: string[];

  @ApiProperty({ example: '4h', nullable: true })
  sourceTimeframe!: string | null;
}

export class TimeframesResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [String], example: ['4h', '1d', '1w', '1m', '3m', '6m'] })
  data!: string[];

  @ApiProperty({ type: [TimeframeStatusDto] })
  details?: TimeframeStatusDto[];

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ProviderConfigurationDto {
  @ApiProperty({ example: 'finnhub' })
  name!: string;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ example: false })
  configured!: boolean;

  @ApiProperty({ example: false })
  authenticated!: boolean;

  @ApiProperty({ example: 10 })
  priority!: number;

  @ApiProperty({ example: 15000 })
  timeoutMs!: number;

  @ApiProperty({ example: 3 })
  retries!: number;

  @ApiProperty({ example: 'finnhub.io' })
  baseUrlHost!: string;

  @ApiProperty({ example: false })
  public!: boolean;
}

export class ProviderConfigurationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [ProviderConfigurationDto] })
  data!: ProviderConfigurationDto[];

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

  constructor(error: string, statusCode?: number) {
    this.error = error;
    this.success =
      statusCode === 400 || statusCode === 404 || statusCode === 409 || statusCode === 422;
    this.timestamp = new Date().toISOString();
    if (statusCode) {
      // statusCode is available at runtime but not in the type
    }
  }
}

export class SourceSnapshot {
  @ApiProperty({ example: 'yahoo-finance' })
  provider!: string;

  @ApiProperty({ example: 'THYAO.IS' })
  providerSymbol!: string;

  @ApiProperty({ example: 305.25, nullable: true })
  price!: number | null;

  @ApiProperty({ example: 'TRY', nullable: true })
  currency!: string | null;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z', nullable: true })
  timestamp!: string | null;

  @ApiProperty({ example: '12', nullable: true })
  freshness?: string | null;

  @ApiProperty({ example: 'valid', nullable: true })
  validationStatus!: string | null;

  @ApiProperty({ example: 'yahoo_finance', nullable: true })
  source!: string | null;
}

export class TruthConflict {
  @ApiProperty({ example: true })
  detected!: boolean;

  @ApiProperty({ example: 0.05 })
  maxDifference!: number | null;

  @ApiProperty({ example: 0.016 })
  maxDifferencePercent!: number | null;

  @ApiProperty({ example: ['yahoo-finance', 'serpapi'] })
  contributingSources!: string[];
}

export class TruthData {
  @ApiProperty({ example: 'THYAO' })
  ticker!: string;

  @ApiProperty({ example: 305.25, nullable: true })
  consensusPrice!: number | null;

  @ApiProperty({ example: 'TRY', nullable: true })
  consensusCurrency!: string | null;

  @ApiProperty({
    enum: [
      'SINGLE_SOURCE_VERIFIED',
      'MULTI_SOURCE_CONFIRMED',
      'MULTI_SOURCE_CONFIRMED_RESEARCH_SUPPORTED',
      'PRICE_CONFLICT',
      'UNAVAILABLE',
      'SINGLE_SOURCE_UNAVAILABLE',
    ],
    example: 'SINGLE_SOURCE_VERIFIED',
  })
  status!: string;

  @ApiProperty({ enum: ['HIGH', 'MEDIUM', 'LOW', 'NONE'], example: 'HIGH' })
  confidence!: string;

  @ApiProperty({ description: 'Provider price snapshots' })
  sources!: SourceSnapshot[];

  @ApiPropertyOptional({ description: 'Conflict details if detected' })
  conflict?: TruthConflict;

  @ApiProperty({ enum: ['FRESH', 'STALE', 'UNKNOWN'], example: 'FRESH' })
  freshness!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  generatedAt!: string;
}

export class TruthResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: 'object', description: 'Market truth consensus result' })
  data!: TruthData;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
