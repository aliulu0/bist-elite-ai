import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpportunityResult } from '../ai-opportunity/opportunity.types';
import { EntryZoneResult } from '../entry/entry-zone.types';
import { EntryZoneResultDto } from '../entry/entry.dto';
import { AnalystResultDto } from '../analyst/analyst.dto';
import { AnalystResult } from '../analyst/analyst.types';
import {
  EliteScoreTimeframe,
  OpportunityCenterCard,
  OpportunityCenterTabId,
} from './opportunity-center.types';

export function toOpportunityCenterCard(
  result: OpportunityResult,
  entryArea: EntryZoneResult | null = null,
  analyst: AnalystResult | null = null,
): OpportunityCenterCard {
  return { ...result, entryArea, analyst };
}

export class OpportunityCenterCardDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
  @ApiProperty({ description: 'Şirket' })
  company!: string;
  @ApiPropertyOptional({ description: 'AI Skoru', nullable: true })
  aiScore!: number | null;
  @ApiPropertyOptional({ description: 'AI Güveni', nullable: true })
  aiConfidence!: number | null;
  @ApiProperty({ description: 'Karar' })
  decision!: string;
  @ApiProperty({ description: 'Karar Etiketi' })
  decisionLabel!: string;
  @ApiProperty({ description: 'Karar Skoru' })
  decisionScore!: number;
  @ApiProperty({ description: 'Karar Güveni' })
  decisionConfidence!: number;
  @ApiProperty({ description: 'Fırsat Seviyesi' })
  level!: string;
  @ApiProperty({ description: 'Fırsat Seviyesi Etiketi' })
  levelLabel!: string;
  @ApiProperty({ description: 'Fırsat Seviyesi Emojisi' })
  levelEmoji!: string;
  @ApiProperty({ description: 'Fırsat Skoru' })
  opportunityScore!: number;
  @ApiProperty({ description: 'Fırsat Güveni' })
  confidence!: number;
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
  @ApiPropertyOptional({ description: 'Risk Skoru', nullable: true })
  risk!: number | null;
  @ApiPropertyOptional({ description: 'Momentum Skoru', nullable: true })
  momentum!: number | null;
  @ApiPropertyOptional({ description: 'Trend Skoru', nullable: true })
  trend!: number | null;
  @ApiPropertyOptional({ description: 'Likidite Skoru', nullable: true })
  liquidity!: number | null;
  @ApiPropertyOptional({ description: 'Kalite Skoru', nullable: true })
  quality!: number | null;
  @ApiPropertyOptional({ description: 'Teknik Skor', nullable: true })
  technical!: number | null;
  @ApiPropertyOptional({ description: 'Temel Skor', nullable: true })
  fundamental!: number | null;
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
  @ApiPropertyOptional({ type: EntryZoneResultDto, description: 'Giriş Alanı (Giriş Bölgesi, Stop, Hedefler, Risk/Ödül, Giriş Kalitesi)', nullable: true })
  entryArea!: EntryZoneResultDto | null;
  @ApiPropertyOptional({ description: 'AI Analiz Özeti', nullable: true, type: AnalystResultDto })
  analyst!: AnalystResultDto | null;
  @ApiProperty({ description: 'Değerlendirme Zamanı' })
  evaluatedAt!: string;
}

export class OpportunityCenterTabSectionDto {
  @ApiProperty({ description: 'Sekme Kimliği' })
  tabId!: OpportunityCenterTabId;
  @ApiProperty({ description: 'Sekme Başlığı' })
  baslik!: string;
  @ApiProperty({ description: 'Sekme Emojisi' })
  emoji!: string;
  @ApiProperty({ description: 'Açıklama' })
  aciklama!: string;
  @ApiProperty({ description: 'Kart Sayısı' })
  kartSayisi!: number;
  @ApiProperty({ type: [OpportunityCenterCardDto], description: 'Fırsat Kartları' })
  kartlar!: OpportunityCenterCardDto[];
}

export class OpportunityCenterHubDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Oluşturma Zamanı' })
  olusturmaZamani!: string;
  @ApiProperty({ description: 'Toplam Kart' })
  toplamKart!: number;
  @ApiProperty({ type: [OpportunityCenterTabSectionDto], description: 'Sekmeler' })
  sekmeler!: OpportunityCenterTabSectionDto[];
}

export class OpportunityCenterListResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Toplam Kart' })
  toplamKart!: number;
  @ApiProperty({ type: [OpportunityCenterCardDto], description: 'Fırsat Kartları' })
  kartlar!: OpportunityCenterCardDto[];
}

export class EliteScoreBreakdownDto {
  @ApiProperty({ description: 'Günlük Elite Skor' })
  gunluk!: number;
  @ApiProperty({ description: 'Haftalık Elite Skor' })
  haftalik!: number;
  @ApiProperty({ description: 'Aylık Elite Skor' })
  aylik!: number;
  @ApiProperty({ description: '3 Aylık Elite Skor' })
  ucAylik!: number;
  @ApiProperty({ description: '6 Aylık Elite Skor' })
  altiAylik!: number;
}

export class EliteScoreCardDto extends OpportunityCenterCardDto {
  @ApiProperty({ type: EliteScoreBreakdownDto, description: 'Elite Skorlar' })
  eliteScore!: EliteScoreBreakdownDto;
}

export class EliteScoreTimeframeDto {
  @ApiProperty({ description: 'Zaman Dilimi' })
  zaman!: EliteScoreTimeframe;
  @ApiProperty({ description: 'Etiket' })
  etiket!: string;
  @ApiProperty({ description: 'Elite Skor (0-100)' })
  skor!: number;
  @ApiProperty({ description: 'Kart Sayısı' })
  kartSayisi!: number;
  @ApiProperty({ type: [EliteScoreCardDto], description: 'Elite Skorlu Fırsat Kartları' })
  kartlar!: EliteScoreCardDto[];
}

export class EliteScoreResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Oluşturma Zamanı' })
  olusturmaZamani!: string;
  @ApiProperty({ description: 'Not' })
  not!: string;
  @ApiProperty({ type: [EliteScoreTimeframeDto], description: 'Zaman Dilimleri' })
  zamanlar!: EliteScoreTimeframeDto[];
}
