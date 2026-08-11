import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

const VALID_TIMEFRAMES = ['4h', '1d', '1w', '1m', '3m', '6m'];

export class AnalysisQueryDto {
  @ApiPropertyOptional({
    description: 'Timeframe for analysis',
    example: '1d',
    enum: VALID_TIMEFRAMES,
    default: '1d',
  })
  @IsOptional()
  @IsString()
  @IsIn(VALID_TIMEFRAMES, {
    message: `timeframe must be one of: ${VALID_TIMEFRAMES.join(', ')}`,
  })
  timeframe?: string;
}
