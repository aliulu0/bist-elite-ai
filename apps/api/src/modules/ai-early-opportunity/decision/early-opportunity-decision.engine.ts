import { createHash } from 'crypto';
import { EarlyOpportunityIntelligenceResult, EARLY_OPPORTUNITY_TIMEFRAMES } from '../early-opportunity.types';
import { clamp0100 } from '../early-opportunity.utils';
import {
  DecisionDimension,
  DecisionDimensionId,
  DecisionGate,
  DecisionRiskSummary,
  DecisionSignalSummary,
  EarlyOpportunityDecision,
  EarlyOpportunityDecisionSnapshot,
  EarlyOpportunityDecisionStatus,
  OpportunityType,
  DECISION_DIMENSION_IDS,
  DECISION_DIMENSION_LABELS,
  DECISION_DIMENSION_WEIGHTS,
  DECISION_STATUS_META,
} from './early-opportunity-decision.types';

const MIN_COVERAGE = 0.5;
const DOWNGRADE_CAP: EarlyOpportunityDecisionStatus = 'WATCHLIST_OPPORTUNITY';

const TREND_STAGE_SCORES: Record<string, number> = {
  Early: 100,
  Growing: 80,
  Breakout: 50,
  Extended: 20,
  Late: 5,
};

const POSITIVE_PHRASES: Record<DecisionDimensionId, string> = {
  earlyStage: 'Trend erken aşamada.',
  multiTimeframe: 'Multi-timeframe uyumu yüksek.',
  prediction: 'Tahmin güveni ve yönü olumlu.',
  smartMoney: 'Smart Money birikimi görülüyor.',
  catalyst: 'Pozitif katalizör mevcut.',
  fundamentals: 'Temel göstergeler uygun.',
  signals: 'Erken sinyal yakınsaması güçlü.',
  verification: 'Bağımsız doğrulama onaylıyor.',
  dataQuality: 'Veri kalitesi kabul edilebilir.',
  risk: 'Risk/getiri çerçevesi uygun.',
};

const NEGATIVE_PHRASES: Record<DecisionDimensionId, string> = {
  earlyStage: 'Trend uzamış/geç aşamada.',
  multiTimeframe: 'Multi-timeframe uyumu zayıf.',
  prediction: 'Tahmin güveni düşük.',
  smartMoney: 'Smart Money dağılımı izleniyor.',
  catalyst: 'Negatif katalizör baskısı.',
  fundamentals: 'Temel göstergeler zayıf.',
  signals: 'Sinyal yakınsaması zayıf.',
  verification: 'Doğrulama çelişkili veya yok.',
  dataQuality: 'Veri kalitesi zayıf.',
  risk: 'Risk/getiri çerçevesi yetersiz.',
};

interface DimensionCalc {
  score: number;
  present: boolean;
  note: string;
}

/**
 * R2-045 — Early Opportunity Decision Engine.
 *
 * Pure, deterministic, synchronous. Consumes an already-built
 * EarlyOpportunityIntelligenceResult (all engines reused; no provider calls,
 * no indicator math, no randomness). Same input → same output.
 */
