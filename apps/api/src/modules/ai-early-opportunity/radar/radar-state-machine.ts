import { RadarMetrics, RadarState, RadarFactorChange } from './radar.types';

/**
 * R2-048 — Deterministic radar state machine + change detection.
 *
 * The radar references the existing EarlyOpportunityIntelligenceResult /
 * EarlyOpportunityDecision objects rather than recreating them. It adds only a
 * deterministic state, change rationale and a presentation-level priority.
 */
import { RadarThresholds } from './radar.config';

/**
 * R2-048 — Deterministic radar state machine + change detection.
 *
 * No GPT, no randomness. State is derived purely from previous/current metrics
 * and configured thresholds.
 */

const FACTOR_LABELS: Record<keyof RadarMetrics, string> = {
  earlyOpportunityScore: 'Erken Fırsat Skoru',
  eliteScore: 'Elite Skoru',
  signalConvergence: 'Signal Yakınsaması',
  confidence: 'Güven',
  expectedReturn: 'Beklenen Getiri',
  risk: 'Risk',
  smartMoneyScore: 'Smart Money',
  catalystScore: 'Katalizör',
  fundamentalScore: 'Temel Skor',
  dataQualityScore: 'Veri Kalitesi',
  predictionConfidence: 'Tahmin Güveni',
  timeframeAgreement: 'Multi-Timeframe Uyumu',
  entryZone: 'Giriş Bölgesi',
  decisionScore: 'Karar Skoru',
  decisionStatus: 'Karar Durumu',
  earlyOpportunity: 'Erken Fırsat',
  dataTimestamp: 'Veri Zamanı',
};

const NUMERIC_FACTORS: Array<keyof RadarMetrics> = [
  'earlyOpportunityScore',
  'eliteScore',
  'signalConvergence',
  'confidence',
  'expectedReturn',
  'smartMoneyScore',
  'catalystScore',
  'fundamentalScore',
  'dataQualityScore',
  'predictionConfidence',
  'timeframeAgreement',
  'decisionScore',
];

