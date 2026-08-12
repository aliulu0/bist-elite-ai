import {
  EarlyOpportunityLevel,
  EarlyOpportunitySymbolInput,
  EarlyOpportunityResult,
  EarlyScoreComponents,
  EarlyOpportunityIntelligenceResult,
  EarlyOpportunityFilters,
  RiskLevel,
  RISK_LEVEL_ORDER,
  ResearchConsensusSummary,
  CatalystSummary,
  SmartMoneySummary,
  VerificationStatus,
} from './early-opportunity.types';
import { FundamentalValidationReport, FundamentalFilterResult } from '../financial-rules/fundamental-validation.service';
import { MultiTimeframeOpportunityInput, MultiTimeframeOpportunityResult } from './multi-timeframe/multi-timeframe.types';
import { FinancialDataQualityReport } from '../financial-rules/financial-data-quality.types';
import { clamp0100 } from './early-opportunity.utils';

const SMART_MONEY_HIGH = 70;
const SMART_MONEY_MODERATE = 40;
const CATALYST_THRESHOLD = 60;

export class EarlyOpportunityIntelligenceEngine {
  buildIntelligenceResult(
    input: EarlyOpportunitySymbolInput,
    score: EarlyOpportunityResult,
    marketCap: number | null,
    multiTimeframe: MultiTimeframeOpportunityResult | null = null,
    fundamentals: FundamentalValidationReport | null = null,
    financialDataQuality: FinancialDataQualityReport | null = null,
  ): EarlyOpportunityIntelligenceResult {

    const primary =
      input.predictions.find((p) => p.timeframe === '1d' && p.isValid) ??
      input.predictions.find((p) => p.isValid) ??
      input.predictions[0];

    if (!primary) {
      return this.emptyIntelligence(input);
    }

    const catalystScore = primary.catalystScore ?? null;
    const verification = primary.verification;

return {
      ticker: input.ticker,
      company: input.company,
      sector: input.sector,
      marketCap,
      earlyOpportunityScore: score.score,
      earlyOpportunityLevel: score.level,
      eliteScore: clamp0100(score.components.eliteScore),
      confidence: clamp0100(primary.confidence),
      bullishPercent: clamp0100(primary.bullishProbability),
      risk: primary.risk,
      expectedReturn: primary.expectedReturn,
      entryZone: primary.entryZone,
      stop: primary.stopZone,
      target1: primary.target1,
      target2: primary.target2,
      riskRewardRatio: primary.riskRewardRatio,
      holdingPeriod: primary.expectedHoldingPeriod,
      catalyst: this.buildCatalyst(catalystScore, verification),
      smartMoney: this.buildSmartMoney(primary.smartMoneyScore),
      verificationStatus: this.toVerificationStatus(verification),
      researchConsensus: this.buildResearchConsensus(input.consensus),
      momentum: primary.momentum,
      trend: primary.trendDirection,
      liquidityQuality: primary.liquidityQuality,
       timeframeAgreement: clamp0100(score.components.timeframeAgreement),
       reasons: score.reasons,
       fundamentals,
       multiTimeframe,
       financialDataQuality,
       signals: [],
       signalConvergenceScore: 0,
       earlySignalCount: 0,
       confirmedSignalCount: 0,
       topSignals: [],
       decision: null,
       evaluatedAt: new Date().toISOString(),
    };
   }

