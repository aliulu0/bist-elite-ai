import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ScannerQueryDto {
  @ApiPropertyOptional({ description: 'Strateji filtresi', example: 'value-hunter' })
  @IsOptional()
  @IsString()
  strategy?: string;

  @ApiPropertyOptional({ description: 'Sektör filtresi', example: 'Gıda' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ description: 'Varlık türü filtresi', example: 'Equity' })
  @IsOptional()
  @IsString()
  assetType?: string;

  @ApiPropertyOptional({ description: 'Minimum AI Skoru', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minAiScore?: number;

  @ApiPropertyOptional({ description: 'Minimum AI Güveni', example: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minConfidence?: number;

  @ApiPropertyOptional({ description: 'Minimum Strateji Skoru', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minStrategyScore?: number;

  @ApiPropertyOptional({ description: 'Maksimum sonuç sayısı', example: 50, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(795)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sadece aktif hisseler', example: true, default: true })
  @IsOptional()
  activeOnly?: boolean;
}

export class StrategyParamDto {
  @IsString()
  strategy!: string;
}