import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DecisionInputDto } from '../decision/decision.dto';
import { TomorrowCategory } from './tomorrow.types';

export class TomorrowCandidateDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
  @ApiProperty({ description: 'Şirket' })
  company!: string;
  @ApiProperty({ description: 'Yarın Skoru (0-100)' })
  tomorrowScore!: number;
  @ApiProperty({ description: 'Yarın Güveni' })
  tomorrowConfidence!: number;
  @ApiProperty({ description: 'Kategori', enum: ['VERY_HIGH', 'HIGH', 'MEDIUM', 'WATCH', 'WEAK'] })
  category!: TomorrowCategory;
  @ApiProperty({ description: 'Kategori Etiketi' })
  categoryLabel!: string;
  @ApiProperty({ description: 'Kategori Yıldızları' })
  categoryStars!: string;
  @ApiProperty({ description: 'AI Skoru' })
  aiScore!: number | null;
  @ApiProperty({ description: 'Günlük Elite Skor' })
  eliteDaily!: number;
  @ApiProperty({ description: 'Haftalık Elite Skor' })
  eliteWeekly!: number;
  @ApiProperty({ description: 'Karar' })
  decision!: string;
  @ApiProperty({ description: 'Karar Etiketi' })
  decisionLabel!: string;
  @ApiProperty({ description: 'Fırsat Seviyesi' })
  opportunityLevel!: string;
  @ApiProperty({ description: 'Fırsat Skoru' })
  opportunityScore!: number;
  @ApiProperty({ description: 'Strateji Kimliği' })
  strategyId!: string;
  @ApiProperty({ description: 'Strateji Adı' })
  strategyName!: string;
  @ApiProperty({ description: 'Strateji Skoru' })
  strategyScore!: number | null;
  @ApiProperty({ description: 'Doğrulama Skoru' })
  verification!: number | null;
  @ApiProperty({ description: 'Katalizör Skoru' })
  catalyst!: number | null;
  @ApiProperty({ type: [String], description: 'Gerekçeler' })
  reasons!: string[];
  @ApiProperty({ type: [String], description: 'Uyarılar' })
  warnings!: string[];
  @ApiProperty({ type: [String], description: 'Olumlu Sinyaller' })
  positiveSignals!: string[];
  @ApiProperty({ type: [String], description: 'Olumsuz Sinyaller' })
  negativeSignals!: string[];
  @ApiProperty({ type: [String], description: 'Etiketler' })
  tags!: string[];
  @ApiProperty({ description: 'Değerlendirme Zamanı' })
  evaluatedAt!: string;
}

export class TomorrowNightAnalysisDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ type: [String], description: 'Saatler' })
  saatler!: string[];
  @ApiProperty({ description: 'Durum' })
  durum!: string;
  @ApiProperty({ description: 'Not' })
  not!: string;
}

export class TomorrowResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Toplam Aday' })
  toplamAday!: number;
  @ApiProperty({ type: TomorrowNightAnalysisDto, description: 'Gece Analizi (mimari hazır)' })
  geceAnalizi!: TomorrowNightAnalysisDto;
  @ApiProperty({ type: [TomorrowCandidateDto], description: 'Adaylar' })
  sonuclar!: TomorrowCandidateDto[];
}

export class TomorrowBatchRequestDto {
  @ApiProperty({ type: [DecisionInputDto], description: 'Yarın fırsatı girdileri' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DecisionInputDto)
  items!: DecisionInputDto[];
}

export class TomorrowBatchResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'İşlenen Sayı' })
  islenen!: number;
  @ApiProperty({ type: [TomorrowCandidateDto], description: 'Adaylar' })
  sonuclar!: TomorrowCandidateDto[];
}

export class TomorrowTickerParamDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
}
