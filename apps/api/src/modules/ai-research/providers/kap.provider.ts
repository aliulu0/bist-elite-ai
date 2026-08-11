import { Injectable } from '@nestjs/common';
import { BaseAiResearchProvider } from './base-ai-provider';
import { getProviderConfig } from '../ai-research.config';
import { AiEvidenceItem, ResearchBundle, ResearchImportance } from '../ai-research.types';
import { Disclosure } from '../../market-data/interfaces/unified-domain.types';

@Injectable()
export class KapProvider extends BaseAiResearchProvider {
  constructor() {
    super(getProviderConfig('kap'));
  }

  protected collectEvidence(bundle: ResearchBundle): AiEvidenceItem[] {
    const disclosures = bundle.disclosures?.data ?? [];
    if (disclosures.length === 0) return [];

    return disclosures.map((disclosure) => this.toEvidence(disclosure));
  }

  protected buildSummary(_bundle: ResearchBundle, items: AiEvidenceItem[]): string {
    if (items.length === 0) return '';
    return `KAP: ${items.length} bildirim bulundu`;
  }

  private toEvidence(disclosure: Disclosure): AiEvidenceItem {
    return {
      id: `kap-${this.hashId(disclosure.url ?? `${disclosure.symbol}-${disclosure.title}`)}`,
      provider: this.name,
      source: 'KAP',
      sourceType: 'kap',
      title: disclosure.title,
      snippet: `${disclosure.category} — ${disclosure.symbol}`,
      url: disclosure.url ?? undefined,
      publishedAt: disclosure.date,
      importance: this.importanceFor(disclosure.category),
      official: true,
      qualityScore: 0.95,
      contentHash: this.hashId(disclosure.url ?? `${disclosure.title}-${disclosure.date}`),
    };
  }

  private importanceFor(category: string): ResearchImportance {
    const value = category.toLowerCase();
    if (value.includes('kâr') || value.includes('kar') || value.includes('temettü') || value.includes('sermaye')) {
      return ResearchImportance.CRITICAL;
    }
    if (value.includes('sözleşme') || value.includes('ihale') || value.includes('birleşme')) {
      return ResearchImportance.HIGH;
    }
    return ResearchImportance.MEDIUM;
  }
}
