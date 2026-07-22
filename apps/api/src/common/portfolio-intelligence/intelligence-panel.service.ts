import { Injectable } from '@nestjs/common';
import {
  IntelligencePanelWidget,
  OpportunitySummary,
} from './types';

@Injectable()
export class IntelligencePanelService {
  getIntelligencePanel(data: {
    opportunities: Array<{
      id: string;
      symbol: string;
      stage: string;
      eliteScore: number;
      confidence: number;
      consensusScore: number;
      healthScore: number;
      detectedAt: string;
      direction: string;
      trend: string;
      sector: string;
      strategy: string;
    }>;
    marketRegime: string;
    regimeConfidence: number;
    maxOpportunities?: number;
  }): IntelligencePanelWidget {
    const max = data.maxOpportunities ?? 20;
    const now = Date.now();

    const summaries: OpportunitySummary[] = data.opportunities.map(o => ({
      id: o.id,
      symbol: o.symbol,
      stage: o.stage,
      eliteScore: o.eliteScore,
      confidence: o.confidence,
      consensusScore: o.consensusScore,
      healthScore: o.healthScore,
      detectedAt: o.detectedAt,
      ageHours: (now - new Date(o.detectedAt).getTime()) / 3600000,
      direction: o.direction,
      trend: o.trend,
      sector: o.sector,
      strategy: o.strategy,
    }));

    const topOpportunities = [...summaries].sort((a, b) => b.eliteScore - a.eliteScore).slice(0, max);
    const highestEliteScores = [...summaries].sort((a, b) => b.eliteScore - a.eliteScore).slice(0, max);
    const highestConfidence = [...summaries].sort((a, b) => b.confidence - a.confidence).slice(0, max);
    const strongestConsensus = [...summaries].sort((a, b) => b.consensusScore - a.consensusScore).slice(0, max);
    const emergingOpportunities = summaries.filter(o => o.stage === 'DETECTED' || o.stage === 'EMERGING').slice(0, max);
    const weakeningOpportunities = summaries.filter(o => o.stage === 'WEAKENING').slice(0, max);

    return {
      topOpportunities,
      highestEliteScores,
      highestConfidence,
      strongestConsensus,
      emergingOpportunities,
      weakeningOpportunities,
      currentMarketRegime: data.marketRegime,
      marketRegimeConfidence: data.regimeConfidence,
      totalActiveOpportunities: data.opportunities.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  rankOpportunities(opportunities: OpportunitySummary[]): OpportunitySummary[] {
    return [...opportunities].sort((a, b) => {
      const scoreA = a.eliteScore * 0.4 + a.confidence * 100 * 0.3 + a.healthScore * 0.2 + (100 - a.ageHours) * 0.1;
      const scoreB = b.eliteScore * 0.4 + b.confidence * 100 * 0.3 + b.healthScore * 0.2 + (100 - b.ageHours) * 0.1;
      return scoreB - scoreA;
    });
  }

  detectEmergingOpportunities(opportunities: OpportunitySummary[]): OpportunitySummary[] {
    return opportunities.filter(o => o.stage === 'DETECTED' || o.stage === 'EMERGING');
  }

  detectWeakeningOpportunities(opportunities: OpportunitySummary[]): OpportunitySummary[] {
    return opportunities.filter(o => o.stage === 'WEAKENING' || o.stage === 'EXPIRED');
  }

  getOpportunityAgeDistribution(opportunities: OpportunitySummary[]): { fresh: number; developing: number; mature: number; old: number } {
    let fresh = 0, developing = 0, mature = 0, old = 0;
    for (const o of opportunities) {
      if (o.ageHours < 24) fresh++;
      else if (o.ageHours < 168) developing++;
      else if (o.ageHours < 720) mature++;
      else old++;
    }
    return { fresh, developing, mature, old };
  }
}
