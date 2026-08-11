import { Injectable } from '@nestjs/common';
import {
  AIConsensus,
  AiConflict,
  AiEvidenceItem,
  AiProviderResult,
  AiProviderName,
  AiResearchSource,
  ResearchImportance,
} from '../ai-research.types';

export interface DeduplicationResult {
  items: AiEvidenceItem[];
  duplicatesRemoved: number;
}

@Injectable()
export class AIConsensusEngine {
  normalize(results: AiProviderResult[]): AiEvidenceItem[] {
    return results.flatMap((result) => result.items);
  }

  deduplicate(items: AiEvidenceItem[]): DeduplicationResult {
    const unique = new Map<string, AiEvidenceItem>();
    let duplicatesRemoved = 0;

    for (const item of items) {
      const key = item.contentHash || item.url || `${item.provider}-${item.title}`;
      if (unique.has(key)) {
        duplicatesRemoved++;
        continue;
      }
      unique.set(key, item);
    }

    return { items: Array.from(unique.values()), duplicatesRemoved };
  }

  rankConfidence(items: AiEvidenceItem[]): AiEvidenceItem[] {
    return [...items].sort((a, b) => b.qualityScore - a.qualityScore);
  }

  calculate(ticker: string, results: AiProviderResult[], enabledCount: number): AIConsensus {
    const normalized = this.normalize(results);
    const deduplicated = this.deduplicate(normalized);
    const ranked = this.rankConfidence(deduplicated.items);

    const active = results.filter((result) => result.items.length > 0);
    const providerSummaries: Record<string, string> = {};
    for (const result of results) {
      providerSummaries[result.provider] = result.summary;
    }

    const agreementLevel = this.computeAgreement(active.length, enabledCount, ranked);
    const conflicts = this.detectConflicts(results);
    const confidence = this.computeConfidence(ranked, agreementLevel, conflicts, enabledCount);
    const consensusScore = Math.round(confidence * 100);

    return {
      ticker,
      chatgptSummary: providerSummaries['chatgpt'] || null,
      geminiSummary: providerSummaries['gemini'] || null,
      perplexitySummary: providerSummaries['perplexity'] || null,
      grokSummary: providerSummaries['grok'] || null,
      newsSummary: this.buildNewsSummary(ranked),
      researchSources: this.toResearchSources(ranked),
      agreementLevel,
      conflicts,
      confidence,
      consensusScore,
      providerSummaries,
      totalEvidence: ranked.length,
      duplicatesRemoved: deduplicated.duplicatesRemoved,
      timestamp: new Date().toISOString(),
    };
  }

  private computeAgreement(activeCount: number, enabledCount: number, items: AiEvidenceItem[]): number {
    if (enabledCount === 0) return 0;
    const coverage = activeCount / enabledCount;
    const officialRatio = items.length > 0 ? items.filter((item) => item.official).length / items.length : 0;
    const freshness =
      items.length > 0
        ? items.filter((item) => item.publishedAt && Date.now() - new Date(item.publishedAt).getTime() < 14 * 24 * 60 * 60 * 1000)
            .length / items.length
        : 0;
    return Math.max(0, Math.min(1, 0.5 * coverage + 0.3 * officialRatio + 0.2 * freshness));
  }

  private detectConflicts(results: AiProviderResult[]): AiConflict[] {
    const conflicts: AiConflict[] = [];
    const errorProviders = results.filter((result) => result.status === 'error').map((result) => result.provider);
    if (errorProviders.length > 0) {
      conflicts.push({
        id: `conflict-error-${errorProviders.join('-')}`,
        providers: errorProviders,
        topic: 'provider-error',
        severity: 'medium',
        description: `${errorProviders.join(', ')} sağlayıcılarından veri alınamadı`,
      });
    }

    const sentimentSign = new Map<AiProviderName, number>();
    for (const result of results) {
      const scores = result.items
        .map((item) => item.sentiment?.score ?? 0)
        .filter((score) => score !== 0);
      if (scores.length === 0) continue;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      sentimentSign.set(result.provider, avg > 0 ? 1 : -1);
    }

    const positive = Array.from(sentimentSign.entries())
      .filter(([, sign]) => sign === 1)
      .map(([provider]) => provider);
    const negative = Array.from(sentimentSign.entries())
      .filter(([, sign]) => sign === -1)
      .map(([provider]) => provider);

    if (positive.length > 0 && negative.length > 0) {
      conflicts.push({
        id: `conflict-sentiment-${positive.join('-')}-vs-${negative.join('-')}`,
        providers: [...positive, ...negative],
        topic: 'sentiment-divergence',
        severity: 'high',
        description: `${positive.join(', ')} olumlu, ${negative.join(', ')} olumsuz değerlendiriyor`,
      });
    }

    return conflicts;
  }

  private computeConfidence(
    items: AiEvidenceItem[],
    agreementLevel: number,
    conflicts: AiConflict[],
    enabledCount: number,
  ): number {
    if (enabledCount === 0) return 0;
    const quality = items.length > 0 ? items.reduce((sum, item) => sum + item.qualityScore, 0) / items.length : 0;
    const conflictPenalty = Math.min(0.3, conflicts.length * 0.1);
    const raw = 0.5 * agreementLevel + 0.3 * quality + 0.2 * Math.min(1, items.length / Math.max(1, enabledCount * 2));
    return Math.max(0, Math.min(1, raw - conflictPenalty));
  }

  private buildNewsSummary(items: AiEvidenceItem[]): string {
    if (items.length === 0) {
      return 'Bu hisse için şu anda yeterli haber akışı bulunamadı.';
    }
    const top = items
      .filter((item) => item.importance === ResearchImportance.CRITICAL || item.importance === ResearchImportance.HIGH)
      .slice(0, 5);
    const selected = top.length > 0 ? top : items.slice(0, 5);
    return selected.map((item) => item.title).join(' · ');
  }

  private toResearchSources(items: AiEvidenceItem[]): AiResearchSource[] {
    return items.slice(0, 20).map((item) => ({
      provider: item.provider,
      source: item.source,
      title: item.title,
      url: item.url,
      publishedAt: item.publishedAt,
    }));
  }
}
