import { IsIn, IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_PROVIDERS = [
  'yahoo_finance',
  'fintables',
  'investing',
  'google_discovery',
  'kap',
  'mkk',
  'tcmb',
] as const;

export class ProviderParamDto {
  @ApiProperty({
    description: 'Provider name',
    enum: VALID_PROVIDERS,
    example: 'yahoo_finance',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_PROVIDERS, {
    message: `Invalid provider. Valid providers: ${VALID_PROVIDERS.join(', ')}`,
  })
  provider!: string;
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

export { VALID_PROVIDERS };
