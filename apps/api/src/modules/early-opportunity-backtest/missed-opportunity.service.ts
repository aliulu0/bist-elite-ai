import { Injectable } from '@nestjs/common';
import { MissedOpportunityResult, MissedOpportunitySummary } from './early-opportunity-backtest.types';

interface PotentialOpportunity {
  ticker: string;
  decisionDate: string;
  laterReturn: number;
  scoreAtTime: number;
  confidenceAtTime: number;
  filterFailures: string[];
  missingSignals: number;
  missingCatalyst: boolean;
  missingFundamentalData: boolean;
  dataQualityExclusion: boolean;
  insufficientHistory: boolean;
}

@Injectable()
export class MissedOpportunityService {
  identify(
    laterReturns: { ticker: string; decisionDate: string; laterReturn: number }[],
    decisions: { ticker: string; decisionDate: string; score: number; confidence: number }[],
    minReturnThreshold: number = 15,
  ): MissedOpportunitySummary {
    const missed: MissedOpportunityResult[] = [];

    for (const lr of laterReturns) {
      if (lr.laterReturn < minReturnThreshold) continue;

      const decision = decisions.find(
        (d) => d.ticker === lr.ticker && d.decisionDate === lr.decisionDate,
      );

      if (!decision || decision.score < 45) {
        const filterFailures: string[] = [];
        if (!decision) {
          filterFailures.push('Karar üretilmedi');
        } else {
          if (decision.score < 45) filterFailures.push('Düşük karar skoru');
          if (decision.confidence < 40) filterFailures.push('Düşük güven');
        }

        missed.push({
          ticker: lr.ticker,
          decisionDate: lr.decisionDate,
          laterReturn: lr.laterReturn,
          scoreAtTime: decision?.score ?? 0,
          confidenceAtTime: decision?.confidence ?? 0,
          filterFailures,
          missingSignals: decision ? 1 : 2,
          missingCatalyst: !decision,
          missingFundamentalData: !decision,
          dataQualityExclusion: decision?.score === 0,
          insufficientHistory: false,
        });
      }
    }

    return {
      totalMissed: missed.length,
      missedOpportunities: missed,
      sampleCount: missed.length,
    };
  }
}