export class EarlyOpportunityDecisionEngine {
  decide(input: EarlyOpportunityIntelligenceResult): EarlyOpportunityDecision {
    const dimensions = this.computeDimensions(input);
    const coverage = dimensions.reduce((sum, d) => sum + (d.present ? d.weight : 0), 0);
    const present = dimensions.filter((d) => d.present);
    const convergence = present.length > 0 ? this.presentMean(present) : 0;
    const decisionScore = coverage === 0 ? 0 : this.adjustForCoverage(convergence, coverage);

    const gates: { invalidated: DecisionGate[]; downgraded: DecisionGate[] } = this.evaluateGates(input);
    if (coverage === 0) {
      gates.invalidated.push({ id: 'NO_EVIDENCE', severity: 'invalidate', reason: 'Karar için bağımsız kanıt bulunamadı.' });
    } else if (coverage < MIN_COVERAGE) {
      gates.downgraded.push({
        id: 'INSUFFICIENT_EVIDENCE',
        severity: 'downgrade',
        reason: 'Bağımsız kanıt kapsamı yetersiz; karar zayıflatıldı.',
      });
    }

    const earlyStageDim = dimensions.find((d) => d.id === 'earlyStage');
    const earlyStageScore = earlyStageDim?.present ? earlyStageDim.score : 30;
    const baseStatus = this.classify(decisionScore, earlyStageScore);
    const finalStatus = this.applyGates(baseStatus, gates);
    const earlyOpportunity =
      finalStatus === 'STRONG_EARLY_OPPORTUNITY' || finalStatus === 'EARLY_OPPORTUNITY';

    const dqScore = input.financialDataQuality?.qualityScore;
    const confidence =
      dqScore == null ? decisionScore : Math.round(0.6 * decisionScore + 0.4 * dqScore);

    const snapshot = this.buildSnapshot(
      input,
      decisionScore,
      finalStatus,
      earlyOpportunity,
      confidence,
      dimensions,
    );

    const decision: EarlyOpportunityDecision = {
      ticker: input.ticker,
      company: input.company,
      decisionScore,
      decisionStatus: finalStatus,
      statusLabel: DECISION_STATUS_META[finalStatus].label,
      statusEmoji: DECISION_STATUS_META[finalStatus].emoji,
      opportunityType: this.toOpportunityType(finalStatus),
      earlyOpportunity,
      confidence,
      convergence,
      coverage: Math.round(coverage * 100),
      trendStage: input.multiTimeframe?.trendStage ?? null,
      timeframeAgreement: Math.round(
        input.timeframeAgreement ?? input.multiTimeframe?.alignments?.timeframeAgreement ?? 0,
      ),
      predictionConfidence: Math.round(input.confidence),
      smartMoneyStatus: this.smartMoneyStatus(input.smartMoney),
      catalystStatus: this.catalystStatus(input.catalyst),
      fundamentalStatus: input.fundamentals?.overallStatus ?? 'UNKNOWN',
      financialDataQualityStatus: input.financialDataQuality?.status ?? 'UNKNOWN',
      signalSummary: this.signalSummary(input),
      verificationStatus: input.verificationStatus ?? 'unknown',
      riskSummary: this.riskSummary(input),
      entryZone: input.entryZone ?? null,
      stop: input.stop ?? null,
      target1: input.target1 ?? null,
      target2: input.target2 ?? null,
      expectedReturn: input.expectedReturn ?? 0,
      bestTimeframe: input.multiTimeframe?.bestTimeframe ?? null,
      worstTimeframe: input.multiTimeframe?.worstTimeframe ?? null,
      reasons: [],
      positiveFactors: this.factorList(dimensions, POSITIVE_PHRASES, 60),
      negativeFactors: this.factorList(dimensions, NEGATIVE_PHRASES, 40),
      warnings: [
        ...gates.invalidated.map((g) => g.reason),
        ...gates.downgraded.map((g) => g.reason),
      ],
      dataFreshness: input.financialDataQuality?.freshness?.overall ?? 'unknown',
      providerStatus: input.financialDataQuality?.providerConsistencyStatus ?? 'unknown',
      dimensions,
      gates,
      snapshot,
      explanation: '',
      generatedAt: input.evaluatedAt,
    };
    decision.reasons = this.buildReasons(decision);
    decision.explanation = this.buildExplanation(decision);
    return decision;
  }

  // ------------------------------------------------------------------ dimensions

