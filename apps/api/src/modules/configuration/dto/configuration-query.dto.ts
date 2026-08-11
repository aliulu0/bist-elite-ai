import { IsIn, IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_DOMAINS = [
  'technical', 'financial', 'smart_money', 'opportunity', 'candidate',
  'confluence', 'elite_score', 'workflow', 'scheduler', 'providers',
  'scanner', 'backtest', 'benchmark', 'performance_monitor',
] as const;

export class DomainParamDto {
  @ApiProperty({
    description: 'Configuration domain',
    enum: VALID_DOMAINS,
    example: 'technical',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_DOMAINS, {
    message: `Invalid domain. Valid domains: ${VALID_DOMAINS.join(', ')}`,
  })
  domain!: string;
}

export class HistoryQueryDto {
  @ApiPropertyOptional({ description: 'Max history entries', example: 50, default: 50 })
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
}

export class ProfileIdParamDto {
  @ApiProperty({ description: 'Profile ID', example: 'profile-default' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}

export class SnapshotIdParamDto {
  @ApiProperty({ description: 'Snapshot ID', example: 'snap-1700000000000-abc' })
  @IsString()
  @IsNotEmpty()
  id!: string;
}

export { VALID_DOMAINS };
