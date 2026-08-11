import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RankedSymbolDto {
  @ApiProperty({ example: 'THYAO' })
  symbol!: string;

  @ApiProperty({ example: 'TOP_CANDIDATE', enum: ['TOP_CANDIDATE', 'WATCHLIST', 'REJECTED'] })
  status!: string;

  @ApiProperty({ example: 82.5 })
  eliteScore!: number;

  @ApiProperty({ example: 'AA' })
  eliteRating!: string;

  @ApiProperty({ example: 'HIGH' })
  opportunityLevel!: string;

  @ApiProperty({ example: 75 })
  candidateScore!: number;

  @ApiProperty({ example: 78.3 })
  compositeScore!: number;

  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ type: [String], example: ['Strong fundamentals'] })
  reasons!: string[];
}

export class ScannerStatisticsDto {
  @ApiProperty({ example: 50 })
  totalSymbols!: number;

  @ApiProperty({ example: 5 })
  topCandidateCount!: number;

  @ApiProperty({ example: 12 })
  watchlistCount!: number;

  @ApiProperty({ example: 33 })
  rejectedCount!: number;

  @ApiProperty({ example: 65.3 })
  avgEliteScore!: number;

  @ApiProperty({ example: 52.1 })
  avgOpportunityScore!: number;

  @ApiProperty({ example: 48.7 })
  avgCandidateScore!: number;

  @ApiProperty({ type: Object, example: { AAA: 2, AA: 3, A: 5, BBB: 10, BB: 15, B: 10, C: 3, D: 2 } })
  scoreDistribution!: Record<string, number>;
}

export class ScannerPageDto {
  @ApiProperty({ type: [RankedSymbolDto] })
  items!: RankedSymbolDto[];

  @ApiProperty({ example: 5 })
  total!: number;

  @ApiProperty({ example: 0 })
  offset!: number;

  @ApiProperty({ example: 10 })
  limit!: number;
}

export class ScannerFullResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [RankedSymbolDto] })
  topCandidates!: RankedSymbolDto[];

  @ApiProperty({ type: [RankedSymbolDto] })
  watchlist!: RankedSymbolDto[];

  @ApiProperty({ type: [RankedSymbolDto] })
  rejected!: RankedSymbolDto[];

  @ApiProperty({ type: ScannerStatisticsDto })
  statistics!: ScannerStatisticsDto;

  @ApiProperty({ type: Object })
  metadata!: any;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class ScannerErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'No scan data available' })
  error!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
