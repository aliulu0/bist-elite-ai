import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { DecisionBatchRequestDto, DecisionInputDto } from '../decision/decision.dto';

export class OpportunityResultDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
  @ApiProperty({ description: 'Şirket' })
  company!: string;
  @ApiProperty({
    description: 'Fırsat Seviyesi',
    enum: ['ÇOK_GÜÇLÜ_FIRSAT', 'GÜÇLÜ_FIRSAT', 'FIRSAT', 'İZLEME_LISTESI', 'BEKLE'],
  })
  level!: string;
  @ApiProperty({ description: 'Fırsat Etiketi', example: 'Güçlü Fırsat' })
  levelLabel!: string;
  @ApiProperty({ description: 'Fırsat Emojisi', example: '🔥' })
  levelEmoji!: string;
  @ApiProperty({ description: 'Fırsat Skoru' })
  opportunityScore!: number;
  @ApiProperty({ description: 'Fırsat Güveni' })
  confidence!: number;
  @ApiProperty({
    description: 'Karar',
    enum: ['GÜÇLÜ_AL', 'AL', 'İZLE', 'BEKLE', 'RİSKLİ', 'SAT', 'GÜÇLÜ_SAT'],
  })
  decision!: string;
  @ApiProperty({ description: 'Karar Etiketi' })
  decisionLabel!: string;
  @ApiProperty({ description: 'Karar Skoru' })
  decisionScore!: number;
  @ApiProperty({ description: 'Karar Güveni' })
  decisionConfidence!: number;
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
  @ApiPropertyOptional({ description: 'Doğrulama Skoru', nullable: true })
  verification!: number | null;
  @ApiPropertyOptional({ description: 'Katalizör Skoru', nullable: true })
  catalyst!: number | null;
  @ApiPropertyOptional({ description: 'Momentum Skoru', nullable: true })
  momentum!: number | null;
  @ApiPropertyOptional({ description: 'Trend Skoru', nullable: true })
  trend!: number | null;
  @ApiPropertyOptional({ description: 'Risk Skoru (yüksek = düşük risk)', nullable: true })
  risk!: number | null;
  @ApiPropertyOptional({ description: 'Likidite Skoru', nullable: true })
  liquidity!: number | null;
  @ApiPropertyOptional({ description: 'Teknik Skor', nullable: true })
  technical!: number | null;
  @ApiPropertyOptional({ description: 'Temel Skor', nullable: true })
  fundamental!: number | null;
  @ApiPropertyOptional({ description: 'Kalite Skoru', nullable: true })
  quality!: number | null;
  @ApiProperty({ type: [String], description: 'Gerekçeler' })
  reasons!: string[];
  @ApiProperty({ type: [String], description: 'Uyarılar' })
  warnings!: string[];
  @ApiProperty({ type: [String], description: 'Olumlu Sinyaller' })
  positiveSignals!: string[];
  @ApiProperty({ type: [String], description: 'Olumsuz Sinyaller' })
  negativeSignals!: string[];
  @ApiProperty({ type: [String], description: 'Fırsat Etiketleri' })
  tags!: string[];
  @ApiProperty({ description: 'Değerlendirme Zamanı' })
  evaluatedAt!: string;
}

export class OpportunityBatchRequestDto {
  @ApiProperty({ type: [DecisionInputDto], description: 'Fırsat girdileri (karar motoru girdisi ile aynı)' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DecisionInputDto)
  items!: DecisionInputDto[];
}

export class OpportunityResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Toplam Fırsat' })
  toplamFirsat!: number;
  @ApiProperty({ type: [OpportunityResultDto], description: 'Sonuçlar' })
  sonuclar!: OpportunityResultDto[];
}

export class OpportunityTickerParamDto {
  @IsString()
  @IsNotEmpty()
  ticker!: string;
}
