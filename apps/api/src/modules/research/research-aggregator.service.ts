import { Injectable } from '@nestjs/common';
import {
  ResearchAggregationResult,
  ResearchAggregatorInput,
  ResearchEvidenceItem,
  SerpSearchResultItem,
} from './interfaces/research-intelligence.types';
import { ResearchArticle } from './interfaces/research.types';

@Injectable()
export class ResearchAggregatorService {
  aggregate(input: ResearchAggregatorInput): ResearchAggregationResult {
    const items: ResearchEvidenceItem[] = [];

    for (const item of input.search?.results ?? []) {
      items.push({
        id: `search-${this.hashId(item.link ?? item.title ?? '')}`,
        source: item.source ?? this.extractSource(item.link),
        sourceType: 'search',
        title: item.title ?? '',
        snippet: item.snippet,
        url: item.link ?? item.url,
        publishedAt: item.date,
        ticker: input.ticker,
        sector: input.sector,
        language: 'tr',
        official: this.isOfficial(item.link ?? ''),
        qualityScore: this.qualityScore(item),
      });
    }

    for (const article of input.news ?? []) {
      items.push(this.fromArticle(article, input));
    }

    for (const disclosure of input.disclosures ?? []) {
      items.push({
        id: `kap-${this.hashId(disclosure.url ?? disclosure.title)}`,
        source: 'KAP',
        sourceType: 'kap',
        title: disclosure.title,
        url: disclosure.url ?? undefined,
        publishedAt: disclosure.date,
        ticker: input.ticker,
        sector: input.sector,
        language: 'tr',
        official: true,
        qualityScore: 0.95,
      });
    }

    if (input.companySearch) {
      for (const item of input.companySearch.results) {
        items.push({
          id: `csearch-${this.hashId(item.link ?? item.title ?? '')}`,
          source: item.source ?? this.extractSource(item.link),
          sourceType: 'search',
          title: item.title ?? '',
          snippet: item.snippet,
          url: item.link ?? item.url,
          publishedAt: item.date,
          ticker: input.ticker,
          sector: input.sector,
          language: 'tr',
          official: this.isOfficial(item.link ?? ''),
          qualityScore: this.qualityScore(item),
        });
      }
    }

    if (input.finance) {
      for (const item of input.finance.marketSummary ?? []) {
        items.push({
          id: `fin-${this.hashId(item.link ?? item.title ?? '')}`,
          source: this.extractSource(item.link),
          sourceType: 'finance',
          title: item.title ?? '',
          snippet: item.snippet,
          url: item.link ?? item.url,
          publishedAt: item.date,
          ticker: input.finance.ticker,
          sector: input.sector,
          language: 'en',
          official: false,
          qualityScore: this.qualityScore(item),
        });
      }
    }

    const unique = new Map<string, ResearchEvidenceItem>();
    for (const item of items) {
      const key = item.url ?? `${item.source}-${item.title}`;
      if (!key) continue;
      if (unique.has(key)) continue;
      unique.set(key, item);
    }

    const deduped = Array.from(unique.values());
    const bySourceType: Record<string, number> = {};
    for (const item of deduped) {
      bySourceType[item.sourceType] = (bySourceType[item.sourceType] ?? 0) + 1;
    }

    return {
      items: deduped,
      total: deduped.length,
      unique: deduped.length,
      duplicatesRemoved: items.length - deduped.length,
      bySourceType,
    };
  }

  private fromArticle(article: ResearchArticle, input: ResearchAggregatorInput): ResearchEvidenceItem {
    const isOfficial =
      article.source?.toLowerCase().includes('kap') ||
      article.source?.toLowerCase().includes('bist') ||
      article.source?.toLowerCase().includes('investor');
    return {
      id: article.id,
      source: article.source,
      sourceType: 'news',
      title: article.title,
      snippet: article.summary,
      url: article.url,
      publishedAt: article.publishedAt,
      ticker: input.ticker ?? article.company,
      sector: input.sector ?? article.sector,
      language: article.language,
      importance: article.importance,
      official: !!isOfficial,
      qualityScore: isOfficial ? 0.9 : 0.6,
    };
  }

  private qualityScore(item: SerpSearchResultItem): number {
    if (!item.title && !item.link) return 0;
    let score = 0.5;
    if (item.snippet) score += 0.15;
    if (item.date) score += 0.15;
    if (this.isOfficial(item.link ?? '')) score += 0.2;
    return Math.min(1, score);
  }

  private isOfficial(url: string): boolean {
    const lower = url.toLowerCase();
    return (
      lower.includes('kap.org.tr') ||
      lower.includes('bist.com.tr') ||
      lower.includes('gov.tr') ||
      lower.includes('tcmb.gov.tr')
    );
  }

  private extractSource(url?: string): string {
    if (!url) return 'web';
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return 'web';
    }
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