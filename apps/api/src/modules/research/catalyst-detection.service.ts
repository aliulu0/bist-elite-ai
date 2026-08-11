import { Injectable } from '@nestjs/common';
import {
  Catalyst,
  CatalystType,
  ResearchEvidenceItem,
} from './interfaces/research-intelligence.types';
import { ResearchImportance } from './interfaces/research.types';
import { normalizeTurkish } from './turkish-text.util';

interface DetectionPattern {
  type: CatalystType;
  keywords: string[];
}

const DETECTION_PATTERNS: DetectionPattern[] = [
  { type: 'new_investment', keywords: ['yeni yatırım', 'yatırım planı'] },
  { type: 'tender', keywords: ['ihale'] },
  { type: 'government_contract', keywords: ['kamu sözleşmesi', 'government contract'] },
  { type: 'dividend', keywords: ['temettü', 'kar payı', 'dividend'] },
  { type: 'bonus_issue', keywords: ['bedelsiz', 'bonus issue'] },
  { type: 'capital_increase', keywords: ['sermaye artırımı', 'bedelli', 'capital increase'] },
  { type: 'patent', keywords: ['patent'] },
  { type: 'factory', keywords: ['fabrika', 'factory'] },
  { type: 'partnership', keywords: ['ortaklık', 'iş birliği', 'stratejik ortaklık', 'anlaşma'] },
  { type: 'ceo_change', keywords: ['genel müdür', 'ceo değişikliği', 'ceo'] },
  { type: 'spk_decision', keywords: ['spk kararı', 'spk'] },
  { type: 'foreign_investment', keywords: ['yabancı yatırım', 'foreign investment'] },
  { type: 'acquisition', keywords: ['satın alma', 'devralma', 'acquisition'] },
  { type: 'merger', keywords: ['birleşme', 'merger'] },
  { type: 'rnd', keywords: ['ar-ge', 'araştırma geliştirme', 'r&d'] },
  { type: 'export_contract', keywords: ['ihracat anlaşması', 'export contract', 'ihracat'] },
];

@Injectable()
export class CatalystDetectionService {
  detect(items: ResearchEvidenceItem[]): Catalyst[] {
    const results: Catalyst[] = [];
    const seen = new Set<string>();
    const now = new Date().toISOString();

    for (const item of items) {
      const text = normalizeTurkish(`${item.title} ${item.snippet ?? ''}`);

      for (const pattern of DETECTION_PATTERNS) {
        const key = `${pattern.type}-${item.ticker ?? item.sector ?? ''}`;
        if (seen.has(key)) continue;
        if (!pattern.keywords.some((keyword) => text.includes(normalizeTurkish(keyword)))) {
          continue;
        }

        seen.add(key);
        results.push({
          id: `catalyst-${pattern.type}-${this.hashId(item.id)}`,
          type: pattern.type,
          ticker: item.ticker,
          sector: item.sector,
          title: item.title,
          statement: item.snippet ?? item.title,
          url: item.url,
          source: item.source,
          sourceType: item.sourceType,
          detectedAt: now,
          importance: item.importance ?? ResearchImportance.MEDIUM,
          verification: item.official ? 'verified' : 'unknown',
        });
      }
    }

    return results;
  }

  private hashId(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}