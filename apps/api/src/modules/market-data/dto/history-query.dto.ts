import { IsString, IsOptional, IsIn, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SUPPORTED_TIMEFRAMES } from '../interfaces';

export class HistoryQueryDto {
  @ApiProperty({
    description: 'Timeframe',
    enum: ['4h', '1d', '1w', '1m', '3m', '6m'],
    example: '1d',
  })
  @IsString()
  @IsIn(SUPPORTED_TIMEFRAMES as readonly string[])
  timeframe!: string;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)', example: '2025-01-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be in YYYY-MM-DD format' })
  from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)', example: '2025-06-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be in YYYY-MM-DD format' })
  to?: string;
}