  matchesFilters(result: EarlyOpportunityIntelligenceResult, filters: EarlyOpportunityFilters): boolean {
    if (filters.minEarlyOpportunityScore != null) {
      if (result.earlyOpportunityScore < filters.minEarlyOpportunityScore) return false;
    }
    if (filters.minConfidence != null) {
      if (result.confidence < filters.minConfidence) return false;
    }
    if (filters.minExpectedReturn != null) {
      if (result.expectedReturn < filters.minExpectedReturn) return false;
    }
    if (filters.maxRisk != null) {
      const maxIdx = RISK_LEVEL_ORDER.indexOf(filters.maxRisk);
      const resIdx = RISK_LEVEL_ORDER.indexOf(result.risk as RiskLevel);
      if (resIdx > maxIdx) return false;
    }
    if (filters.sector != null) {
      if (result.sector.toUpperCase() !== filters.sector.toUpperCase()) return false;
    }
    if (filters.marketCap != null) {
      if (result.marketCap == null) return false;
      if (filters.marketCap.min != null && result.marketCap < filters.marketCap.min) return false;
      if (filters.marketCap.max != null && result.marketCap > filters.marketCap.max) return false;
    }
    if (filters.liquidity != null) {
      const liquidityOrder = ['low', 'medium', 'high'] as const;
      const filterIdx = liquidityOrder.indexOf(filters.liquidity);
      const resIdx = (liquidityOrder as readonly string[]).indexOf(result.liquidityQuality);
      if (resIdx < filterIdx) return false;
    }
    if (filters.minSmartMoneyScore != null) {
      if ((result.smartMoney?.score ?? 0) < filters.minSmartMoneyScore) return false;
    }
    if (filters.minCatalystScore != null) {
      if ((result.catalyst?.score ?? 0) < filters.minCatalystScore) return false;
    }
    if (filters.minEliteScore != null) {
      if (result.eliteScore < filters.minEliteScore) return false;
    }
    if (filters.minFundamentalScore != null) {
      const fScore = result.fundamentals?.score ?? 0;
      if (fScore < filters.minFundamentalScore) return false;
    }
    if (filters.fundamentalStatus && filters.fundamentalStatus !== 'ANY') {
      const status = result.fundamentals?.overallStatus ?? 'UNKNOWN';
      if (status !== filters.fundamentalStatus) return false;
    }
    // Financial Data Quality filters
    if (filters.minFinancialDataQuality != null) {
      const qScore = result.financialDataQuality?.qualityScore ?? 0;
      if (qScore < filters.minFinancialDataQuality) return false;
    }
    if (filters.financialDataStatus && filters.financialDataStatus !== 'ANY') {
      const status = result.financialDataQuality?.status ?? 'DATA_INSUFFICIENT';
      if (status !== filters.financialDataStatus) return false;
    }
    if (filters.freshnessStatus && filters.freshnessStatus !== 'ANY') {
      const status = result.financialDataQuality?.freshness.overall ?? 'unknown';
      if (status !== filters.freshnessStatus) return false;
    }
    if (filters.providerConsistency && filters.providerConsistency !== 'ANY') {
      const status = result.financialDataQuality?.providerConsistencyStatus ?? 'conflicting';
      if (status !== filters.providerConsistency) return false;
    }
    if (filters.minSignalConvergence != null) {
      if (result.signalConvergenceScore < filters.minSignalConvergence) return false;
    }
    if (filters.minSignalStrength != null) {
      const maxStrength = result.signals.reduce((max, s) => Math.max(max, s.strength), 0);
      if (maxStrength < filters.minSignalStrength) return false;
    }
    if (filters.signalCategory != null) {
      if (!result.signals.some((s) => s.category === filters.signalCategory)) return false;
    }
    if (filters.signalType != null) {
      if (!result.signals.some((s) => s.type === filters.signalType)) return false;
    }
    if (filters.earlyOnly === true) {
      if (result.earlySignalCount < 1) return false;
    }
    if (filters.confirmedOnly === true) {
      if (result.confirmedSignalCount < 1) return false;
    }
    if (filters.minDecisionScore != null) {
      if (result.decision == null || result.decision.decisionScore < filters.minDecisionScore) return false;
    }
    if (filters.decisionStatus != null) {
      if (result.decision == null || result.decision.decisionStatus !== filters.decisionStatus) return false;
    }
    if (filters.earlyOpportunityOnly === true) {
      if (result.decision == null || result.decision.earlyOpportunity !== true) return false;
    }
    return true;
  }

