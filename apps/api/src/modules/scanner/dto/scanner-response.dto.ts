import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecisionResultDto } from '../../decision/decision.dto';
import { OpportunityResultDto } from '../../ai-opportunity/opportunity.dto';
import { EntryZoneResultDto } from '../../entry/entry.dto';
import { AnalystResultDto } from '../../analyst/analyst.dto';

export class ScannerResultDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
  @ApiProperty({ description: 'Şirket' })
  company!: string;
  @ApiPropertyOptional({ description: 'Sektör', nullable: true })
  sector!: string | null;
  @ApiPropertyOptional({ description: 'Fiyat', nullable: true })
  price!: number | null;
  @ApiPropertyOptional({ description: 'Hacim', nullable: true })
  volume!: number | null;
  @ApiPropertyOptional({ description: 'Piyasa Değeri', nullable: true })
  marketCap!: number | null;
  @ApiPropertyOptional({ description: 'Teknik Skor', nullable: true })
  technicalScore!: number | null;
  @ApiPropertyOptional({ description: 'Temel Skor', nullable: true })
  fundamentalScore!: number | null;
  @ApiPropertyOptional({ description: 'Momentum Skoru', nullable: true })
  momentumScore!: number | null;
  @ApiPropertyOptional({ description: 'Trend Skoru', nullable: true })
  trendScore!: number | null;
  @ApiPropertyOptional({ description: 'Likidite Skoru', nullable: true })
  liquidityScore!: number | null;
  @ApiPropertyOptional({ description: 'Risk Skoru', nullable: true })
  riskScore!: number | null;
  @ApiPropertyOptional({ description: 'Hacim Skoru', nullable: true })
  volumeScore!: number | null;
  @ApiPropertyOptional({ description: 'Kalite Skoru', nullable: true })
  qualityScore!: number | null;
  @ApiPropertyOptional({ description: 'Doğrulama Skoru', nullable: true })
  verificationScore!: number | null;
  @ApiPropertyOptional({ description: 'Katalizör Skoru', nullable: true })
  catalystScore!: number | null;
  @ApiPropertyOptional({ description: 'AI Skoru', nullable: true })
  aiScore!: number | null;
  @ApiPropertyOptional({ description: 'AI Güveni', nullable: true })
  aiConfidence!: number | null;
  @ApiPropertyOptional({ description: 'Yapay Zeka Kararı', nullable: true, type: DecisionResultDto })
  decision!: DecisionResultDto | null;
  @ApiPropertyOptional({ description: 'AI Fırsat', nullable: true, type: OpportunityResultDto })
  opportunity!: OpportunityResultDto | null;
  @ApiPropertyOptional({ description: 'Giriş Bölgesi', nullable: true, type: EntryZoneResultDto })
  entryZone!: EntryZoneResultDto | null;
  @ApiPropertyOptional({ description: 'AI Analiz Özeti', nullable: true, type: AnalystResultDto })
  analyst!: AnalystResultDto | null;
  @ApiProperty({ description: 'Sağlayıcı' })
  provider!: string;
  @ApiPropertyOptional({ description: 'Son Güncelleme', nullable: true })
  lastUpdate!: string | null;
  @ApiProperty({ description: 'Strateji Kimliği' })
  strategyId!: string;
  @ApiProperty({ description: 'Strateji Adı' })
  strategyName!: string;
  @ApiPropertyOptional({ description: 'Strateji Skoru', nullable: true })
  strategyScore!: number | null;
  @ApiPropertyOptional({ description: 'Strateji Güveni', nullable: true })
  strategyConfidence!: number | null;
  @ApiProperty({ description: 'Geçen Kurallar' })
  passedRules!: string[];
  @ApiProperty({ description: 'Başarısız Kurallar' })
  failedRules!: string[];
  @ApiProperty({ description: 'Sinyaller' })
  signals!: string[];
  @ApiProperty({ description: 'Gerekçeler' })
  reasons!: string[];
  @ApiProperty({ description: 'Tarama Zamanı' })
  scannedAt!: string;
}

export class ScanSummaryDto {
  @ApiProperty({ description: 'Strateji Kimliği' })
  strategyId!: string;
  @ApiProperty({ description: 'Strateji Adı' })
  strategyName!: string;
  @ApiProperty({ description: 'Taranan Hisse Sayısı' })
  scannedCount!: number;
  @ApiProperty({ description: 'Sonuç Sayısı' })
  resultCount!: number;
  @ApiProperty({ description: 'Hata Sayısı' })
  errorCount!: number;
  @ApiProperty({ description: 'Tarama Süresi (ms)' })
  durationMs!: number;
  @ApiProperty({ description: 'Tamamlanma Zamanı' })
  completedAt!: string;
}

