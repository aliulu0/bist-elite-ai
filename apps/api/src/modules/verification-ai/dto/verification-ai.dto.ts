import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  VerificationClaim,
  VerificationEvidence,
  VerificationReport,
  VerificationResult,
  VerificationVerdict,
} from '../verification-ai.types';
import { AiResearchSource } from '../../ai-research/ai-research.types';

export class VerificationEvidenceDto {
  @ApiProperty({ example: 'ev-kap-1a2b3c' })
  id!: string;

  @ApiProperty({ example: 'kap' })
  provider!: string;

  @ApiProperty({ example: 'KAP' })
  source!: string;

  @ApiProperty({ example: 'Kâr dağıtımı' })
  title!: string;

  @ApiPropertyOptional({ example: 'https://kap.org.tr/1' })
  url?: string;

  @ApiPropertyOptional({ example: '2026-08-01T10:00:00.000Z' })
  publishedAt?: string;

  @ApiProperty({ example: true })
  official!: boolean;

  @ApiProperty({ example: 1 })
  trustRank!: number;

  @ApiProperty({ example: 100 })
  trustWeight!: number;

  @ApiProperty({ example: true })
  confirming!: boolean;
}

export class VerificationClaimDto {
  @ApiProperty({ example: 'Haber 1 · Haber 2 · Haber 3' })
  statement!: string;

  @ApiProperty({ example: 'TRUE', enum: ['TRUE', 'FALSE', 'PARTIAL', 'UNVERIFIED'] })
  verdict!: VerificationVerdict;

  @ApiProperty({ example: 0.85 })
  evidenceScore!: number;

  @ApiProperty({ example: 0.9 })
  truthScore!: number;

  @ApiProperty({ example: 12 })
  evidenceCount!: number;

  @ApiProperty({ example: 6 })
  sourceCount!: number;

  @ApiProperty({ example: ['KAP', 'TCMB'] })
  trustedSources!: string[];

  @ApiProperty({ example: ['SerpAPI Search'] })
  conflictingSources!: string[];

  @ApiProperty({ example: '12 kanıt, 6 güvenilir kaynak ile doğrulandı (güven skoru 90).' })
  reason!: string;

  static from(claim: VerificationClaim): VerificationClaimDto {
    return { ...claim };
  }
}

export class VerificationResultDto {
  @ApiProperty({ example: 'THYAO.IS' })
  ticker!: string;

  @ApiProperty({ example: 'TRUE', enum: ['TRUE', 'FALSE', 'PARTIAL', 'UNVERIFIED'] })
  verified!: VerificationVerdict;

  @ApiProperty({ example: 90, description: 'Doğrulama puanı (0-100)' })
  verificationScore!: number;

  @ApiProperty({ example: 12 })
  evidenceCount!: number;

  @ApiProperty({ example: 6 })
  sourceCount!: number;

  @ApiProperty({ example: ['KAP', 'TCMB'] })
  trustedSources!: string[];

  @ApiProperty({ example: [] })
  conflictingSources!: string[];

  @ApiProperty({ example: '2026-08-07T12:00:00.000Z' })
  lastVerified!: string;

  @ApiProperty({ example: '12 kanıt, 6 güvenilir kaynak ile doğrulandı (güven skoru 90).' })
  verificationReason!: string;

  @ApiProperty({ type: VerificationClaimDto, isArray: true })
  claims!: VerificationClaimDto[];

  static from(result: VerificationResult): VerificationResultDto {
    return {
      ...result,
      claims: result.claims.map(VerificationClaimDto.from),
    };
  }
}

export class VerificationReportDto {
  @ApiProperty({ example: 'THYAO.IS' })
  ticker!: string;

  @ApiProperty({ type: Object })
  summary!: {
    verified: VerificationVerdict;
    verificationScore: number;
    evidenceCount: number;
    sourceCount: number;
    trustedSources: string[];
    conflictingSources: string[];
  };

  @ApiProperty({ type: VerificationClaimDto, isArray: true })
  claims!: VerificationClaimDto[];

  @ApiProperty({ example: '2026-08-07T12:00:00.000Z' })
  generatedAt!: string;

  static from(report: VerificationReport): VerificationReportDto {
    return {
      ...report,
      summary: { ...report.summary },
      claims: report.claims.map(VerificationClaimDto.from),
    };
  }
}

export class VerificationRefreshDto {
  @ApiProperty({ example: 'THYAO.IS' })
  ticker!: string;

  @ApiProperty({ type: VerificationResultDto })
  result!: VerificationResultDto;
}
