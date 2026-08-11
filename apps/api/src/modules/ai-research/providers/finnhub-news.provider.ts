import { Injectable } from '@nestjs/common';
import { BaseAiResearchProvider } from './base-ai-provider';
import { getProviderConfig } from '../ai-research.config';
import { AiEvidenceItem, ResearchBundle, ResearchImportance } from '../ai-research.types';
import { FinancialStatement } from '../../market-data/interfaces/unified-domain.types';

@Injectable()
export class FinnhubNewsProvider extends BaseAiResearchProvider {
  constructor() {
    super(getProviderConfig('finnhub-news'));
  }

  protected collectEvidence(bundle: ResearchBundle): AiEvidenceItem[] {
    const financials = bundle.financials?.data;
    if (!financials || financials.source !== 'finnhub') return [];

    const items: AiEvidenceItem[] = [];
    const points: Array<{ label: string; value: number | null }> = [
      { label: 'Gelir (revenue)', value: financials.revenue },
      { label: 'Net kar (netIncome)', value: financials.netIncome },
      { label: 'FAVÖK (ebitda)', value: financials.ebitda },
      { label: 'Brüt kar (grossProfit)', value: financials.grossProfit },
    ];

    for (const point of points) {
      if (point.value === null || point.value === undefined) continue;
      items.push({
        id: `fh-${this.hashId(`${financials.symbol}-${point.label}`)}`,
        provider: this.name,
        source: 'Finnhub',
        sourceType: 'news',
        title: `${financials.symbol} ${point.label}`,
        snippet: `${financials.symbol} için Finnhub ${point.label}: ${this.formatNumber(point.value)} (dönem: ${financials.period})`,
        publishedAt: financials.lastUpdated,
        importance: ResearchImportance.MEDIUM,
        official: false,
        qualityScore: 0.7,
        contentHash: this.hashId(`${financials.symbol}-${point.label}-${point.value}`),
      });
    }

    return items;
  }

  protected buildSummary(_bundle: ResearchBundle, items: AiEvidenceItem[]): string {
    if (items.length === 0) return '';
    return `Finnhub News: ${items.length} finansal veri noktası bulundu`;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('tr-TR').format(value);
  }
}
