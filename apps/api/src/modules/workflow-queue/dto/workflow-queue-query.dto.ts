import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_PRIORITIES = ['CRITICAL', 'VERY_HIGH', 'HIGH', 'NORMAL', 'LOW'] as const;
const VALID_STATES = ['WAITING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'DEAD_LETTER', 'CANCELLED', 'PAUSED'] as const;

export class JobIdParamDto {
  @ApiProperty({ description: 'Job ID', example: 'jq-1700000000000-abc' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}

export class JobsQueryDto {
  @ApiPropertyOptional({ description: 'Max jobs to return', example: 50, default: 50 })
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

  @ApiPropertyOptional({ description: 'Filter by state', enum: VALID_STATES })
  @IsOptional()
  @IsString()
  @IsIn(VALID_STATES as unknown as string[])
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: VALID_PRIORITIES })
  @IsOptional()
  @IsString()
  @IsIn(VALID_PRIORITIES as unknown as string[])
  priority?: string;
}

export { VALID_PRIORITIES, VALID_STATES };
