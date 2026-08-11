import { Injectable } from '@nestjs/common';
import { BaseAiResearchProvider } from './base-ai-provider';
import { getProviderConfig } from '../ai-research.config';
import { AiEvidenceItem, ResearchBundle, ResearchImportance } from '../ai-research.types';
import { Company } from '../../market-data/interfaces/unified-domain.types';

@Injectable()
export class YahooFinanceProvider extends BaseAiResearchProvider {
  constructor() {
    super(getProviderConfig('yahoo-finance'));
  }

  protected collectEvidence(bundle: ResearchBundle): AiEvidenceItem[] {
    const company = bundle.company?.data;
    if (!company || company.source !== 'yahoo') return [];

    const items: AiEvidenceItem[] = [];
    if (company.name) {
      items.push({
        id: `yf-${this.hashId(`${company.symbol}-name`)}`,
        provider: this.name,
        source: 'Yahoo Finance',
        sourceType: 'fundamental',
        title: `${company.symbol} şirket profili`,
        snippet: `${company.name} (${company.exchange}, ${company.currency})`,
        publishedAt: company.lastUpdated,
        importance: ResearchImportance.MEDIUM,
        official: false,
        qualityScore: 0.75,
        contentHash: this.hashId(`${company.symbol}-name`),
      });
    }
    if (company.sector) {
      items.push({
        id: `yf-${this.hashId(`${company.symbol}-sector`)}`,
        provider: this.name,
        source: 'Yahoo Finance',
        sourceType: 'fundamental',
        title: `${company.symbol} sektör`,
        snippet: company.sector,
        publishedAt: company.lastUpdated,
        importance: ResearchImportance.LOW,
        official: false,
        qualityScore: 0.7,
        contentHash: this.hashId(`${company.symbol}-sector`),
      });
    }
    if (typeof company.marketCap === 'number' && company.marketCap > 0) {
      items.push({
        id: `yf-${this.hashId(`${company.symbol}-mcap`)}`,
        provider: this.name,
        source: 'Yahoo Finance',
        sourceType: 'fundamental',
        title: `${company.symbol} piyasa değeri`,
        snippet: new Intl.NumberFormat('tr-TR', { notation: 'compact' }).format(company.marketCap),
        publishedAt: company.lastUpdated,
        importance: ResearchImportance.LOW,
        official: false,
        qualityScore: 0.7,
        contentHash: this.hashId(`${company.symbol}-mcap`),
      });
    }

    return items;
  }

  protected buildSummary(_bundle: ResearchBundle, items: AiEvidenceItem[]): string {
    if (items.length === 0) return '';
    return `Yahoo Finance: ${items.length} temel veri noktası bulundu`;
  }
}
