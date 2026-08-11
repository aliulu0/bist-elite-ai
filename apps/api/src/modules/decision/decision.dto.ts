import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { DecisionDimensionScores, DecisionInput } from './decision.types';

export function toDecisionInput(item: DecisionInputDto): DecisionInput {
  const d = item.dimensions ?? {};
  const dimensions: DecisionDimensionScores = {
    technical: d.technical ?? null,
    fundamental: d.fundamental ?? null,
    momentum: d.momentum ?? null,
    trend: d.trend ?? null,
    liquidity: d.liquidity ?? null,
    risk: d.risk ?? null,
    volume: d.volume ?? null,
    quality: d.quality ?? null,
    verification: d.verification ?? null,
    catalyst: d.catalyst ?? null,
  };
  return {
    ticker: item.ticker,
    company: item.company,
    sector: item.sector ?? null,
    price: item.price ?? null,
    aiScore: item.aiScore ?? null,
    aiConfidence: item.aiConfidence ?? null,
    strategyId: item.strategyId,
    strategyName: item.strategyName ?? item.strategyId,
    strategyScore: item.strategyScore ?? null,
    strategyConfidence: item.strategyConfidence ?? null,
    dimensions,
  };
}

export class DecisionDimensionScoresDto {
  @ApiPropertyOptional({ description: 'Teknik Skor', nullable: true })
  @IsOptional()
  technical!: number | null;
  @ApiPropertyOptional({ description: 'Temel Skor', nullable: true })
  @IsOptional()
  fundamental!: number | null;
  @ApiPropertyOptional({ description: 'Momentum Skoru', nullable: true })
  @IsOptional()
  momentum!: number | null;
  @ApiPropertyOptional({ description: 'Trend Skoru', nullable: true })
  @IsOptional()
  trend!: number | null;
  @ApiPropertyOptional({ description: 'Likidite Skoru', nullable: true })
  @IsOptional()
  liquidity!: number | null;
  @ApiPropertyOptional({ description: 'Risk Skoru (yüksek = düşük risk)', nullable: true })
  @IsOptional()
  risk!: number | null;
  @ApiPropertyOptional({ description: 'Hacim Skoru', nullable: true })
  @IsOptional()
  volume!: number | null;
  @ApiPropertyOptional({ description: 'Kalite Skoru', nullable: true })
  @IsOptional()
  quality!: number | null;
  @ApiPropertyOptional({ description: 'Doğrulama Skoru', nullable: true })
  @IsOptional()
  verification!: number | null;
  @ApiPropertyOptional({ description: 'Katalizör Skoru', nullable: true })
  @IsOptional()
  catalyst!: number | null;
}

export class OverviewStarRatingDto {
  @ApiProperty({ description: 'Boyut' })
  dimension!: string;
  @ApiProperty({ description: 'Etiket' })
  label!: string;
  @ApiProperty({ description: 'Yıldız (1-5)' })
  stars!: number;
  @ApiProperty({ description: 'Yıldız metni', example: '★★★★★' })
  starString!: string;
}

export class DecisionOverviewDto {
  @ApiProperty({ type: [OverviewStarRatingDto], description: 'Yıldız derecelendirmeleri' })
  ratings!: OverviewStarRatingDto[];
  @ApiProperty({ description: 'Toplam Yıldız' })
  totalStars!: number;
  @ApiProperty({ description: 'Maksimum Yıldız' })
  maxStars!: number;
}

