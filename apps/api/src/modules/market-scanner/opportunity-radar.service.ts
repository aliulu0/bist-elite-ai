import { Injectable, Logger } from '@nestjs/common';
import {
  ScannerRankingSnapshot,
  ScannerRankingResultEntry,
  ScanComparison,
  ScanComparisonEntry,
  OpportunityRadarEvent,
  OpportunityRadarEventType,
  RadarConfidence,
} from './daily-scan.types';
import { RadarEventThresholds, DailyScanConfig } from './daily-scan.config';
import { DataStatus } from './market-scanner.types';

const OPPORTUNITY_STATES = new Set([
  'EARLY_ACCUMULATION',
  'PRE_BREAKOUT',
  'BREAKOUT',
  'MOMENTUM',
] as const);

const CONFLUENCE_RANK: Record<string, number> = {
  STRONG: 5,
  MODERATE: 4,
  PARTIAL: 3,
  CONFLICTED: 2,
  UNKNOWN: 1,
};

const CLASSIFICATION_RANK: Record<string, number> = {
  EARLY_ACCUMULATION: 8,
  PRE_BREAKOUT: 7,
  BREAKOUT: 6,
  MOMENTUM: 5,
  EXTENDED: 4,
  WEAKENING: 3,
  NO_SIGNAL: 2,
  UNAVAILABLE: 1,
};

const SIGNAL_QUALITY_RANK: Record<string, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  UNAVAILABLE: 0,
};

const DATA_STATUS_RANK: Record<DataStatus, number> = {
  AVAILABLE: 2,
  PARTIALLY_AVAILABLE: 1,
  UNAVAILABLE: 0,
};

const MOMENTUM_RANK: Record<string, number> = {
  ACCELERATING: 5,
  POSITIVE: 4,
  NEUTRAL: 3,
  WEAKENING: 2,
  NEGATIVE: 1,
  UNKNOWN: 0,
};

const BREAKOUT_DEVELOPING_STATES = new Set(['PRE_BREAKOUT', 'BREAKOUT']);

/**
 * R2-078 — Opportunity Radar.
 *
 * The radar is NOT a new opportunity engine. It is a deterministic
 * comparison/interpretation layer over existing scanner snapshots.
 *
 * It detects meaningful state transitions between the PREVIOUS scan and the
 * CURRENT scan using explicit, documented, testable thresholds. It never
 * fabricates data and never tunes thresholds on historical profitability.
 */
@Injectable()
export class OpportunityRadarService {
  private readonly logger = new Logger(OpportunityRadarService.name);

  /**
   * Deterministic comparison of two scan snapshots.
   * Pure function — no side effects, no provider access.
   */
  compareSnapshots(
    previous: ScannerRankingSnapshot | null,
    current: ScannerRankingSnapshot,
  ): ScanComparison {
    const prevMap = new Map<string, ScannerRankingResultEntry>(
      (previous?.results ?? []).map((r) => [r.symbol, r]),
    );
    const currMap = new Map(current.results.map((r) => [r.symbol, r]));

    const symbols = new Set<string>([...prevMap.keys(), ...currMap.keys()]);
    const entries: ScanComparisonEntry[] = [];

    for (const symbol of symbols) {
      const prev = prevMap.get(symbol) ?? null;
      const curr = currMap.get(symbol) ?? null;

      let transition: ScanComparisonEntry['transition'];
      if (prev && curr) transition = 'PRESENT';
      else if (prev && !curr) transition = 'REMOVED';
      else transition = 'NOT_PRESENT';

      entries.push({
        symbol,
        previous: prev,
        current: curr,
        transition,
        rankDelta: prev && curr ? curr.rank - prev.rank : null,
        eliteScoreDelta: prev && curr ? curr.eliteScore - prev.eliteScore : null,
      });
    }

    entries.sort((a, b) => a.symbol.localeCompare(b.symbol));

    return {
      scanId: current.scanId,
      previousScanId: previous?.scanId ?? null,
      comparedAt: new Date().toISOString(),
      entries,
    };
  }

