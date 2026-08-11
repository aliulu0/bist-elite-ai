import { Injectable } from '@nestjs/common';
import { BaseAiResearchProvider } from './base-ai-provider';
import { getProviderConfig } from '../ai-research.config';
import { AiEvidenceItem, ResearchBundle, ResearchImportance } from '../ai-research.types';

@Injectable()
export class TcmbProvider extends BaseAiResearchProvider {
  constructor() {
    super(getProviderConfig('tcmb'));
  }

  protected collectEvidence(bundle: ResearchBundle): AiEvidenceItem[] {
    if (bundle.macro.length === 0) return [];

    return bundle.macro.map((indicator) => ({
      id: `tcmb-${this.hashId(`${indicator.symbol}-${indicator.timestamp}`)}`,
      provider: this.name,
      source: 'TCMB',
      sourceType: 'macro',
      title: indicator.symbol,
      snippet: `${indicator.value}${indicator.changePercent !== undefined ? ` (%${indicator.changePercent})` : ''}`,
      publishedAt: indicator.timestamp,
      importance: ResearchImportance.LOW,
      official: true,
      qualityScore: 0.9,
      contentHash: this.hashId(`${indicator.symbol}-${indicator.value}`),
    }));
  }

  protected buildSummary(_bundle: ResearchBundle, items: AiEvidenceItem[]): string {
    if (items.length === 0) return '';
    return `TCMB: ${items.length} makro gösterge bulundu`;
  }
}