  private computeDimensions(input: EarlyOpportunityIntelligenceResult): DecisionDimension[] {
    const calcs: Record<DecisionDimensionId, DimensionCalc> = {
      earlyStage: this.dimensionEarlyStage(input),
      multiTimeframe: this.dimensionMultiTimeframe(input),
      prediction: this.dimensionPrediction(input),
      smartMoney: this.dimensionSmartMoney(input),
      catalyst: this.dimensionCatalyst(input),
      fundamentals: this.dimensionFundamentals(input),
      signals: this.dimensionSignals(input),
      verification: this.dimensionVerification(input),
      dataQuality: this.dimensionDataQuality(input),
      risk: this.dimensionRisk(input),
    };
    return DECISION_DIMENSION_IDS.map((id) => {
      const calc = calcs[id];
      return {
        id,
        label: DECISION_DIMENSION_LABELS[id],
        weight: DECISION_DIMENSION_WEIGHTS[id],
        score: clamp0100(calc.score),
        present: calc.present,
        note: calc.note,
      };
    });
  }

  private dimensionEarlyStage(input: EarlyOpportunityIntelligenceResult): DimensionCalc {
    const stage = input.multiTimeframe?.trendStage;
    if (stage && TREND_STAGE_SCORES[stage] != null) {
      return {
        score: TREND_STAGE_SCORES[stage],
        present: true,
        note: `Trend aşaması: ${stage}.`,
      };
    }
    return { score: 30, present: false, note: 'Trend aşaması belirlenemedi.' };
  }

  private dimensionMultiTimeframe(input: EarlyOpportunityIntelligenceResult): DimensionCalc {
    const mtf = input.multiTimeframe;
    if (mtf) {
      const agreement = mtf.alignments?.timeframeAgreement ?? 0;
      const trendAlign = mtf.alignments?.trendAlignment ?? 0;
      const momentumAlign = mtf.alignments?.momentumAlignment ?? 0;
      const score = Math.round(
        0.4 * mtf.multiTimeframeScore + 0.3 * agreement + 0.2 * trendAlign + 0.1 * momentumAlign,
      );
      return {
        score,
        present: true,
        note: `MTF skor ${mtf.multiTimeframeScore}, uyum %${Math.round(agreement)}.`,
      };
    }
    if (input.timeframeAgreement > 0) {
      return {
        score: input.timeframeAgreement,
        present: true,
        note: 'Zaman dilimi uyumu (tahmin bazlı).',
      };
    }
    return { score: 0, present: false, note: 'Multi-timeframe analizi yok.' };
  }

  private dimensionPrediction(input: EarlyOpportunityIntelligenceResult): DimensionCalc {
    const hasPrimary =
      input.confidence > 0 || input.bullishPercent > 0 || input.earlyOpportunityScore > 0;
    if (!hasPrimary) return { score: 0, present: false, note: 'Tahmin verisi yok.' };
    const er = clamp0100(((input.expectedReturn ?? 0) + 10) / 40 * 100);
    const score = Math.round(0.4 * input.confidence + 0.3 * input.bullishPercent + 0.3 * er);
    return {
      score,
      present: true,
      note: `Güven %${Math.round(input.confidence)}, yaşıl %${Math.round(input.bullishPercent)}, beklenen getiri %${(input.expectedReturn ?? 0).toFixed(1)}.`,
    };
  }

  private dimensionSmartMoney(input: EarlyOpportunityIntelligenceResult): DimensionCalc {
    const sm = input.smartMoney;
    if (!sm || sm.score == null) return { score: 0, present: false, note: 'Smart Money verisi yok.' };
    const note =
      sm.accumulation === 'very_strong'
        ? 'Güçlü birikim.'
        : sm.accumulation === 'moderate'
          ? 'Orta düzey birikim.'
          : 'Zayıf birikim/dağılım.';
    return { score: sm.score, present: true, note: `Smart Money skor ${sm.score} — ${note}` };
  }

  private dimensionCatalyst(input: EarlyOpportunityIntelligenceResult): DimensionCalc {
    const c = input.catalyst;
    if (!c) return { score: 0, present: false, note: 'Katalizör verisi yok.' };
    const boosted = c.verified ? c.score + 5 : c.score;
    return {
      score: boosted,
      present: true,
      note: `Katalizör skor ${c.score}${c.verified ? ' (doğrulandı)' : ''}.`,
    };
  }

