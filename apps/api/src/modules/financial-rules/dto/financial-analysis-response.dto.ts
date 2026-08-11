import { ApiProperty } from '@nestjs/swagger';

export class RuleResultDto {
  @ApiProperty({ example: 'price_to_book' })
  id!: string;

  @ApiProperty({ example: 'Price/Book Ratio' })
  name!: string;

  @ApiProperty({ example: 'PASS', enum: ['PASS', 'WARNING', 'FAIL'] })
  status!: string;

  @ApiProperty({ example: 1.2, nullable: true })
  value!: number | null;

  @ApiProperty({ example: 'Attractive valuation relative to book value' })
  reason!: string;
}

export class FinancialAnalysisResponseDto {
  @ApiProperty({ example: 'THYAO' })
  symbol!: string;

  @ApiProperty({ example: 85.0 })
  score!: number;

  @ApiProperty({ example: 'A', enum: ['A+', 'A', 'B', 'C', 'D'] })
  grade!: string;

  @ApiProperty({ example: 0.83 })
  confidence!: number;

  @ApiProperty({ type: [RuleResultDto] })
  rules!: RuleResultDto[];

  @ApiProperty({ type: [String], example: ['Strong net profit growth'] })
  strengths!: string[];

  @ApiProperty({ type: [String], example: ['EV/EBITDA ratio is moderately high'] })
  weaknesses!: string[];

  @ApiProperty({ type: [String], example: ['High debt burden'] })
  risks!: string[];

  @ApiProperty({ example: 'THYAO scored 85/100 (Grade: A).' })
  summary!: string;

  @ApiProperty({ example: 'Financial structure is healthy.' })
  overallOpinion!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}

export class FinancialAnalysisErrorDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 'Symbol is required' })
  error!: string;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z' })
  timestamp!: string;
}
