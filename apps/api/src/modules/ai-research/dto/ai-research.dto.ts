import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AIConsensus,
  AiConflict,
  AiProviderName,
  AiResearchSource,
} from '../ai-research.types';

export class AIConsensusDto {
  @ApiProperty({ example: 'THYAO.IS', description: 'Hisse sembolü' })
  ticker!: string;

  @ApiPropertyOptional({ example: 'Havayolu sektöründe büyüme devam ediyor', nullable: true })
  chatgptSummary!: string | null;

  @ApiPropertyOptional({ example: 'Güçlü talep görülüyor', nullable: true })
  geminiSummary!: string | null;

  @ApiPropertyOptional({ example: 'Yolcu trafiği artıyor', nullable: true })
  perplexitySummary!: string | null;

  @ApiPropertyOptional({ example: 'Kâr marjı yükseliyor', nullable: true })
  grokSummary!: string | null;

  @ApiProperty({ example: 'Haber 1 · Haber 2 · Haber 3', description: 'Birleşik haber özeti' })
  newsSummary!: string;

  @ApiProperty({ type: Object, isArray: true, description: 'Araştırma kaynakları' })
  researchSources!: AiResearchSource[];

  @ApiProperty({ example: 0.72, description: 'Sağlayıcılar arası anlaşma seviyesi (0-1)' })
  agreementLevel!: number;

  @ApiProperty({ type: Object, isArray: true, description: 'Tespit edilen çelişkiler' })
  conflicts!: AiConflict[];

  @ApiProperty({ example: 0.68, description: 'Güven seviyesi (0-1)' })
  confidence!: number;

  @ApiProperty({ example: 68, description: 'Konsensüs puanı (0-100)' })
  consensusScore!: number;

  @ApiProperty({ type: Object, description: 'Sağlayıcı bazlı özetler' })
  providerSummaries!: Record<string, string>;

  @ApiProperty({ example: 42, description: 'Toplam kanıt sayısı' })
  totalEvidence!: number;

  @ApiProperty({ example: 7, description: 'Kaldırılan kopya sayısı' })
  duplicatesRemoved!: number;

  @ApiProperty({ example: '2025-01-15T12:00:00.000Z', description: 'Oluşturulma zamanı' })
  timestamp!: string;

  static from(consensus: AIConsensus): AIConsensusDto {
    return { ...consensus };
  }
}

export class AIResearchProvidersDto {
  @ApiProperty({ example: 'google-news', enum: ['google-news'], description: 'Sağlayıcı adı' })
  name!: AiProviderName;

  @ApiProperty({ example: true, description: 'Aktif mi' })
  enabled!: boolean;

  @ApiProperty({ example: 'idle', description: 'Durum' })
  status!: string;

  @ApiPropertyOptional({ example: '2025-01-15T12:00:00.000Z', nullable: true })
  lastSync!: string | null;

  @ApiProperty({ example: 12, description: 'Toplam istek sayısı' })
  totalRequests!: number;
}

export class AIResearchRefreshDto {
  @ApiProperty({ example: 'THYAO.IS', description: 'Yenilenen hisse sembolü' })
  ticker!: string;

  @ApiProperty({ type: Object, description: 'Yeni konsensüs' })
  consensus!: AIConsensusDto;
}