  private dimensionFundamentals(input: EarlyOpportunityIntelligenceResult): DimensionCalc {
    const f = input.fundamentals;
    if (!f) return { score: 0, present: false, note: 'Temel veri yok.' };
    const penalty =
      f.overallStatus === 'WATCH' ? -8 : f.overallStatus === 'FAIL' ? -20 : f.overallStatus === 'UNKNOWN' ? -5 : 0;
    return {
      score: f.score + penalty,
      present: true,
      note: `Temel skor ${f.score} (${f.overallStatus}).`,
    };
  }

  private dimensionSignals(input: EarlyOpportunityIntelligenceResult): DimensionCalc {
    const total = input.signals?.length ?? 0;
    if ((input.signalConvergenceScore ?? 0) <= 0 && total === 0) {
      return { score: 0, present: false, note: 'Sinyal verisi yok.' };
    }
    const categories = new Set((input.signals ?? []).map((s) => s.category)).size;
    const bonus = Math.min(10, (input.earlySignalCount ?? 0) * 2);
    const score = (input.signalConvergenceScore ?? 0) + bonus;
    return {
      score,
      present: true,
      note: `Yakınsama ${input.signalConvergenceScore ?? 0}, ${total} sinyal (${input.earlySignalCount ?? 0} erken), ${categories} kategori.`,
    };
  }

  private dimensionVerification(input: EarlyOpportunityIntelligenceResult): DimensionCalc {
    const consensus = input.researchConsensus;
    const vBase =
      input.verificationStatus === 'verified' ? 70 : input.verificationStatus === 'unverified' ? 40 : 0;
    if (vBase === 0 && !consensus) return { score: 0, present: false, note: 'Doğrulama verisi yok.' };
    const consensusScore = consensus?.consensusScore ?? vBase;
    return {
      score: Math.round(0.5 * vBase + 0.5 * consensusScore),
      present: true,
      note: `Durum: ${input.verificationStatus}, araştırma skoru ${Math.round(consensusScore)}.`,
    };
  }

  private dimensionDataQuality(input: EarlyOpportunityIntelligenceResult): DimensionCalc {
    const dq = input.financialDataQuality;
    if (!dq) return { score: 0, present: false, note: 'Veri kalitesi değerlendirilmedi.' };
    return {
      score: dq.qualityScore,
      present: true,
      note: `Kalite ${dq.qualityScore} (${dq.status}).`,
    };
  }

  private dimensionRisk(input: EarlyOpportunityIntelligenceResult): DimensionCalc {
    const hasPrimary = input.confidence > 0 || input.bullishPercent > 0;
    if (!hasPrimary) return { score: 0, present: false, note: 'Risk çerçevesi yok.' };
    const base = input.risk === 'low' ? 75 : input.risk === 'medium' ? 50 : input.risk === 'high' ? 25 : 40;
    const rrr = input.riskRewardRatio;
    const rrrScore = rrr == null ? 40 : rrr >= 3 ? 100 : rrr >= 2 ? 80 : rrr >= 1 ? 60 : 30;
    const hasEntry = input.entryZone != null;
    const hasStop = input.stop != null;
    const hasTarget = input.target1 != null;
    const framework =
      hasEntry && hasStop && hasTarget ? 100 : hasEntry && (hasStop || hasTarget) ? 75 : hasEntry || hasStop || hasTarget ? 50 : 20;
    return {
      score: Math.round(0.4 * base + 0.3 * rrrScore + 0.3 * framework),
      present: true,
      note: `Risk ${input.risk}, R/R ${rrr ?? 'yok'}, giriş/stop/hedef: ${hasEntry}/${hasStop}/${hasTarget}.`,
    };
  }

  // ------------------------------------------------------------------ gates

