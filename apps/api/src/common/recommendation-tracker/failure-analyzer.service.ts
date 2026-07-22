import { Injectable } from '@nestjs/common';
import {
  RecommendationRecord,
  FailureAnalysis,
  FailureDetail,
  FailureType,
  FailureSeverity,
} from './types';
import {
  FAILURE_TYPE_TURKISH,
  FAILURE_SEVERITY_TURKISH,
} from './turkish-terms';

@Injectable()
export class FailureAnalyzerService {
  analyzeFailures(recommendations: RecommendationRecord[]): FailureAnalysis[] {
    return recommendations.map(rec => this.analyzeSingleRecommendation(rec));
  }

  detectLateSignals(recommendations: RecommendationRecord[]): FailureDetail[] {
    const failures: FailureDetail[] = [];
    for (const rec of recommendations) {
      if (rec.holdingPeriodDays !== undefined && rec.holdingPeriodDays > 30) {
        failures.push({
          type: FailureType.LATE_SIGNAL,
          severity: rec.holdingPeriodDays > 60 ? FailureSeverity.HIGH : FailureSeverity.MEDIUM,
          description: `${rec.stockSymbol}: Signal delayed, holding period ${rec.holdingPeriodDays} days`,
          descriptionTr: `${rec.stockSymbol}: Sinyal gecikmeli, pozisyon suresi ${rec.holdingPeriodDays} gun`,
          impact: Math.min(rec.holdingPeriodDays / 100, 1),
          indicators: ['holdingPeriod'],
        });
      }
    }
    return failures;
  }

  detectFalsePositives(recommendations: RecommendationRecord[]): FailureDetail[] {
    const failures: FailureDetail[] = [];
    for (const rec of recommendations) {
      if (rec.actualReturn !== undefined && rec.actualReturn < -5 && rec.entryEliteScore >= 60) {
        failures.push({
          type: FailureType.FALSE_POSITIVE,
          severity: rec.actualReturn < -15 ? FailureSeverity.CRITICAL : FailureSeverity.HIGH,
          description: `${rec.stockSymbol}: False positive signal, return ${rec.actualReturn.toFixed(2)}% despite score ${rec.entryEliteScore}`,
          descriptionTr: `${rec.stockSymbol}: Yanlis pozitif sinyal, skor ${rec.entryEliteScore} olmasina ragmen getiri %${rec.actualReturn.toFixed(2)}`,
          impact: Math.abs(rec.actualReturn) / 100,
          indicators: ['eliteScore', 'actualReturn'],
        });
      }
    }
    return failures;
  }

  detectFalseNegatives(recommendations: RecommendationRecord[]): FailureDetail[] {
    const failures: FailureDetail[] = [];
    for (const rec of recommendations) {
      if (rec.actualReturn !== undefined && rec.actualReturn > 10 && rec.entryEliteScore < 40) {
        failures.push({
          type: FailureType.FALSE_NEGATIVE,
          severity: rec.actualReturn > 20 ? FailureSeverity.HIGH : FailureSeverity.MEDIUM,
          description: `${rec.stockSymbol}: False negative signal, missed ${rec.actualReturn.toFixed(2)}% gain with score ${rec.entryEliteScore}`,
          descriptionTr: `${rec.stockSymbol}: Yanlis negatif sinyal, skor ${rec.entryEliteScore} ile %${rec.actualReturn.toFixed(2)} getiri kacirildi`,
          impact: Math.min(rec.actualReturn / 100, 1),
          indicators: ['eliteScore', 'actualReturn'],
        });
      }
    }
    return failures;
  }

