import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AnalystResult } from './analyst.types';

export class AnalystResultDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
  @ApiPropertyOptional({ description: 'Şirket', nullable: true })
  company!: string | null;
  @ApiProperty({ description: 'Genel Analiz' })
  genelAnaliz!: string;
  @ApiProperty({ description: 'Teknik Analiz' })
  teknikAnaliz!: string;
  @ApiProperty({ description: 'Temel Analiz' })
  temelAnaliz!: string;
  @ApiProperty({ description: 'Risk Analizi' })
  riskAnalizi!: string;
  @ApiProperty({ description: 'Momentum Analizi' })
  momentumAnalizi!: string;
  @ApiProperty({ description: 'Trend Analizi' })
  trendAnalizi!: string;
  @ApiProperty({ description: 'Likidite Analizi' })
  likiditeAnalizi!: string;
  @ApiProperty({ description: 'Doğrulama Analizi' })
  verificationAnalizi!: string;
  @ApiProperty({ description: 'Katalizör Analizi' })
  catalystAnalizi!: string;
  @ApiProperty({ description: 'Giriş Yorumu' })
  entryYorumu!: string;
  @ApiProperty({ description: 'Stop Yorumu' })
  stopYorumu!: string;
  @ApiProperty({ description: 'Hedef Yorumu' })
  targetYorumu!: string;
  @ApiProperty({ type: [String], description: 'Güçlü Yönler' })
  strengths!: string[];
  @ApiProperty({ type: [String], description: 'Zayıf Yönler' })
  weaknesses!: string[];
  @ApiProperty({ type: [String], description: 'Uyarılar' })
  warnings!: string[];
  @ApiProperty({ type: [String], description: 'Pozitif Sinyaller' })
  positiveSignals!: string[];
  @ApiProperty({ type: [String], description: 'Negatif Sinyaller' })
  negativeSignals!: string[];
  @ApiProperty({ description: 'Değerlendirme Zamanı' })
  evaluatedAt!: string;
}

export class AnalystTopQueryDto {
  @ApiPropertyOptional({ description: 'Sonuç sayısı', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;
}

export class AnalystListResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Sonuç Sayısı' })
  toplam!: number;
  @ApiProperty({ type: [AnalystResultDto], description: 'Analiz Sonuçları' })
  sonuclar!: AnalystResultDto[];
}

export class AnalystBatchItemDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
  @ApiPropertyOptional({ description: 'Şirket', nullable: true })
  company?: string | null;
  @ApiPropertyOptional({ description: 'Fiyat', nullable: true })
  price?: number | null;
}

export class AnalystBatchRequestDto {
  @ApiProperty({ type: [AnalystBatchItemDto], description: 'Analiz girdileri' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AnalystBatchItemDto)
  items!: AnalystBatchItemDto[];
}

export class AnalystBatchResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'İşlenen Sayı' })
  islenen!: number;
  @ApiProperty({ type: [AnalystResultDto], description: 'Analiz Sonuçları' })
  sonuclar!: AnalystResultDto[];
}

export class AnalystTickerParamDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
}