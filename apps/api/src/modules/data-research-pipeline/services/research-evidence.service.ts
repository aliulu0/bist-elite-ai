import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../../common/cache/cache.service';
import {
  ResearchEvidence,
  ResearchEvidenceType,
  ResearchEvidenceReport,
  SourceQualityTier,
  DataProviderName,
  ResearchEvidenceReport as REReport,
  DEFAULT_SOURCE_QUALITY_TIERS,
  STORY_TYPE_KEYWORDS,
  StoryType,
  StoryEvidence,
} from '../interfaces';

const CACHE_NAMESPACE = 'research-evidence';
const EVIDENCE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class ResearchEvidenceService {
  private readonly logger = new Logger(ResearchEvidenceService.name);

  constructor(private readonly cache: CacheService) {}

  async getEvidenceForTicker(ticker: string): Promise<ResearchEvidenceReport> {
    const cacheKey = `evidence:${ticker.toUpperCase()}`;
    const cached = this.cache.get<ResearchEvidenceReport>(cacheKey, 'research-evidence');
    if (cached) return cached;

    const evidence = await this.buildEvidenceForTicker(ticker);
    const stories = this.detectStories(evidence);

    const report: ResearchEvidenceReport = {
      ticker: ticker.toUpperCase(),
      evidence,
      stories,
      generatedAt: new Date().toISOString(),
      summary: {
        totalEvidence: evidence.length,
        tier1Evidence: evidence.filter(e => e.sourceTier === 'TIER_1').length,
        tier2Evidence: evidence.filter(e => e.sourceTier === 'TIER_2').length,
        tier3Evidence: evidence.filter(e => e.sourceTier === 'TIER_3').length,
        verifiedStories: stories.filter(s => s.storyStrength === 'VERIFIED').length,
      },
    };

    this.cache.set(`evidence:${ticker.toUpperCase()}`, report, 10 * 60 * 1000, 'research-evidence');
    return report;
  }

  async getEvidenceByType(ticker: string, type: ResearchEvidenceType): Promise<ResearchEvidence[]> {
    const report = await this.getEvidenceForTicker(ticker);
    return report.evidence.filter(e => e.evidenceType === type);
  }

  async getStoriesForTicker(ticker: string): Promise<StoryEvidence[]> {
    const report = await this.getEvidenceForTicker(ticker);
    return report.stories;
  }

  private async buildEvidenceForTicker(ticker: string): Promise<ResearchEvidence[]> {
    return [];
  }

  private detectStories(evidence: ResearchEvidence[]): StoryEvidence[] {
    const stories: StoryEvidence[] = [];

    for (const [storyType, keywords] of Object.entries(STORY_TYPE_KEYWORDS)) {
      const matchingEvidence = evidence.filter(e => 
        keywords.some(kw => 
          e.title.toLowerCase().includes(kw.toLowerCase()) ||
          (typeof e.metadata?.content === 'string' && e.metadata.content.toLowerCase().includes(kw.toLowerCase()))
        )
      );

      if (matchingEvidence.length > 0) {
        const maxCredibility = Math.max(...matchingEvidence.map(e => e.credibility));
        const storyStrength = this.calculateStoryStrength(matchingEvidence, maxCredibility);
        
        stories.push({
          ...matchingEvidence[0],
          storyType: storyType as StoryType,
          storyStrength,
          supportingEvidenceIds: matchingEvidence.map(e => e.id),
        });
      }
    }

    return stories;
  }

  private calculateStoryStrength(evidence: ResearchEvidence[], maxCredibility: number): 'WEAK' | 'MODERATE' | 'STRONG' | 'VERIFIED' {
    const maxCred = Math.max(...evidence.map(e => e.credibility));
    const count = evidence.length;
    
    if (maxCred >= 0.9 && evidence.length >= 3) return 'VERIFIED';
    if (maxCred >= 0.8 && evidence.length >= 2) return 'STRONG';
    if (maxCred >= 0.7 && evidence.length >= 1) return 'MODERATE';
    return 'WEAK';
  }

  async normalizeEvidence(rawEvidence: any[], ticker: string, source: string): Promise<ResearchEvidence[]> {
    const sourceTier = this.getSourceTier(source);
    
    return rawEvidence.map((item, index) => ({
      id: `ev-${ticker}-${source}-${Date.now()}-${index}`,
      ticker: ticker.toUpperCase(),
      title: item.title ?? item.headline ?? 'Untitled',
      source: source as any,
      sourceTier,
      url: item.url ?? item.link ?? null,
      publishedAt: item.publishedAt ?? item.date ?? item.published_date ?? null,
      fetchedAt: new Date().toISOString(),
      sentiment: item.sentiment ?? null,
      relevance: item.relevance ?? 0.5,
      evidenceType: this.inferEvidenceType(item),
      credibility: this.calculateCredibility(item),
      contentHash: this.generateContentHash(item),
      metadata: { original: item },
    }));
  }

  private getSourceTier(source: string): 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNKNOWN' {
    const provider = source.toLowerCase().replace(/[^a-z0-9-]/g, '-') as DataProviderName;
    return DEFAULT_SOURCE_QUALITY_TIERS[provider] ?? 'UNKNOWN';
  }

  private inferEvidenceType(item: any): ResearchEvidenceType {
    const text = `${item.title ?? ''} ${item.content ?? ''} ${item.summary ?? ''}`.toLowerCase();
    
    if (text.includes('kayyum') || text.includes('kayıt')) return 'REGULATORY_FILING';
    if (text.includes('bilanço') || text.includes('finansal') || text.includes('earnings')) return 'EARNINGS_REPORT';
    if (text.includes('temettü') || text.includes('dividend')) return 'DIVIDEND_ANNOUNCEMENT';
    if (text.includes('sözleşme') || text.includes('contract')) return 'NEW_CONTRACT';
    if (text.includes('yatırım') || text.includes('investment')) return 'INVESTMENT';
    if (text.includes('kapasite') || text.includes('capacity')) return 'CAPACITY_EXPANSION';
    if (text.includes('yeni tesis') || text.includes('new facility')) return 'NEW_FACILITY';
    if (text.includes('ihracat') || text.includes('export')) return 'EXPORT_AGREEMENT';
    if (text.includes('ortaklık') || text.includes('partnership')) return 'PARTNERSHIP';
    if (text.includes('satın alma') || text.includes('acquisition')) return 'ACQUISITION';
    if (text.includes('ürün lansman') || text.includes('product launch')) return 'PRODUCT_LAUNCH';
    if (text.includes('yönetim') || text.includes('management')) return 'MANAGEMENT_CHANGE';
    if (text.includes('hisse') || text.includes('share') || text.includes('insider')) return 'INSIDER_TRANSACTION';
    if (text.includes('haber') || text.includes('news')) return 'NEWS';
    
    return 'OTHER';
  }

  private calculateCredibility(item: any): number {
    let score = 0.5;
    
    if (item.source?.includes('kap.org.tr')) score += 0.3;
    if (item.source?.includes('tcmb') || item.source?.includes('tcmb.gov.tr')) score += 0.3;
    if (item.source?.includes('fintables')) score += 0.2;
    if (item.isOfficial) score += 0.2;
    if (item.official) score += 0.2;
    if (item.reliabilityScore) score += item.reliabilityScore * 0.2;
    
    return Math.min(1, score);
  }

  private generateContentHash(item: any): string {
    const content = `${item.title ?? ''}${item.content ?? ''}${item.url ?? ''}${item.publishedAt ?? ''}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}