  /**
   * Detect radar events from a scan comparison.
   * Deterministic: identical (previous, current) inputs produce identical events.
   *
   * DNA_RELEVANCE is intentionally never generated in R2-078 because the AHT/DNA
   * matching engine is not implemented. The type exists for future compatibility.
   */
  detectRadarEvents(
    previous: ScannerRankingSnapshot | null,
    current: ScannerRankingSnapshot,
    config: Pick<DailyScanConfig, 'radarEventThresholds'>,
  ): OpportunityRadarEvent[] {
    const comparison = this.compareSnapshots(previous, current);
    const thresholds = config.radarEventThresholds;
    const events: OpportunityRadarEvent[] = [];

    for (const entry of comparison.entries) {
      const prev = entry.previous;
      const curr = entry.current;

      if (curr) {
        events.push(
          ...this.detectCurrentEvents(
            current.scanId,
            entry,
            prev,
            curr,
            thresholds,
            previous !== null,
          ),
        );
      }
      if (prev && !curr) {
        events.push(...this.detectRemovedEvents(current.scanId, entry, prev));
      }
    }

    // Deterministic ordering: scanId, symbol, type
    events.sort((a, b) => {
      if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
      return a.type.localeCompare(b.type);
    });

    return events;
  }

  /**
   * Sort snapshot results with Elite Score as primary ranking score,
   * followed by deterministic tie-breakers.
   */
  rankEntries(results: ScannerRankingResultEntry[]): ScannerRankingResultEntry[] {
    return [...results].sort((a, b) => {
      if (a.eliteScore !== b.eliteScore) return b.eliteScore - a.eliteScore;
      const mtfA = a.multiTimeframeScore ?? -1;
      const mtfB = b.multiTimeframeScore ?? -1;
      if (mtfA !== mtfB) return mtfB - mtfA;
      const clsA = CLASSIFICATION_RANK[a.earlyOpportunityClassification] ?? 0;
      const clsB = CLASSIFICATION_RANK[b.earlyOpportunityClassification] ?? 0;
      if (clsA !== clsB) return clsB - clsA;
      const sqA = SIGNAL_QUALITY_RANK[a.scannerSignalQuality] ?? 0;
      const sqB = SIGNAL_QUALITY_RANK[b.scannerSignalQuality] ?? 0;
      if (sqA !== sqB) return sqB - sqA;
      const dqA = DATA_STATUS_RANK[a.dataStatus];
      const dqB = DATA_STATUS_RANK[b.dataStatus];
      return dqB - dqA;
    });
  }

