import { Injectable } from '@nestjs/common';
import { BaseAiResearchProvider } from './base-ai-provider';
import { getProviderConfig } from '../ai-research.config';
import { AiEvidenceItem, ResearchBundle, ResearchImportance } from '../ai-research.types';
import { ResearchArticle } from '../../research/interfaces/research.types';

@Injectable()
export class SerpApiProvider extends BaseAiResearchProvider {
  constructor() {
    super(getProviderConfig('serpapi'));
  }

  protected collectEvidence(bundle: ResearchBundle): AiEvidenceItem[] {
    return bundle.news
      .filter((article) => article.provider === 'serp-api')
      .map((article) => this.toEvidence(article));
  }

  protected buildSummary(_bundle: ResearchBundle, items: AiEvidenceItem[]): string {
    if (items.length === 0) return '';
    return items[0].title;
  }

  private toEvidence(article: ResearchArticle): AiEvidenceItem {
    const importance = article.importance ?? ResearchImportance.LOW;
    return {
      id: `sa-${this.hashId(article.url || article.id)}`,
      provider: this.name,
      source: article.source || 'SerpAPI',
      sourceType: 'search',
      title: article.title,
      snippet: article.summary,
      url: article.url,
      publishedAt: article.publishedAt,
      importance,
      official: false,
      qualityScore: this.qualityScore(article),
      sentiment: article.sentiment,
      contentHash: this.hashId(article.url || `${article.title}-${article.publishedAt}`),
    };
  }

  private qualityScore(article: ResearchArticle): number {
    let score = 0.5;
    if (article.summary) score += 0.1;
    if (article.publishedAt) score += 0.15;
    if (article.sentiment?.score) score += 0.05;
    if (article.importance === ResearchImportance.CRITICAL) score += 0.1;
    return Math.min(1, score);
  }
}