  private evaluateGates(input: EarlyOpportunityIntelligenceResult): {
    invalidated: DecisionGate[];
    downgraded: DecisionGate[];
  } {
    const invalidated: DecisionGate[] = [];
    const downgraded: DecisionGate[] = [];
    const dq = input.financialDataQuality;
    const hasPrimary =
      input.confidence > 0 || input.bullishPercent > 0 || input.earlyOpportunityScore > 0;

    if (!hasPrimary) {
      invalidated.push({ id: 'NO_MARKET_DATA', severity: 'invalidate', reason: 'Yeterli piyasa/tahmin verisi yok.' });
    }
    if (dq?.status === 'DATA_INSUFFICIENT') {
      invalidated.push({ id: 'DATA_INSUFFICIENT', severity: 'invalidate', reason: 'Veri yetersiz — karar üretilemiyor.' });
    }
    if (dq?.marketIntegrity?.valid === false) {
      invalidated.push({ id: 'INVALID_HISTORICAL_DATA', severity: 'invalidate', reason: 'Geçmiş veri bütünlüğü bozuk.' });
    }
    if (dq?.marketDataScore != null && dq.marketDataScore < 50) {
      invalidated.push({ id: 'MISSING_MARKET_DATA', severity: 'invalidate', reason: 'Temel piyasa verisi eksik.' });
    }

    if (dq?.providerConsistencyStatus === 'conflicting') {
      downgraded.push({ id: 'PROVIDER_CONFLICT', severity: 'downgrade', reason: 'Sağlayıcılar arasında ciddi çelişki.' });
    }
    if (dq?.status === 'DATA_WARNING' && dq.qualityScore < 60) {
      downgraded.push({ id: 'DATA_WARNING_SEVERE', severity: 'downgrade', reason: 'Veri kalitesi uyarısı ciddi düzeyde.' });
    }
    if (dq?.freshness?.overall === 'stale') {
      downgraded.push({ id: 'STALE_DATA', severity: 'downgrade', reason: 'Veri bayat — güncellenmiş veri beklenmeli.' });
    }
    if (input.fundamentals?.overallStatus === 'FAIL') {
      downgraded.push({ id: 'FUNDAMENTAL_INVALID', severity: 'downgrade', reason: 'Temel doğrulama başarısız.' });
    }
    if (input.risk === 'high' && (input.stop == null || input.target1 == null)) {
      downgraded.push({ id: 'EXTREME_RISK', severity: 'downgrade', reason: 'Yüksek risk ve eksik stop/hedef.' });
    }
    if (hasPrimary && input.entryZone == null && input.stop == null) {
      downgraded.push({ id: 'NO_ENTRY_FRAMEWORK', severity: 'downgrade', reason: 'Geçerli giriş/stop çerçevesi yok.' });
    }

    return { invalidated, downgraded };
  }

  // ------------------------------------------------------------------ classification

  private classify(score: number, earlyStage: number): EarlyOpportunityDecisionStatus {
    if (score >= 75) {
      if (earlyStage >= 70) return 'STRONG_EARLY_OPPORTUNITY';
      if (earlyStage >= 40) return 'CONFIRMED_OPPORTUNITY';
      return 'EXTENDED_OPPORTUNITY';
    }
    if (score >= 60) {
      if (earlyStage >= 55) return 'EARLY_OPPORTUNITY';
      if (earlyStage >= 40) return 'CONFIRMED_OPPORTUNITY';
      return 'EXTENDED_OPPORTUNITY';
    }
    if (score >= 45) return 'WATCHLIST_OPPORTUNITY';
    return 'WEAK_OPPORTUNITY';
  }