  explain(result: EarlyOpportunityIntelligenceResult): string {
    const parts: string[] = [];
    parts.push(
      `${result.ticker} (${result.company}) erken fırsat skoru ${result.earlyOpportunityScore}/100 — ${result.earlyOpportunityLevel}.`,
    );
    parts.push(
      `Yaşıl olasılık %${result.bullishPercent.toFixed(0)}, güven %${result.confidence.toFixed(0)}, beklenen getiri %${result.expectedReturn.toFixed(1)}.`,
    );
    if (result.smartMoney && result.smartMoney.score >= SMART_MONEY_HIGH) {
      parts.push(`Akıllı para: ${result.smartMoney.accumulation} (${result.smartMoney.score}).`);
    }
    if (result.catalyst && result.catalyst.score >= CATALYST_THRESHOLD) {
      parts.push(`Katalizör skoru: ${result.catalyst.score}.`);
    }
    parts.push(
      `Zaman dilimleri anlaşı: %${result.timeframeAgreement.toFixed(0)}. ` +
        `Elite skor: ${result.eliteScore}, risk: ${result.risk}.`,
    );
    if (result.entryZone) {
      parts.push(
        `Giriş bölgesi: ${result.entryZone.min.toFixed(2)}-${result.entryZone.max.toFixed(2)}, stop: ${result.stop?.toFixed(2) ?? '–'}, hedef1: ${result.target1?.toFixed(2) ?? '–'}.`,
      );
    }
    if (result.verificationStatus === 'verified') {
      parts.push('Veriler kamuya açık kaynaklardan doğrulandı.');
    }
    if (result.fundamentals) {
      const label =
        result.fundamentals.overallStatus === 'PASS'
          ? 'uygun'
          : result.fundamentals.overallStatus === 'WATCH'
            ? 'izlemeye değer'
            : result.fundamentals.overallStatus === 'FAIL'
              ? 'zayıf'
              : 'veri eksik';
      parts.push(`Temel analiz skoru: ${result.fundamentals.score}/100 (${label}).`);
      for (const reason of result.fundamentals.reasons) {
        parts.push(`${reason}.`);
      }
    }
    parts.push(`Nedenler: ${result.reasons.join(', ')}.`);
    return parts.join(' ');
  }

  rankByAdjusted(
    results: EarlyOpportunityIntelligenceResult[],
    modifiers: Map<string, number>,
  ): EarlyOpportunityIntelligenceResult[] {
    return [...results].sort((a, b) => {
      const ma = modifiers.get(a.ticker) ?? 1;
      const mb = modifiers.get(b.ticker) ?? 1;
      return b.earlyOpportunityScore * mb - a.earlyOpportunityScore * ma;
    });
  }

  private buildCatalyst(
    catalystScore: number | null,
    verification: string | null,
  ): CatalystSummary | null {
    if (catalystScore == null && !verification) return null;
    return {
      score: clamp0100(catalystScore ?? 0),
      verified: verification === 'TRUE',
    };
  }

  private buildSmartMoney(score: number): SmartMoneySummary {
    return {
      score: clamp0100(score),
      accumulation:
        score >= SMART_MONEY_HIGH
          ? 'very_strong'
          : score >= SMART_MONEY_MODERATE
            ? 'moderate'
            : 'weak',
    };
  }

  private toVerificationStatus(verification: string | null): VerificationStatus {
    if (verification === 'TRUE') return 'verified';
    if (verification == null) return 'unknown';
    return 'unverified';
  }

  private buildResearchConsensus(consensus: EarlyOpportunitySymbolInput['consensus']): ResearchConsensusSummary | null {
    if (!consensus) return null;
    return {
      agreementLevel: clamp0100((consensus.agreementLevel ?? 0) * 100),
      confidence: clamp0100(consensus.confidence ?? 0),
      consensusScore: clamp0100(consensus.consensusScore ?? 0),
      summary: consensus.newsSummary ?? '',
      evidenceCount: consensus.totalEvidence ?? 0,
    };
  }

private emptyIntelligence(input: EarlyOpportunitySymbolInput): EarlyOpportunityIntelligenceResult {
    return {
      ticker: input.ticker,
      company: input.company,
      sector: input.sector,
      marketCap: null,
      earlyOpportunityScore: 0,
      earlyOpportunityLevel: 'BEKLE',
      eliteScore: 0,
      confidence: 0,
      bullishPercent: 0,
      risk: 'low',
      expectedReturn: 0,
      entryZone: null,
      stop: null,
      target1: null,
      target2: null,
      riskRewardRatio: null,
      holdingPeriod: null,
      catalyst: null,
      smartMoney: this.buildSmartMoney(0),
      verificationStatus: 'unknown',
       researchConsensus: input.consensus ? this.buildResearchConsensus(input.consensus) : null,
       momentum: 'neutral',
       trend: 'sideways',
       liquidityQuality: 'low',
        timeframeAgreement: 0,
        reasons: ['Yeterli çok-zamanlı veri yok'],
        fundamentals: null,
        multiTimeframe: null,
        financialDataQuality: null,
         signals: [],
         signalConvergenceScore: 0,
         earlySignalCount: 0,
         confirmedSignalCount: 0,
         topSignals: [],
         decision: null,
         evaluatedAt: new Date().toISOString(),
      };
  }
}