  detectWeakConfirmations(recommendations: RecommendationRecord[]): FailureDetail[] {
    const failures: FailureDetail[] = [];
    for (const rec of recommendations) {
      if (rec.entryConsensusScore < 40 && rec.entryConfidence < 0.5) {
        failures.push({
          type: FailureType.WEAK_CONFIRMATION,
          severity: rec.entryConsensusScore < 25 ? FailureSeverity.HIGH : FailureSeverity.MEDIUM,
          description: `${rec.stockSymbol}: Weak confirmation, consensus ${rec.entryConsensusScore}, confidence ${rec.entryConfidence}`,
          descriptionTr: `${rec.stockSymbol}: Zayif dogrulama, konsensüs ${rec.entryConsensusScore}, guven ${rec.entryConfidence}`,
          impact: (1 - rec.entryConsensusScore / 100) * 0.5,
          indicators: ['consensusScore', 'confidence'],
        });
      }
    }
    return failures;
  }

  detectHighRiskSignals(recommendations: RecommendationRecord[]): FailureDetail[] {
    const failures: FailureDetail[] = [];
    for (const rec of recommendations) {
      if (rec.marketRegime === 'HIGH_VOLATILITY' || rec.marketRegime === 'BEAR') {
        const riskScore = rec.marketRegime === 'HIGH_VOLATILITY' ? 0.7 : 0.5;
        failures.push({
          type: FailureType.HIGH_RISK_SIGNAL,
          severity: riskScore > 0.6 ? FailureSeverity.HIGH : FailureSeverity.MEDIUM,
          description: `${rec.stockSymbol}: High risk signal in ${rec.marketRegime} market`,
          descriptionTr: `${rec.stockSymbol}: ${rec.marketRegime === 'HIGH_VOLATILITY' ? 'Yuksek volatilite' : 'Dusus piyasasi'} kosullarinda yuksek risk sinyali`,
          impact: riskScore,
          indicators: ['marketRegime'],
        });
      }
    }
    return failures;
  }

  detectPoorTiming(recommendations: RecommendationRecord[]): FailureDetail[] {
    const failures: FailureDetail[] = [];
    for (const rec of recommendations) {
      if (rec.actualReturn !== undefined && rec.maxDrawdown !== undefined) {
        const returnToDrawdownRatio = rec.maxDrawdown > 0 ? Math.abs(rec.actualReturn) / rec.maxDrawdown : 1;
        if (returnToDrawdownRatio < 0.5 && rec.actualReturn < 0) {
          failures.push({
            type: FailureType.POOR_TIMING,
            severity: returnToDrawdownRatio < 0.25 ? FailureSeverity.CRITICAL : FailureSeverity.HIGH,
            description: `${rec.stockSymbol}: Poor timing, return/Drawdown ratio ${returnToDrawdownRatio.toFixed(2)}`,
            descriptionTr: `${rec.stockSymbol}: Zamanlama hatasi, getiri/Drawdown orani ${returnToDrawdownRatio.toFixed(2)}`,
            impact: 1 - returnToDrawdownRatio,
            indicators: ['return', 'drawdown', 'timing'],
          });
        }
      }
    }
    return failures;
  }

  calculateFailureSeverity(failure: FailureDetail): FailureSeverity {
    if (failure.impact >= 0.8) return FailureSeverity.CRITICAL;
    if (failure.impact >= 0.5) return FailureSeverity.HIGH;
    if (failure.impact >= 0.25) return FailureSeverity.MEDIUM;
    return FailureSeverity.LOW;
  }

  private analyzeSingleRecommendation(rec: RecommendationRecord): FailureAnalysis {
    const failures: FailureDetail[] = [];

    failures.push(...this.detectLateSignals([rec]));
    failures.push(...this.detectFalsePositives([rec]));
    failures.push(...this.detectFalseNegatives([rec]));
    failures.push(...this.detectWeakConfirmations([rec]));
    failures.push(...this.detectHighRiskSignals([rec]));
    failures.push(...this.detectPoorTiming([rec]));

    const overallRiskScore = failures.length > 0
      ? failures.reduce((s, f) => s + f.impact, 0) / failures.length
      : 0;

    return {
      recommendationId: rec.id,
      stockSymbol: rec.stockSymbol,
      failures,
      overallRiskScore,
      analyzedAt: new Date().toISOString(),
    };
  }
}