  private applyGates(
    baseStatus: EarlyOpportunityDecisionStatus,
    gates: { invalidated: DecisionGate[]; downgraded: DecisionGate[] },
  ): EarlyOpportunityDecisionStatus {
    if (gates.invalidated.length > 0) return 'INVALID_OPPORTUNITY';
    if (gates.downgraded.length === 0) return baseStatus;
    const capStrength = DECISION_STATUS_META[DOWNGRADE_CAP].strength;
    const baseStrength = DECISION_STATUS_META[baseStatus].strength;
    return baseStrength > capStrength ? DOWNGRADE_CAP : baseStatus;
  }

  private toOpportunityType(status: EarlyOpportunityDecisionStatus): OpportunityType {
    switch (status) {
      case 'STRONG_EARLY_OPPORTUNITY':
      case 'EARLY_OPPORTUNITY':
        return 'EARLY';
      case 'CONFIRMED_OPPORTUNITY':
        return 'CONFIRMED';
      case 'EXTENDED_OPPORTUNITY':
        return 'EXTENDED';
      case 'WATCHLIST_OPPORTUNITY':
        return 'WATCH';
      case 'WEAK_OPPORTUNITY':
        return 'WEAK';
      case 'INVALID_OPPORTUNITY':
        return 'INVALID';
    }
  }

  // ------------------------------------------------------------------ helpers

  private presentMean(dimensions: DecisionDimension[]): number {
    let numerator = 0;
    let denominator = 0;
    for (const d of dimensions) {
      numerator += d.score * d.weight;
      denominator += d.weight;
    }
    if (denominator === 0) return 0;
    return Math.round(numerator / denominator);
  }

  private adjustForCoverage(convergence: number, coverage: number): number {
    const factor = 0.5 + 0.5 * Math.min(1, coverage / 0.7);
    return Math.round(convergence * factor);
  }

  private factorList(
    dimensions: DecisionDimension[],
    phrases: Record<DecisionDimensionId, string>,
    threshold: number,
  ): string[] {
    const out: string[] = [];
    for (const d of dimensions) {
      if (d.present && d.score >= threshold) out.push(phrases[d.id]);
    }
    return out;
  }

  private smartMoneyStatus(sm: EarlyOpportunityIntelligenceResult['smartMoney']): string {
    if (!sm || sm.score == null) return 'unknown';
    if (sm.score >= 70) return 'very_strong';
    if (sm.score >= 40) return 'moderate';
    return 'weak';
  }

  private catalystStatus(c: EarlyOpportunityIntelligenceResult['catalyst']): string {
    if (!c) return 'unknown';
    if (c.score >= 60) return 'strong';
    if (c.score >= 30) return 'moderate';
    return 'negative';
  }

  private signalSummary(input: EarlyOpportunityIntelligenceResult): DecisionSignalSummary {
    const signals = input.signals ?? [];
    const categories = new Set(signals.map((s) => s.category)).size;
    return {
      convergenceScore: input.signalConvergenceScore ?? 0,
      totalSignals: signals.length,
      strongSignalCount: input.topSignals?.length ?? 0,
      earlyCount: input.earlySignalCount ?? 0,
      confirmedCount: input.confirmedSignalCount ?? 0,
      categoryCoverage: categories,
    };
  }

  private riskSummary(input: EarlyOpportunityIntelligenceResult): DecisionRiskSummary {
    return {
      level: input.risk ?? 'unknown',
      riskRewardRatio: input.riskRewardRatio ?? null,
      hasEntry: input.entryZone != null,
      hasStop: input.stop != null,
      hasTarget: input.target1 != null,
    };
  }

  // ------------------------------------------------------------------ explanation (deterministic Turkish)

  private buildReasons(decision: EarlyOpportunityDecision): string[] {
    const parts: string[] = [];
    parts.push(
      `${decision.ticker} (${decision.company}) karar skoru ${decision.decisionScore}/100 — ${decision.statusLabel}.`,
    );
    parts.push(`Yakınsama ${decision.convergence}/100, kanıt kapsamı %${decision.coverage}.`);
    parts.push(...decision.positiveFactors.slice(0, 3));
    if (decision.negativeFactors.length > 0) {
      parts.push(...decision.negativeFactors.slice(0, 2));
    }
    return parts;
  }