export class ScannerResultsResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Sonuç Sayısı' })
  hisseSayisi!: number;
  @ApiProperty({ description: 'Toplam Taranan Hisse' })
  toplamTaranan!: number;
  @ApiProperty({ description: 'Tarama Süresi (ms)' })
  taramaSuresi!: number;
  @ApiPropertyOptional({ description: 'Ortalama AI Skoru', nullable: true })
  ortalamaYapayZekaPuani!: number | null;
  @ApiPropertyOptional({ description: 'Ortalama AI Güveni', nullable: true })
  ortalamaYapayZekaGuveni!: number | null;
  @ApiProperty({ description: 'Sonuçlar' })
  sonuclar!: ScannerResultDto[];
}

export class ScannerRunResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Sonuç Sayısı' })
  hisseSayisi!: number;
  @ApiProperty({ description: 'Toplam Taranan Hisse' })
  toplamTaranan!: number;
  @ApiProperty({ description: 'Tarama Süresi (ms)' })
  taramaSuresi!: number;
  @ApiPropertyOptional({ description: 'Ortalama AI Skoru', nullable: true })
  ortalamaYapayZekaPuani!: number | null;
  @ApiPropertyOptional({ description: 'Ortalama AI Güveni', nullable: true })
  ortalamaYapayZekaGuveni!: number | null;
  @ApiProperty({ description: 'Sonuçlar' })
  sonuclar!: ScannerResultDto[];
}

export class ScannerTopResultDto {
  @ApiProperty({ description: 'Kod (Ticker)' })
  ticker!: string;
  @ApiProperty({ description: 'Şirket' })
  company!: string;
  @ApiPropertyOptional({ description: 'Sektör', nullable: true })
  sector!: string | null;
  @ApiPropertyOptional({ description: 'AI Skoru', nullable: true })
  aiScore!: number | null;
  @ApiPropertyOptional({ description: 'AI Güveni', nullable: true })
  aiConfidence!: number | null;
  @ApiProperty({ description: 'Strateji Kimliği' })
  strategyId!: string;
  @ApiProperty({ description: 'Strateji Adı' })
  strategyName!: string;
  @ApiProperty({ description: 'Tarama Zamanı' })
  scannedAt!: string;
}

export class ScannerTopResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Toplam Hisse' })
  toplamHisse!: number;
  @ApiPropertyOptional({ description: 'Ortalama AI Skoru', nullable: true })
  ortalamaYapayZekaPuani!: number | null;
  @ApiPropertyOptional({ description: 'Ortalama AI Güveni', nullable: true })
  ortalamaYapayZekaGuveni!: number | null;
  @ApiProperty({ description: 'Sonuçlar' })
  sonuclar!: ScannerTopResultDto[];
}

export class ScannerFilterResponseDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Toplam Hisse' })
  toplamHisse!: number;
  @ApiProperty({ description: 'Filtre Sonucu' })
  filtreSonucu!: number;
  @ApiPropertyOptional({ description: 'Ortalama AI Skoru', nullable: true })
  ortalamaYapayZekaPuani!: number | null;
  @ApiPropertyOptional({ description: 'Ortalama AI Güveni', nullable: true })
  ortalamaYapayZekaGuveni!: number | null;
  @ApiProperty({ description: 'Sonuçlar' })
  sonuclar!: ScannerResultDto[];
}

export class StrategyInfoDto {
  @ApiProperty({ description: 'Strateji Kimliği' })
  id!: string;
  @ApiProperty({ description: 'Strateji Adı' })
  name!: string;
  @ApiProperty({ description: 'Açıklama' })
  description!: string;
  @ApiProperty({ description: 'Etkin mi' })
  enabled!: boolean;
}

export class ScannerOverviewDto {
  @ApiProperty({ description: 'Başlık' })
  baslik!: string;
  @ApiProperty({ description: 'Toplam Hisse' })
  toplamHisse!: number;
  @ApiProperty({ description: 'Aktif Hisse' })
  aktifHisse!: number;
  @ApiProperty({ description: 'Sektör Sayısı' })
  sektorSayisi!: number;
  @ApiProperty({ description: 'Strateji Sayısı' })
  stratejiSayisi!: number;
  @ApiProperty({ description: 'Stratejiler' })
  stratejiler!: StrategyInfoDto[];
  @ApiPropertyOptional({ description: 'Son Tarama', nullable: true })
  sonTarama!: ScanSummaryDto | null;
}