export class DecisionResultDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
  @ApiProperty({ description: 'Şirket' })
  company!: string;
  @ApiProperty({
    description: 'Karar',
    enum: ['GÜÇLÜ_AL', 'AL', 'İZLE', 'BEKLE', 'RİSKLİ', 'SAT', 'GÜÇLÜ_SAT'],
  })
  decision!: string;
  @ApiProperty({ description: 'Karar Etiketi', example: 'GÜÇLÜ AL' })
  decisionLabel!: string;
  @ApiProperty({ description: 'Karar Skoru' })
  decisionScore!: number;
  @ApiProperty({ description: 'Karar Güveni' })
  confidence!: number;
  @ApiProperty({ type: [String], description: 'Gerekçeler' })
  reasons!: string[];
  @ApiProperty({ type: [String], description: 'Uyarılar' })
  warnings!: string[];
  @ApiProperty({ type: [String], description: 'Olumlu Sinyaller' })
  positiveSignals!: string[];
  @ApiProperty({ type: [String], description: 'Olumsuz Sinyaller' })
  negativeSignals!: string[];
  @ApiProperty({ type: DecisionOverviewDto, description: 'Yapay Zeka Genel Bakışı' })
  overview!: DecisionOverviewDto;
  @ApiPropertyOptional({ description: 'AI Skoru', nullable: true })
  aiScore!: number | null;
  @ApiPropertyOptional({ description: 'AI Güveni', nullable: true })
  aiConfidence!: number | null;
  @ApiProperty({ description: 'Strateji Kimliği' })
  strategyId!: string;
  @ApiProperty({ description: 'Strateji Adı' })
  strategyName!: string;
  @ApiPropertyOptional({ description: 'Strateji Skoru', nullable: true })
  strategyScore!: number | null;
  @ApiProperty({ type: DecisionDimensionScoresDto, description: 'Boyut Skorları' })
  dimensionScores!: DecisionDimensionScoresDto;
  @ApiProperty({ description: 'Değerlendirme Zamanı' })
  evaluatedAt!: string;
}

export class DecisionInputDimensionDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  technical?: number;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  fundamental?: number;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  momentum?: number;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  trend?: number;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  liquidity?: number;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  risk?: number;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  volume?: number;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  quality?: number;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  verification?: number;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  catalyst?: number;
}

export class DecisionInputDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  @IsString()
  @IsNotEmpty()
  ticker!: string;
  @ApiProperty({ description: 'Şirket' })
  @IsString()
  @IsNotEmpty()
  company!: string;
  @ApiPropertyOptional({ description: 'Sektör', nullable: true })
  @IsOptional()
  sector?: string | null;
  @ApiPropertyOptional({ description: 'Fiyat', nullable: true })
  @IsOptional()
  price?: number | null;
  @ApiPropertyOptional({ description: 'AI Skoru', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  aiScore?: number | null;
  @ApiPropertyOptional({ description: 'AI Güveni', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  aiConfidence?: number | null;
  @ApiProperty({ description: 'Strateji Kimliği' })
  @IsString()
  @IsNotEmpty()
  strategyId!: string;
  @ApiPropertyOptional({ description: 'Strateji Adı' })
  @IsOptional()
  @IsString()
  strategyName?: string;
  @ApiPropertyOptional({ description: 'Strateji Skoru', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  strategyScore?: number | null;
  @ApiPropertyOptional({ description: 'Strateji Güveni', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  strategyConfidence?: number | null;
  @ApiProperty({ type: DecisionInputDimensionDto, description: 'Boyut Skorları' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DecisionInputDimensionDto)
  dimensions?: DecisionInputDimensionDto;
}

export class DecisionBatchRequestDto {
  @ApiProperty({ type: [DecisionInputDto], description: 'Karar girdileri' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DecisionInputDto)
  items!: DecisionInputDto[];
}

export class DecisionBatchResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'İşlenen Karar Sayısı' })
  islenen!: number;
  @ApiProperty({ type: [DecisionResultDto], description: 'Sonuçlar' })
  sonuclar!: DecisionResultDto[];
}

export class DecisionTopResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Toplam Karar' })
  toplamKarar!: number;
  @ApiProperty({ type: [DecisionResultDto], description: 'Sonuçlar' })
  sonuclar!: DecisionResultDto[];
}

export class DecisionTickerParamDto {
  @IsString()
  @IsNotEmpty()
  ticker!: string;
}
