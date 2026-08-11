import { Injectable } from '@nestjs/common';
import {
  ResearchEvidenceItem,
  VerifiedStatement,
  VerificationLevel,
} from './interfaces/research-intelligence.types';
import { SOURCE_PRIORITY_LIST } from './interfaces/verification.types';

@Injectable()
export class ResearchVerificationService {
  verifyStatements(
    items: ResearchEvidenceItem[],
    ticker?: string,
    companyName?: string,
  ): VerifiedStatement[] {
    if (items.length === 0) return [];

    const official = items.filter((item) => item.official);
    const ratio = official.length / items.length;
    const level: VerificationLevel =
      official.length > 0 && ratio >= 0.5 ? 'verified' : official.length > 0 ? 'likely' : 'unknown';

    return [
      {
        statement: `Evidence bundle for ${companyName ?? ticker ?? 'market'}`,
        level,
        evidence: items.slice(0, 10).map((item) => ({
          source: item.source,
          sourceType: item.sourceType,
          url: item.url,
          priority: this.sourcePriority(item.sourceType),
        })),
        verifiedAt: new Date().toISOString(),
      },
    ];
  }

  private sourcePriority(sourceType: string): number {
    const entry = SOURCE_PRIORITY_LIST.find((priority) =>
      priority.label.toLowerCase().includes(sourceType.toLowerCase()),
    );
    return entry?.rank ?? 10;
  }
}