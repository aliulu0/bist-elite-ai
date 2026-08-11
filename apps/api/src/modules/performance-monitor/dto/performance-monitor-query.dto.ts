import { IsIn, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const VALID_CATEGORIES = [
  'engine_execution',
  'pipeline',
  'scheduler',
  'provider_latency',
  'cache',
  'system',
  'api_response',
] as const;

export class CategoryParamDto {
  @ApiProperty({
    description: 'Metric category',
    enum: VALID_CATEGORIES,
    example: 'api_response',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_CATEGORIES, {
    message: `Invalid category. Valid categories: ${VALID_CATEGORIES.join(', ')}`,
  })
  category!: string;
}

export class MetricParamDto {
  @ApiProperty({
    description: 'Metric name',
    example: 'api_response_time',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export { VALID_CATEGORIES };