function num(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export function detectFactorChanges(
  prev: RadarMetrics | null,
  curr: RadarMetrics,
): RadarFactorChange[] {
  const changes: RadarFactorChange[] = [];
  for (const factor of NUMERIC_FACTORS) {
    const p = prev ? num(prev[factor] as number | null) : null;
    const c = num(curr[factor] as number | null);
    if (p === null && c === null) {
      changes.push({
        factor,
        label: FACTOR_LABELS[factor],
        previous: null,
        current: null,
        delta: null,
      });
      continue;
    }
    const delta = p !== null && c !== null ? round1(c - p) : null;
    changes.push({
      factor,
      label: FACTOR_LABELS[factor],
      previous: p,
      current: c,
      delta,
    });
  }
  return changes;
}

function materialFactors(
  changes: RadarFactorChange[],
  thresholds: RadarThresholds,
): RadarFactorChange[] {
  return changes.filter((ch) => {
    if (ch.delta === null) return false;
    switch (ch.factor) {
      case 'earlyOpportunityScore':
        return Math.abs(ch.delta) >= thresholds.scoreChange;
      case 'signalConvergence':
        return Math.abs(ch.delta) >= thresholds.signalConvergenceChange;
      case 'confidence':
        return Math.abs(ch.delta) >= thresholds.confidenceChange;
      case 'expectedReturn':
        return Math.abs(ch.delta) >= thresholds.expectedReturnChangePct;
      default:
        return Math.abs(ch.delta) >= 1;
    }
  });
}

export function buildReasons(
  changes: RadarFactorChange[],
  state: RadarState,
  thresholds: RadarThresholds,
  opts: {
    previousState: RadarState | null;
    currentRisk: string;
    previousRisk: string | null;
    current: RadarMetrics;
  },
): string[] {
  const reasons: string[] = [];

  switch (state) {
    case 'NEW':
      reasons.push(
        `Yeni erken fırsat: skor ${opts.current.earlyOpportunityScore.toFixed(0)}, karar ${opts.current.decisionStatus ?? 'bilinmiyor'}.`,
      );
      break;
    case 'STRENGTHENING':
      reasons.push('Fırsat Güçleniyor.');
      break;
    case 'WEAKENING':
      reasons.push('Fırsat Zayıflıyor.');
      break;
    case 'INVALIDATED':
      reasons.push('Fırsat geçersiz hale geldi (skor/karar eşiği altında).');
      break;
    case 'CONFIRMED':
      reasons.push('Fırsat doğrulandı (güçlü ve kararlı).');
      break;
    case 'UNCHANGED':
    default:
      reasons.push('Önemli değişim yok.');
      break;
  }

  for (const ch of materialFactors(changes, thresholds)) {
    const dir = (ch.delta ?? 0) > 0 ? 'yükseldi' : 'düştü';
    reasons.push(`${ch.label}: ${fmt(ch.previous)} → ${fmt(ch.current)} (${dir}).`);
  }

  if (opts.previousRisk && opts.previousRisk !== opts.currentRisk) {
    reasons.push(`Risk seviyesi ${opts.previousRisk} → ${opts.currentRisk}.`);
  }

  if (opts.current.smartMoneyScore !== null && opts.current.smartMoneyScore >= 60) {
    reasons.push('Smart Money pozitif.');
  }
  if (opts.current.timeframeAgreement !== null && opts.current.timeframeAgreement >= 70) {
    reasons.push('4H ve günlük trend uyumu güçlü.');
  }
  if (opts.current.dataQualityScore !== null) {
    reasons.push(`Finansal veri kalitesi %${opts.current.dataQualityScore.toFixed(0)}.`);
  }

  return reasons;
}

function fmt(v: number | null): string {
  return v === null ? 'yok' : v.toFixed(0);
}

export interface DeriveStateInput {
  previousState: RadarState | null;
  previousMetrics: RadarMetrics | null;
  currentMetrics: RadarMetrics;
  thresholds: RadarThresholds;
  minRadarScore: number;
  confirmDecisionStatuses: ReadonlyArray<string>;
}

export interface DeriveStateResult {
  state: RadarState;
  changes: RadarFactorChange[];
  reasons: string[];
  scoreChange: number | null;
}

export function deriveRadarState(input: DeriveStateInput): DeriveStateResult {
  const {
    previousState,
    previousMetrics,
    currentMetrics,
    thresholds,
    minRadarScore,
    confirmDecisionStatuses,
  } = input;

  const activeNow =
    currentMetrics.earlyOpportunityScore >= minRadarScore && currentMetrics.earlyOpportunity;

  const changes = detectFactorChanges(previousMetrics, currentMetrics);
  const scoreChange =
    previousMetrics !== null
      ? round1(currentMetrics.earlyOpportunityScore - previousMetrics.earlyOpportunityScore)
      : null;

  let state: RadarState;

  if (previousState === null || previousMetrics === null) {
    state = activeNow ? 'NEW' : 'UNCHANGED';
  } else if (!activeNow) {
    state = 'INVALIDATED';
  } else {
    const convergenceDelta = deltaOf(changes, 'signalConvergence');
    const confidenceDelta = deltaOf(changes, 'confidence');

    const strengthening =
      (scoreChange !== null && scoreChange >= thresholds.strengthenScore) ||
      (convergenceDelta !== null && convergenceDelta >= thresholds.signalConvergenceChange) ||
      (confidenceDelta !== null && confidenceDelta >= thresholds.confidenceChange);

    const weakening =
      (scoreChange !== null && scoreChange <= -thresholds.weakenScore) ||
      (convergenceDelta !== null && convergenceDelta <= -thresholds.signalConvergenceChange) ||
      (confidenceDelta !== null && confidenceDelta <= -thresholds.confidenceChange);

    if (strengthening) state = 'STRENGTHENING';
    else if (weakening) state = 'WEAKENING';
    else if (
      previousState !== 'CONFIRMED' &&
      currentMetrics.earlyOpportunityScore >= thresholds.confirmedScore &&
      currentMetrics.decisionStatus !== null &&
      confirmDecisionStatuses.includes(currentMetrics.decisionStatus)
    )
      state = 'CONFIRMED';
    else state = 'UNCHANGED';
  }

  const reasons = buildReasons(changes, state, thresholds, {
    previousState,
    currentRisk: currentMetrics.risk,
    previousRisk: previousMetrics?.risk ?? null,
    current: currentMetrics,
  });

  return { state, changes, reasons, scoreChange };
}

function deltaOf(changes: RadarFactorChange[], factor: string): number | null {
  const c = changes.find((x) => x.factor === factor);
  return c ? c.delta : null;
}