  private detectCurrentEvents(
    scanId: string,
    entry: ScanComparisonEntry,
    prev: ScannerRankingResultEntry | null,
    curr: ScannerRankingResultEntry,
    thresholds: RadarEventThresholds,
    hasPreviousScan: boolean,
  ): OpportunityRadarEvent[] {
    const events: OpportunityRadarEvent[] = [];

    // NEW_OPPORTUNITY: transitioned from non-opportunity to early opportunity.
    // Requires a previous scan: on the very first scan (no baseline) every
    // classified symbol would be "new" and flood the radar, so it is suppressed.
    const prevIsOpportunity = prev
      ? OPPORTUNITY_STATES.has(
          prev.earlyOpportunityClassification as typeof OPPORTUNITY_STATES extends Set<infer T>
            ? T
            : never,
        )
      : false;
    const currIsOpportunity = OPPORTUNITY_STATES.has(
      curr.earlyOpportunityClassification as typeof OPPORTUNITY_STATES extends Set<infer T>
        ? T
        : never,
    );
    if (
      currIsOpportunity &&
      !prevIsOpportunity &&
      curr.dataStatus !== 'UNAVAILABLE' &&
      hasPreviousScan
    ) {
      events.push(
        this.buildEvent(scanId, entry, 'NEW_OPPORTUNITY', curr, prev, [
          `Sınıf geçişi: ${prev?.earlyOpportunityClassification ?? 'YOK'} → ${curr.earlyOpportunityClassification}`,
          `Elite Score: ${curr.eliteScore}`,
        ]),
      );
    }

    if (prev) {
      const scoreDelta = curr.eliteScore - prev.eliteScore;
      const prevRank = prev.rank;
      const currRank = curr.rank;

      // SCORE_SURGE
      if (scoreDelta >= thresholds.scoreSurgeMinDelta) {
        events.push(
          this.buildEvent(scanId, entry, 'SCORE_SURGE', curr, prev, [
            `Elite Score artışı: ${prev.eliteScore} → ${curr.eliteScore} (${scoreDelta > 0 ? '+' : ''}${scoreDelta.toFixed(1)})`,
          ]),
        );
      }

      // OPPORTUNITY_STRENGTHENING: score up + classification not worsened.
      const prevClass = CLASSIFICATION_RANK[prev.earlyOpportunityClassification] ?? 0;
      const currClass = CLASSIFICATION_RANK[curr.earlyOpportunityClassification] ?? 0;
      if (
        scoreDelta >= thresholds.opportunityStrengtheningMinDelta &&
        currClass >= prevClass &&
        curr.dataStatus !== 'UNAVAILABLE'
      ) {
        events.push(
          this.buildEvent(scanId, entry, 'OPPORTUNITY_STRENGTHENING', curr, prev, [
            `Elite Score: ${prev.eliteScore} → ${curr.eliteScore}`,
            `Sınıf: ${prev.earlyOpportunityClassification} → ${curr.earlyOpportunityClassification}`,
          ]),
        );
      }

      // RANK_IMPROVEMENT
      if (prevRank - currRank >= thresholds.rankImprovementMinDelta) {
        events.push(
          this.buildEvent(scanId, entry, 'RANK_IMPROVEMENT', curr, prev, [
            `Sıra: #${prevRank} → #${currRank} (${prevRank - currRank} basamak yükseldi)`,
          ]),
        );
      }

      // RANK_DETERIORATION
      if (currRank - prevRank >= thresholds.rankDeteriorationMinDelta) {
        events.push(
          this.buildEvent(scanId, entry, 'RANK_DETERIORATION', curr, prev, [
            `Sıra: #${prevRank} → #${currRank} (${currRank - prevRank} basamak geriledi)`,
          ]),
        );
      }

      // VOLUME_EXPANSION: real relativeVolume20 increase.
      if (this.isVolumeExpansion(prev, curr, thresholds)) {
        events.push(
          this.buildEvent(scanId, entry, 'VOLUME_EXPANSION', curr, prev, [
            `Göreli hacim: ${this.fmt(prev.relativeVolume20)}x → ${this.fmt(curr.relativeVolume20)}x`,
          ]),
        );
      }

      // MOMENTUM_ACCELERATION
      if (this.isMomentumAcceleration(prev, curr, thresholds)) {
        events.push(
          this.buildEvent(scanId, entry, 'MOMENTUM_ACCELERATION', curr, prev, [
            `5G momentum: ${this.fmtPct(prev.momentum5D)} → ${this.fmtPct(curr.momentum5D)}`,
          ]),
        );
      }

      // BREAKOUT_DEVELOPING
      if (this.isBreakoutDeveloping(prev, curr)) {
        events.push(
          this.buildEvent(scanId, entry, 'BREAKOUT_DEVELOPING', curr, prev, [
            `Breakout: ${prev.breakoutStatus} → ${curr.breakoutStatus}`,
          ]),
        );
      }

      // MULTI_TIMEFRAME_ALIGNMENT
      if (
        CONFLUENCE_RANK[curr.multiTimeframeConfluence] >=
          CONFLUENCE_RANK[thresholds.multiTimeframeAlignmentTarget] &&
        CONFLUENCE_RANK[prev.multiTimeframeConfluence] <
          CONFLUENCE_RANK[thresholds.multiTimeframeAlignmentTarget]
      ) {
        events.push(
          this.buildEvent(scanId, entry, 'MULTI_TIMEFRAME_ALIGNMENT', curr, prev, [
            `MTF hizalanma: ${prev.multiTimeframeConfluence} → ${curr.multiTimeframeConfluence}`,
          ]),
        );
      }

      // SIGNAL_WEAKENING
      if (
        scoreDelta <= -thresholds.signalWeakeningMinDelta ||
        (currClass < prevClass &&
          currClass <= CLASSIFICATION_RANK.WEAKENING &&
          prevClass >= CLASSIFICATION_RANK.MOMENTUM)
      ) {
        events.push(
          this.buildEvent(scanId, entry, 'SIGNAL_WEAKENING', curr, prev, [
            `Elite Score: ${prev.eliteScore} → ${curr.eliteScore} (${scoreDelta.toFixed(1)})`,
            `Sınıf: ${prev.earlyOpportunityClassification} → ${curr.earlyOpportunityClassification}`,
          ]),
        );
      }

      // DATA_QUALITY_DETERIORATION
      if (
        DATA_STATUS_RANK[curr.dataStatus] < DATA_STATUS_RANK[prev.dataStatus] &&
        curr.dataStatus !== 'UNAVAILABLE'
      ) {
        events.push(
          this.buildEvent(scanId, entry, 'DATA_QUALITY_DETERIORATION', curr, prev, [
            `Veri durumu: ${prev.dataStatus} → ${curr.dataStatus}`,
          ]),
        );
      }

      // DATA_BECAME_UNAVAILABLE
      if (curr.dataStatus === 'UNAVAILABLE' && prev.dataStatus !== 'UNAVAILABLE') {
        events.push(
          this.buildEvent(scanId, entry, 'DATA_BECAME_UNAVAILABLE', curr, prev, [
            `Veri durumu: ${prev.dataStatus} → UNAVAILABLE`,
          ]),
        );
      }

      // SIGNAL_LOST: was an opportunity, still present but no longer a signal
      // (fell to a non-opportunity state with available data).
      if (prevIsOpportunity && !currIsOpportunity && curr.dataStatus !== 'UNAVAILABLE') {
        events.push(
          this.buildEvent(scanId, entry, 'SIGNAL_LOST', curr, prev, [
            `Fırsat sınıfı sona erdi: ${prev.earlyOpportunityClassification} → ${curr.earlyOpportunityClassification}`,
          ]),
        );
      }
    } else {
      // No previous entry for this symbol. DATA_BECAME_AVAILABLE only makes
      // sense when a previous scan exists (symbol was absent/unavailable before).
      if (hasPreviousScan && curr.dataStatus === 'AVAILABLE') {
        events.push(
          this.buildEvent(scanId, entry, 'DATA_BECAME_AVAILABLE', curr, null, [
            `Veri erişilebilir oldu (${curr.dataStatus})`,
          ]),
        );
      }
    }

    return events;
  }