  private buildExplanation(decision: EarlyOpportunityDecision): string {
    const lines: string[] = [];
    lines.push(`${decision.ticker} (${decision.company}) için karar: ${decision.statusLabel}.`);
    lines.push(
      `Karar skoru ${decision.decisionScore}/100 (yakınsama ${decision.convergence}), güven %${decision.confidence}.`,
    );
    lines.push(
      `Trend aşaması: ${decision.trendStage ?? 'bilinmiyor'}; zaman dilimi uyumu %${decision.timeframeAgreement}.`,
    );
    for (const d of decision.dimensions) {
      if (d.present) lines.push(`• ${d.label}: ${d.score}/100 — ${d.note}`);
    }
    if (decision.warnings.length > 0) {
      lines.push('Uyarılar:');
      for (const w of decision.warnings) lines.push(`- ${w}`);
    }
    return lines.join('\n');
  }

  // ------------------------------------------------------------------ snapshot

  private buildSnapshot(
    input: EarlyOpportunityIntelligenceResult,
    decisionScore: number,
    decisionStatus: EarlyOpportunityDecisionStatus,
    earlyOpportunity: boolean,
    confidence: number,
    dimensions: DecisionDimension[],
  ): EarlyOpportunityDecisionSnapshot {
    const evidence = {} as Record<DecisionDimensionId, number>;
    for (const d of dimensions) evidence[d.id] = d.present ? d.score : 0;

    const digest = createHash('sha256')
      .update(this.canonicalInput(input))
      .digest('hex');

    return {
      decisionTimestamp: input.evaluatedAt,
      symbol: input.ticker,
      timeframeContext: (input.multiTimeframe?.timeframesAnalyzed ?? [...EARLY_OPPORTUNITY_TIMEFRAMES]) as string[],
      decisionScore,
      decisionStatus,
      earlyOpportunity,
      entry: input.entryZone ?? null,
      stop: input.stop ?? null,
      target1: input.target1 ?? null,
      target2: input.target2 ?? null,
      expectedReturn: input.expectedReturn ?? 0,
      confidence,
      evidence,
      inputDigest: digest,
    };
  }

  private canonicalInput(input: EarlyOpportunityIntelligenceResult): string {
    const m = input.multiTimeframe;
    const dq = input.financialDataQuality;
    return [
      input.earlyOpportunityScore,
      input.eliteScore,
      input.confidence,
      input.bullishPercent,
      input.expectedReturn ?? -999,
      input.risk ?? 'NA',
      input.timeframeAgreement ?? -1,
      input.smartMoney?.score ?? -1,
      input.smartMoney?.accumulation ?? 'NA',
      input.catalyst?.score ?? -1,
      input.catalyst?.verified ? 1 : 0,
      input.verificationStatus ?? 'NA',
      input.signalConvergenceScore ?? -1,
      input.earlySignalCount ?? -1,
      input.confirmedSignalCount ?? -1,
      input.signals?.length ?? -1,
      input.fundamentals?.score ?? -1,
      input.fundamentals?.overallStatus ?? 'NA',
      dq?.qualityScore ?? -1,
      dq?.status ?? 'NA',
      dq?.providerConsistencyStatus ?? 'NA',
      dq?.freshness?.overall ?? 'NA',
      dq?.marketDataScore ?? -1,
      dq?.marketIntegrity?.valid === false ? 0 : 1,
      m?.trendStage ?? 'NA',
      m?.multiTimeframeScore ?? -1,
      m?.alignments?.timeframeAgreement ?? -1,
      input.entryZone ? `${input.entryZone.min}:${input.entryZone.max}` : 'NA',
      input.stop ?? -1,
      input.target1 ?? -1,
      input.target2 ?? -1,
      input.riskRewardRatio ?? -1,
      input.evaluatedAt,
    ].join('|');
  }
}
