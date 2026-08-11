import { Injectable } from '@nestjs/common';
import { FutureOutcome, HorizonOutcome, DecisionSuccessResult, DecisionSuccessEval, SuccessDimension } from './early-opportunity-backtest.types';

@Injectable()
export class DecisionSuccessService {
  evaluate(
    outcome: FutureOutcome,
    riskScore: number,
    entryZone: { min: number; max: number } | null,
    stop: number | null,
    target1: number | null,
  ): DecisionSuccessResult {
    const evaluations: DecisionSuccessEval[] = [];
    let overallSuccess = true;
    let stopHitFirst = false;
    let targetHitFirst = false;

    const hasData = outcome.dataAvailable && outcome.outcomes.some((o) => o.dataAvailable);

    if (!hasData) {
      evaluations.push({
        dimension: 'RETURN',
        satisfied: false,
        details: 'Gelecek verisi yetersiz — değerlendirme yapılamadı.',
      });
      return { ticker: outcome.ticker, decisionDate: outcome.decisionDate, overallSuccess: false, evaluations, stopHitFirst: false, targetHitFirst: false };
    }

    const primaryHorizon = outcome.outcomes.find((o) => o.horizon === '3M') || outcome.outcomes.find((o) => o.dataAvailable);
    if (!primaryHorizon || !primaryHorizon.dataAvailable || primaryHorizon.percentageReturn == null) {
      evaluations.push({
        dimension: 'RETURN',
        satisfied: false,
        details: 'Birincil ufukta veri yok.',
      });
      return { ticker: outcome.ticker, decisionDate: outcome.decisionDate, overallSuccess: false, evaluations, stopHitFirst: false, targetHitFirst: false };
    }

    const returnVal = primaryHorizon.percentageReturn;
    const returnSuccess = returnVal > 0;
    evaluations.push({
      dimension: 'RETURN',
      satisfied: returnSuccess,
      details: returnSuccess
        ? `Karar tarihinden sonra %${returnVal.toFixed(2)} getiri sağladı.`
        : `Karar tarihinden sonra %${returnVal.toFixed(2)} kayıp oluştu.`,
    });

    const riskThreshold = riskScore > 0 ? 100 - riskScore : 50;
    const riskAdjusted = returnVal > riskThreshold;
    evaluations.push({
      dimension: 'RISK_ADJUSTED',
      satisfied: riskAdjusted,
      details: riskAdjusted
        ? `Getiri (%${returnVal.toFixed(2)}) risk eşiğinin (%${riskThreshold.toFixed(0)}) üzerinde.`
        : `Getiri (%${returnVal.toFixed(2)}) risk eşiğinin (%${riskThreshold.toFixed(0)}) altında.`,
    });

    if (entryZone && target1 != null) {
      const targetSuccess = primaryHorizon.targetReached;
      stopHitFirst = primaryHorizon.stopReached && (!primaryHorizon.targetReached || (primaryHorizon.timeToStop != null && primaryHorizon.timeToTarget != null && primaryHorizon.timeToStop < primaryHorizon.timeToTarget));
      targetHitFirst = primaryHorizon.targetReached && (!primaryHorizon.stopReached || (primaryHorizon.timeToTarget != null && primaryHorizon.timeToStop != null && primaryHorizon.timeToTarget < primaryHorizon.timeToStop));
      evaluations.push({
        dimension: 'TARGET',
        satisfied: targetSuccess,
        details: targetSuccess
          ? `Hedef fiyata ulaşıldı${primaryHorizon.timeToTarget != null ? ` (${primaryHorizon.timeToTarget} gün)` : ''}.`
          : `Hedef fiyata ulaşılamadı.`,
      });
    } else {
      evaluations.push({
        dimension: 'TARGET',
        satisfied: false,
        details: 'Hedef fiyat tanımlanmamış.',
      });
    }

    const maxDD = primaryHorizon.maxDrawdownAfterSignal;
    const earlyOpportunitySuccess = returnVal > 5 && maxDD < 15;
    evaluations.push({
      dimension: 'EARLY_OPPORTUNITY',
      satisfied: earlyOpportunitySuccess,
      details: earlyOpportunitySuccess
        ? `Getiri %${returnVal.toFixed(2)}, maksimum düşüş %${maxDD.toFixed(2)} — erken fırsat başarılı.`
        : `Getiri %${returnVal.toFixed(2)}, maksimum düşüş %${maxDD.toFixed(2)} — erken fırsat kriterlerini karşılamadı.`,
    });

    overallSuccess = evaluations.filter((e) => e.dimension !== 'TARGET').every((e) => e.satisfied);

    return {
      ticker: outcome.ticker,
      decisionDate: outcome.decisionDate,
      overallSuccess,
      evaluations,
      stopHitFirst,
      targetHitFirst,
    };
  }
}