  private detectRemovedEvents(
    scanId: string,
    entry: ScanComparisonEntry,
    prev: ScannerRankingResultEntry,
  ): OpportunityRadarEvent[] {
    const events: OpportunityRadarEvent[] = [];
    const prevIsOpportunity = OPPORTUNITY_STATES.has(
      prev.earlyOpportunityClassification as typeof OPPORTUNITY_STATES extends Set<infer T>
        ? T
        : never,
    );

    // Symbol disappeared from current scan entirely. If it was an opportunity,
    // record SIGNAL_LOST. (Current data status is unknown for removed symbols;
    // DATA_BECAME_UNAVAILABLE takes precedence when explicit evidence exists.)
    if (prevIsOpportunity || prev.status === 'TOP_CANDIDATE') {
      events.push(
        this.buildEvent(scanId, entry, 'SIGNAL_LOST', null, prev, [
          `Sembol güncel tarama sonuçlarında yok`,
          `Önceki sınıf: ${prev.earlyOpportunityClassification}`,
        ]),
      );
    }

    return events;
  }

  private isVolumeExpansion(
    prev: ScannerRankingResultEntry,
    curr: ScannerRankingResultEntry,
    thresholds: RadarEventThresholds,
  ): boolean {
    if (prev.relativeVolume20 === null || curr.relativeVolume20 === null) return false;
    const increase = curr.relativeVolume20 - prev.relativeVolume20;
    const crossedThreshold =
      prev.relativeVolume20 < thresholds.volumeExpansionMinRelativeVolume &&
      curr.relativeVolume20 >= thresholds.volumeExpansionMinRelativeVolume;
    return increase >= thresholds.volumeExpansionMinDelta || crossedThreshold;
  }

  private isMomentumAcceleration(
    prev: ScannerRankingResultEntry,
    curr: ScannerRankingResultEntry,
    thresholds: RadarEventThresholds,
  ): boolean {
    if (prev.momentum5D !== null && curr.momentum5D !== null) {
      if (curr.momentum5D - prev.momentum5D >= thresholds.momentumAccelerationMinDelta) {
        return true;
      }
    }
    return (
      MOMENTUM_RANK[curr.momentumStatus] > MOMENTUM_RANK[prev.momentumStatus] &&
      MOMENTUM_RANK[curr.momentumStatus] >= MOMENTUM_RANK.POSITIVE
    );
  }

  private isBreakoutDeveloping(
    prev: ScannerRankingResultEntry,
    curr: ScannerRankingResultEntry,
  ): boolean {
    if (BREAKOUT_DEVELOPING_STATES.has(curr.breakoutStatus as string) === false) return false;
    if (BREAKOUT_DEVELOPING_STATES.has(prev.breakoutStatus as string) === false) return true;
    // PRE_BREAKOUT -> BREAKOUT progression also counts as developing.
    return prev.breakoutStatus === 'PRE_BREAKOUT' && curr.breakoutStatus === 'BREAKOUT';
  }

