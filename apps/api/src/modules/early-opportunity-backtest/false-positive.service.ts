import { Injectable } from '@nestjs/common';
import {
  FutureOutcome, FalsePositiveResult, FalsePositiveSummary, FalsePositiveReason,
} from './early-opportunity-backtest.types';
import { EarlyOpportunityDecisionSnapshot } from '../ai-early-opportunity/decision/early-opportunity-decision.types';

@Injectable()
export class FalsePositiveService {
  analyze(
    outcomes: FutureOutcome[],
    snapshots: { ticker: string; decisionDate: string; snapshot: EarlyOpportunityDecisionSnapshot }[],
    minNegativeReturn: number = -5,
  ): FalsePositiveSummary {
    const falsePositives: FalsePositiveResult[] = [];

    for (const outcome of outcomes) {
      const primary = outcome.outcomes.find((o) => o.horizon === '3M') || outcome.outcomes.find((o) => o.dataAvailable);
      if (!primary || !primary.dataAvailable || primary.percentageReturn == null) continue;
      if (primary.percentageReturn >= minNegativeReturn) continue;

      const snap = snapshots.find(
        (s) => s.ticker === outcome.ticker && s.decisionDate === outcome.decisionDate,
      );
      if (!snap) continue;

      const reason = this.determineReason(snap.snapshot, outcome);
      const evidence = this.buildEvidence(snap.snapshot, outcome, reason);

      falsePositives.push({
        ticker: outcome.ticker,
        decisionDate: outcome.decisionDate,
        decisionScore: snap.snapshot.decisionScore,
        confidence: snap.snapshot.confidence,
        expectedReturn: snap.snapshot.expectedReturn,
        realizedReturn: primary.percentageReturn,
        likelyReason: reason,
        supportingEvidence: evidence,
      });
    }

    const reasonBreakdown: Record<FalsePositiveReason, number> = {
      weak_fundamentals: 0,
      weak_smart_money: 0,
      false_breakout: 0,
      catalyst_failure: 0,
      prediction_failure: 0,
      data_quality_issue: 0,
      market_wide_selloff: 0,
      sector_weakness: 0,
      excessive_risk: 0,
      low_signal_convergence: 0,
      yetersiz_kanit: 0,
    };

    for (const fp of falsePositives) {
      reasonBreakdown[fp.likelyReason] = (reasonBreakdown[fp.likelyReason] || 0) + 1;
    }

    return {
      totalFalsePositives: falsePositives.length,
      falsePositives,
      reasonBreakdown,
      sampleCount: falsePositives.length,
    };
  }

  private determineReason(
    snapshot: EarlyOpportunityDecisionSnapshot,
    outcome: FutureOutcome,
  ): FalsePositiveReason {
    const evidence = snapshot.evidence;
    const outcome3M = outcome.outcomes.find((o) => o.horizon === '3M');

    if (evidence.fundamentals < 40) return 'weak_fundamentals';
    if (evidence.smartMoney < 40) return 'weak_smart_money';
    if (evidence.catalyst < 40) return 'catalyst_failure';
    if (evidence.prediction < 40) return 'prediction_failure';
    if (evidence.dataQuality < 50) return 'data_quality_issue';
    if (evidence.signals < 40) return 'low_signal_convergence';
    if (evidence.risk < 40) return 'excessive_risk';
    if (outcome3M && outcome3M.maxAdverseExcursion < -20) return 'market_wide_selloff';

    return 'yetersiz_kanit';
  }

  private buildEvidence(
    snapshot: EarlyOpportunityDecisionSnapshot,
    outcome: FutureOutcome,
    reason: FalsePositiveReason,
  ): string[] {
    const evidence: string[] = [];
    const outcome3M = outcome.outcomes.find((o) => o.horizon === '3M');

    evidence.push(`Karar skoru: ${snapshot.decisionScore}/100, Güven: %${snapshot.confidence}`);
    evidence.push(`Beklenen getiri: %${snapshot.expectedReturn}, Gerçekleşen: %${(outcome3M?.percentageReturn ?? 0).toFixed(2)}`);

    if (reason === 'weak_fundamentals') evidence.push('Temel göstergeler zayıf.');
    if (reason === 'weak_smart_money') evidence.push('Smart Money birikimi görülmüyor.');
    if (reason === 'catalyst_failure') evidence.push('Katalizör beklentisi gerçekleşmedi.');
    if (reason === 'prediction_failure') evidence.push('Tahmin yönü hatalı.');
    if (reason === 'data_quality_issue') evidence.push('Veri kalitesi düşüklüğü kararı etkilemiş olabilir.');
    if (reason === 'excessive_risk') evidence.push('Risk seviyesi yüksek.');
    if (reason === 'low_signal_convergence') evidence.push('Sinyal yakınsaması zayıf.');
    if (reason === 'market_wide_selloff') evidence.push(`Piyasa genelinde satış baskısı (maksimum düşüş: %${(outcome3M?.maxAdverseExcursion ?? 0).toFixed(2)}).`);
    if (reason === 'yetersiz_kanit') evidence.push('Yetersiz kanıt.');

    return evidence;
  }
}