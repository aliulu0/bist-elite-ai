import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DecisionInputDto } from '../decision/decision.dto';
import { EntryQualityLevel, EntryTrendDirection } from './entry-zone.types';

export class EntryZoneRangeDto {
  @ApiProperty({ description: 'Alt sınır' })
  min!: number;
  @ApiProperty({ description: 'Üst sınır' })
  max!: number;
}

export class EntryQualityDto {
  @ApiProperty({
    description: 'Giriş kalite seviyesi',
    enum: ['PERFECT', 'VERY_GOOD', 'GOOD', 'AVERAGE', 'WEAK'],
  })
  level!: EntryQualityLevel;
  @ApiProperty({ description: 'Giriş kalite etiketi' })
  label!: string;
  @ApiProperty({ description: 'Giriş kalite yıldızları' })
  stars!: string;
}

export class EntryZoneResultDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
  @ApiPropertyOptional({ description: 'Şirket', nullable: true })
  company!: string | null;
  @ApiPropertyOptional({ description: 'Son Kapanış Fiyatı', nullable: true })
  price!: number | null;
  @ApiPropertyOptional({
    type: EntryZoneRangeDto,
    description: 'İdeal Giriş Bölgesi',
    nullable: true,
  })
  idealEntryZone!: EntryZoneRangeDto | null;
  @ApiPropertyOptional({ description: 'Agresif Giriş', nullable: true })
  aggressiveEntry!: number | null;
  @ApiPropertyOptional({ description: 'Konservatif Giriş', nullable: true })
  conservativeEntry!: number | null;
  @ApiPropertyOptional({ description: 'Destek 1', nullable: true })
  support1!: number | null;
  @ApiPropertyOptional({ description: 'Destek 2', nullable: true })
  support2!: number | null;
  @ApiPropertyOptional({ description: 'Direnç 1', nullable: true })
  resistance1!: number | null;
  @ApiPropertyOptional({ description: 'Direnç 2', nullable: true })
  resistance2!: number | null;
  @ApiPropertyOptional({ description: 'Stop Loss', nullable: true })
  stopLoss!: number | null;
  @ApiPropertyOptional({ description: 'Hedef 1', nullable: true })
  target1!: number | null;
  @ApiPropertyOptional({ description: 'Hedef 2', nullable: true })
  target2!: number | null;
  @ApiPropertyOptional({ description: 'Hedef 3', nullable: true })
  target3!: number | null;
  @ApiPropertyOptional({ description: 'Risk/Ödül Oranı', nullable: true })
  riskRewardRatio!: number | null;
  @ApiPropertyOptional({ description: 'Risk/Ödül Etiketi', example: '1 : 3.4', nullable: true })
  riskRewardLabel!: string | null;
  @ApiProperty({ description: 'Giriş Güveni (0-100)' })
  entryConfidence!: number;
  @ApiProperty({ description: 'Trend Yönü', enum: ['UPTREND', 'DOWNTREND', 'SIDEWAYS'] })
  trendDirection!: EntryTrendDirection;
  @ApiProperty({ type: EntryQualityDto, description: 'Giriş Kalitesi' })
  entryQuality!: EntryQualityDto;
  @ApiProperty({ type: [String], description: 'Gerekçeler' })
  reasons!: string[];
  @ApiProperty({ type: [String], description: 'Uyarılar' })
  warnings!: string[];
  @ApiProperty({ description: 'Değerlendirme Zamanı' })
  evaluatedAt!: string;
}

export class EntryTopQueryDto {
  @ApiPropertyOptional({ description: 'Sonuç sayısı', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;
}

export class EntryListResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Sonuç Sayısı' })
  toplam!: number;
  @ApiProperty({ type: [EntryZoneResultDto], description: 'Giriş Bölgeleri' })
  sonuclar!: EntryZoneResultDto[];
}

export class EntryBatchRequestDto {
  @ApiProperty({ type: [DecisionInputDto], description: 'Giriş bölgesi girdileri' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DecisionInputDto)
  items!: DecisionInputDto[];
}

export class EntryCalculateRequestDto {
  @ApiProperty({ type: [DecisionInputDto], description: 'Giriş bölgesi hesaplama girdileri' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DecisionInputDto)
  items!: DecisionInputDto[];
}

export class EntryBatchResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'İşlenen Sayı' })
  islenen!: number;
  @ApiProperty({ type: [EntryZoneResultDto], description: 'Giriş Bölgeleri' })
  sonuclar!: EntryZoneResultDto[];
}

export class EntryTickerParamDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  @IsString()
  ticker!: string;
}