  private buildEvent(
    scanId: string,
    entry: ScanComparisonEntry,
    type: OpportunityRadarEventType,
    curr: ScannerRankingResultEntry | null,
    prev: ScannerRankingResultEntry | null,
    factors: string[],
  ): OpportunityRadarEvent {
    const source = curr?.sourceProvenance ?? prev?.sourceProvenance;
    return {
      scanId,
      type,
      symbol: entry.symbol,
      previousState: prev?.earlyOpportunityClassification ?? null,
      currentState: curr?.earlyOpportunityClassification ?? null,
      eliteScore: curr?.eliteScore ?? null,
      previousEliteScore: prev?.eliteScore ?? null,
      rank: curr?.rank ?? null,
      previousRank: prev?.rank ?? null,
      classification: curr?.earlyOpportunityClassification ?? null,
      reason: this.buildReason(type, entry.symbol, prev, curr, factors),
      factors,
      dataStatus: curr?.dataStatus ?? prev?.dataStatus ?? 'UNAVAILABLE',
      confidence: this.determineConfidence(source),
      sourceProvenance: source ?? {
        symbol: entry.symbol,
        provider: 'UNAVAILABLE',
        timeframe: '1d',
        retrievedAt: '',
        marketTimestamp: '',
        source: 'UNAVAILABLE',
        validationStatus: 'INVALID',
      },
      timestamp: new Date().toISOString(),
    };
  }

  private buildReason(
    type: OpportunityRadarEventType,
    symbol: string,
    prev: ScannerRankingResultEntry | null,
    curr: ScannerRankingResultEntry | null,
    factors: string[],
  ): string {
    const detail = factors.length > 0 ? ` ${factors[0]}` : '';
    switch (type) {
      case 'NEW_OPPORTUNITY':
        return `${symbol} yeni erken fırsat sınıfına geçti (${prev?.earlyOpportunityClassification ?? 'YOK'} → ${curr?.earlyOpportunityClassification ?? '?'}).${detail}`;
      case 'OPPORTUNITY_STRENGTHENING':
        return `${symbol} güçleniyor: Elite Score ${prev?.eliteScore ?? '?'} → ${curr?.eliteScore ?? '?'}.${detail}`;
      case 'RANK_IMPROVEMENT':
        return `${symbol} sıralamada yükseldi (#${prev?.rank ?? '?'} → #${curr?.rank ?? '?'}).${detail}`;
      case 'RANK_DETERIORATION':
        return `${symbol} sıralamada geriledi (#${prev?.rank ?? '?'} → #${curr?.rank ?? '?'}).${detail}`;
      case 'SCORE_SURGE':
        return `${symbol} Elite Score'da belirgin artış görüldü.${detail}`;
      case 'VOLUME_EXPANSION':
        return `${symbol} gerçek hacim verisinde genişleme tespit edildi.${detail}`;
      case 'MOMENTUM_ACCELERATION':
        return `${symbol} momentumu hızlanıyor.${detail}`;
      case 'BREAKOUT_DEVELOPING':
        return `${symbol} breakout gelişimi gösteriyor.${detail}`;
      case 'MULTI_TIMEFRAME_ALIGNMENT':
        return `${symbol} çoklu zaman dilimi hizalanması güçlendi.${detail}`;
      case 'SIGNAL_WEAKENING':
        return `${symbol} sinyali zayıflıyor: Elite Score ${prev?.eliteScore ?? '?'} → ${curr?.eliteScore ?? '?'}.${detail}`;
      case 'SIGNAL_LOST':
        return `${symbol} sinyali kayboldu.${detail}`;
      case 'DATA_QUALITY_DETERIORATION':
        return `${symbol} veri kalitesi düştü.${detail}`;
      case 'DATA_BECAME_UNAVAILABLE':
        return `${symbol} verisi erişilemez hale geldi.${detail}`;
      case 'DATA_BECAME_AVAILABLE':
        return `${symbol} verisi erişilebilir hale geldi.${detail}`;
      case 'DNA_RELEVANCE':
        return `${symbol} için DNA eşleşmesi henüz uygulanmamıştır (AHT R2-079+ kapsamı).${detail}`;
      default:
        return `${symbol} durum değişikliği tespit edildi.`;
    }
  }

  private determineConfidence(
    provenance: ScannerRankingResultEntry['sourceProvenance'] | null | undefined,
  ): RadarConfidence {
    if (!provenance) return 'UNAVAILABLE';
    if (provenance.source === 'UNAVAILABLE') return 'UNAVAILABLE';
    // Yahoo-only direct price confirmation = SINGLE_SOURCE = LOW confidence.
    if (provenance.source === 'REAL') return 'LOW';
    if (provenance.source === 'DERIVED') return 'MEDIUM';
    return 'UNAVAILABLE';
  }

  private fmt(value: number | null): string {
    return value === null ? 'YOK' : value.toFixed(2);
  }

  private fmtPct(value: number | null): string {
    return value === null ? 'YOK' : `${(value * 100).toFixed(2)}%`;
  }
}
