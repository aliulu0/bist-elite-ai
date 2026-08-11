import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DecisionInputDto } from '../decision/decision.dto';
import { EliteScoreHorizon } from './elite-score.types';

export class EliteScoreHorizonDto {
  @ApiProperty({ description: 'Zaman Dilimi', enum: ['GUNLUK', 'HAFTALIK', 'AYLIK', 'UC_AYLIK', 'ALTI_AYLIK'] })
  horizon!: EliteScoreHorizon;
  @ApiProperty({ description: 'Etiket' })
  etiket!: string;
  @ApiProperty({ description: 'Elite Skor (0-100)' })
  skor!: number;
  @ApiProperty({ description: 'Güven' })
  confidence!: number;
  @ApiProperty({ type: [String], description: 'Gerekçeler' })
  reasons!: string[];
  @ApiProperty({ type: [String], description: 'Uyarılar' })
  warnings!: string[];
}

export class EliteScoreResultDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
  @ApiProperty({ description: 'Şirket' })
  company!: string;
  @ApiProperty({ type: [EliteScoreHorizonDto], description: 'Zaman Dilimi Sonuçları' })
  horizons!: EliteScoreHorizonDto[];
  @ApiProperty({ description: 'Baskın Strateji Kimliği' })
  dominantStrategyId!: string;
  @ApiProperty({ description: 'Baskın Strateji Adı' })
  dominantStrategyName!: string;
  @ApiProperty({ type: [String], description: 'Baskın Sinyaller' })
  dominantSignals!: string[];
  @ApiProperty({ description: 'Karar' })
  decision!: string;
  @ApiProperty({ description: 'Karar Etiketi' })
  decisionLabel!: string;
  @ApiProperty({ description: 'Fırsat Seviyesi' })
  opportunityLevel!: string;
  @ApiProperty({ description: 'Değerlendirme Zamanı' })
  evaluatedAt!: string;
}

export class EliteScoreBatchRequestDto {
  @ApiProperty({ type: [DecisionInputDto], description: 'Elite skor girdileri' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DecisionInputDto)
  items!: DecisionInputDto[];
}

export class EliteScoreBatchResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'İşlenen Sayı' })
  islenen!: number;
  @ApiProperty({ type: [EliteScoreResultDto], description: 'Sonuçlar' })
  sonuclar!: EliteScoreResultDto[];
}

export class EliteScoreListResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Toplam' })
  toplam!: number;
  @ApiProperty({ type: [EliteScoreResultDto], description: 'Sonuçlar' })
  sonuclar!: EliteScoreResultDto[];
}

export class EliteScoreTickerParamDto {
  @IsString()
  @IsNotEmpty()
  ticker!: string;
}

export class EliteScoreQueryLimitDto {
  @ApiPropertyOptional({ description: 'Maksimum sonuç sayısı' })
  limit!: number;
}
