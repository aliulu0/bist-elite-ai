import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';

const SORT_FIELDS = ['compositeScore', 'eliteScore', 'candidateScore', 'rank', 'symbol'];
const SORT_DIRS = ['asc', 'desc'];

export class ScannerQueryDto {
  @ApiPropertyOptional({ description: 'Number of items to skip', example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ description: 'Max items to return', example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field', example: 'compositeScore', enum: SORT_FIELDS, default: 'compositeScore' })
  @IsOptional()
  @IsString()
  @IsIn(SORT_FIELDS)
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort direction', example: 'desc', enum: SORT_DIRS, default: 'desc' })
  @IsOptional()
  @IsString()
  @IsIn(SORT_DIRS)
  sortDir?: 'asc' | 'desc';
}
