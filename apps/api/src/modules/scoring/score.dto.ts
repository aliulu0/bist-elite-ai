import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ScoreQueryDto {
  @ApiPropertyOptional({ description: 'Strateji kimliği', example: 'value-hunter' })
  @IsOptional()
  @IsString()
  strategy?: string;

  @ApiPropertyOptional({ description: 'Sektör filtresi', example: 'Gıda' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ description: 'Maksimum sonuç', example: 50, minimum: 1, maximum: 643 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(643)
  limit?: number;
}

export class ScoreResultDto {
  @ApiProperty({ description: 'Boyut' })
  dimension!: string;
  @ApiPropertyOptional({ description: 'Puan', nullable: true })
  score!: number | null;
  @ApiProperty({ description: 'Etiket' })
  label!: string;
  @ApiProperty({ description: 'Detaylar' })
  details!: Record<string, unknown>;
}

export class AIScoreDto {
  @ApiPropertyOptional({ description: 'Yapay Zeka Puanı', nullable: true })
  aiScore!: number | null;
  @ApiPropertyOptional({ description: 'Yapay Zeka Güveni', nullable: true })
  aiConfidence!: number | null;
  @ApiPropertyOptional({ description: 'Ağırlıklı Skor', nullable: true })
  weightedScore!: number | null;
  @ApiProperty({ description: 'Uygun boyut sayısı' })
  availableDimensionCount!: number;
  @ApiProperty({ description: 'Toplam boyut sayısı' })
  totalDimensions!: number;
  @ApiProperty({ description: 'Boyut skorları' })
  scores!: ScoreResultDto[];
}

export class ScorePipelineDto {
  @ApiProperty({ description: 'Puanlama süresi (ms)' })
  pipelineDurationMs!: number;
  @ApiProperty({ description: 'AI Sonucu' })
  aiResult!: AIScoreDto;
}

export class ScoreEngineOutputDto {
  @ApiProperty({ description: 'Kod' })
  ticker!: string;
  @ApiProperty({ description: 'Strateji Kimliği' })
  strategyId!: string;
  @ApiProperty({ description: 'Strateji Adı' })
  strategyName!: string;
  @ApiProperty({ description: 'Puanlama Zamanı' })
  scoredAt!: string;
  @ApiProperty({ description: 'Piplin Sonucu' })
  pipeline!: ScorePipelineDto;
}

export class StrategyWeightDto {
  @ApiProperty({ description: 'Strateji Kimliği' })
  strategyId!: string;
  @ApiProperty({ description: 'Strateji Adı' })
  strategyName!: string;
  @ApiProperty({ description: 'Ağırlıklar' })
  weights!: Record<string, number>;
}

export class ScoringOverviewDto {
  @ApiProperty({ description: 'Strateji Sayısı' })
  strategyCount!: number;
  @ApiProperty({ description: 'Boyut Sayısı' })
  dimensionCount!: number;
  @ApiProperty({ description: 'Stratejiler' })
  strategies!: StrategyWeightDto[];
}
