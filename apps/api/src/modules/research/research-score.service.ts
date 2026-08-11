import { Injectable } from '@nestjs/common';
import {
  ResearchEvidenceItem,
  ResearchScoreResult,
  ResearchScoreFactors,
} from './interfaces/research-intelligence.types';

@Injectable()
export class ResearchScoreService {
  score(items: ResearchEvidenceItem[]): ResearchScoreResult {
    const total = items.length;
    if (total === 0) {
      return {
        score: 0,
        factors: {
          sourceQuality: 0,
          sourceCount: 0,
          officialSources: 0,
          freshness: 0,
          duplicateRatio: 1,
        },
        grade: 'D',
      };
    }

    const officialCount = items.filter((item) => item.official).length;
    const uniqueUrls = new Set(items.map((item) => item.url).filter(Boolean));
    const duplicateRatio = uniqueUrls.size / total;
    const sourceQuality =
      items.reduce((sum, item) => sum + item.qualityScore, 0) / total;
    const sourceCountFactor = Math.min(1, total / 20);
    const officialFactor = Math.min(1, officialCount / total);
    const freshness = this.freshness(items);

    const factors: ResearchScoreFactors = {
      sourceQuality,
      sourceCount: sourceCountFactor,
      officialSources: officialFactor,
      freshness,
      duplicateRatio,
    };

    const score = Math.round(
      100 *
        (0.3 * sourceQuality +
          0.2 * sourceCountFactor +
          0.25 * officialFactor +
          0.15 * freshness +
          0.1 * duplicateRatio),
    );
    const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';

    return { score, factors, grade };
  }

  private freshness(items: ResearchEvidenceItem[]): number {
    const now = Date.now();
    let valid = 0;
    let totalDays = 0;
    for (const item of items) {
      if (!item.publishedAt) continue;
      const time = new Date(item.publishedAt).getTime();
      if (Number.isNaN(time)) continue;
      valid++;
      totalDays += Math.max(0, (now - time) / 86_400_000);
    }
    if (valid === 0) return 0;
    const avgDays = totalDays / valid;
    return Math.max(0, 1 - avgDays / 30);
  }
}