import { Injectable } from '@nestjs/common';
import { AiResearchSource, ResearchImportance } from '../ai-research/ai-research.types';
import { CatalystCategory, CatalystEvent, CatalystResult, ExpectedImpact } from './catalyst.types';
import { getCategoryConfig } from './catalyst.config';

@Injectable()
export class CatalystScoreEngine {
  scoreEvent(event: CatalystEvent, weightOverride?: number): CatalystEvent {
    const base = weightOverride ?? getCategoryConfig(event.category).weight;
    const importanceFactor = this.importanceFactor(event.importance);
    const verificationFactor = event.verified ? 1 : 0.55;
    const confidenceFactor = 0.7 + event.confidence * 0.3;

    const raw = base * importanceFactor * verificationFactor * confidenceFactor;
    const catalystScore = Math.max(0, Math.min(100, Math.round(raw)));

    return { ...event, catalystScore };
  }

  aggregate(events: CatalystEvent[]): { catalystScore: number; confidence: number; expectedImpact: ExpectedImpact } {
    if (events.length === 0) {
      return { catalystScore: 0, confidence: 0, expectedImpact: 'neutral' };
    }

    const verified = events.filter((event) => event.verified);
    const verifiedWeight = verified.length > 0 ? verified.reduce((sum, event) => sum + event.catalystScore, 0) : 0;
    const totalWeight = events.reduce((sum, event) => sum + event.catalystScore, 0);

    const catalystScore = Math.min(100, Math.round(0.6 * verifiedWeight + 0.4 * totalWeight));
    const confidence = Math.round(
      (events.reduce((sum, event) => sum + event.confidence, 0) / events.length) * 100,
    );
    const expectedImpact = this.aggregateImpact(events);

    return { catalystScore, confidence, expectedImpact };
  }

  resultFor(ticker: string, events: CatalystEvent[], rawSources: AiResearchSource[] = []): CatalystResult {
    const scored = events.map((event) => this.scoreEvent(event));
    const aggregate = this.aggregate(scored);
    const verifiedCount = scored.filter((event) => event.verified).length;

    return {
      ticker,
      catalystScore: aggregate.catalystScore,
      confidence: aggregate.confidence,
      expectedImpact: aggregate.expectedImpact,
      events: scored.sort((a, b) => b.catalystScore - a.catalystScore),
      verifiedCount,
      totalCount: scored.length,
      rawSources,
      generatedAt: new Date().toISOString(),
    };
  }

  private importanceFactor(importance: ResearchImportance): number {
    switch (importance) {
      case ResearchImportance.CRITICAL:
        return 1.2;
      case ResearchImportance.HIGH:
        return 1.1;
      case ResearchImportance.MEDIUM:
        return 1;
      default:
        return 0.8;
    }
  }

  private aggregateImpact(events: CatalystEvent[]): ExpectedImpact {
    const ranked: ExpectedImpact[] = ['very_bearish', 'bearish', 'neutral', 'bullish', 'very_bullish'];
    const score = (impact: ExpectedImpact): number => ranked.indexOf(impact);

    const weighted = events.reduce(
      (sum, event) => sum + score(event.expectedImpact) * event.catalystScore,
      0,
    );
    const totalWeight = events.reduce((sum, event) => sum + event.catalystScore, 0);
    if (totalWeight === 0) return 'neutral';

    const average = weighted / totalWeight;
    if (average >= 4.2) return 'very_bullish';
    if (average >= 3) return 'bullish';
    if (average <= 0.8) return 'very_bearish';
    if (average <= 2) return 'bearish';
    return 'neutral';
  }
}
