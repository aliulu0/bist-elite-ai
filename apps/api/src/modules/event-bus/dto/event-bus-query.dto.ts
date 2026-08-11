import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_CATEGORIES = [
  'system', 'scheduler', 'scanner', 'analysis', 'opportunity',
  'elite_score', 'provider', 'performance', 'backtest',
] as const;

export class EventTypeParamDto {
  @ApiProperty({
    description: 'Event type',
    example: 'workflow.created',
  })
  @IsString()
  @IsNotEmpty()
  type!: string;
}

export class HistoryQueryDto {
  @ApiPropertyOptional({ description: 'Max events to return', example: 50, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset for pagination', example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ description: 'Filter by category', enum: VALID_CATEGORIES })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by type', example: 'workflow.created' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class EventsByTypeQueryDto {
  @ApiPropertyOptional({ description: 'Max events to return', example: 50, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by category', enum: VALID_CATEGORIES })
  @IsOptional()
  @IsString()
  category?: string;
}

export { VALID_CATEGORIES };
