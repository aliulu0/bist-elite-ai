import { Injectable } from '@nestjs/common';
import {
  OpportunityRecord,
  OpportunityStage,
  StageTransition,
  StageTransitionReason,
  OpportunitySnapshot,
  TrackOpportunityInput,
  UpdateOpportunityInput,
  SignalDirection,
  LIFECYCLE_CONFIG_DEFAULTS,
  LifecycleConfig,
  LIFECYCLE_STAGES,
  HealthLevel,
  EarlyDetectionResult,
  EarlyDetectionMetrics,
  MarketContext,
} from './types';

@Injectable()
export class LifecycleTrackerService {
  private opportunities = new Map<string, OpportunityRecord>();
  private symbolIndex = new Map<string, Set<string>>();
  private config: LifecycleConfig = { ...LIFECYCLE_CONFIG_DEFAULTS };

  trackOpportunity(input: TrackOpportunityInput): OpportunityRecord {
    const id = this.generateId(input.stockSymbol);
    const now = new Date().toISOString();

    const snapshot = this.createSnapshot(input, now, OpportunityStage.DETECTED);
    const healthIndex = this.calculateInitialHealth(input);
    const earlyDetection = this.createEarlyDetectionMetrics(input, now);
    const marketContext = this.createMarketContext(input);
    const initialTransition: StageTransition = {
      from: OpportunityStage.DETECTED,
      to: OpportunityStage.DETECTED,
      reason: StageTransitionReason.AUTOMATIC,
      confidence: 1,
      description: 'Firsat ilk kez tespit edildi',
      timestamp: now,
    };

    const record: OpportunityRecord = {
      id,
      stockSymbol: input.stockSymbol,
      stockName: input.stockName,
      stage: OpportunityStage.DETECTED,
      stageHistory: [initialTransition],
      snapshots: [snapshot],
      healthIndex,
      earlyDetection,
      failures: [],
      marketContext,
      currentPrice: input.currentPrice,
      entryPrice: input.currentPrice,
      targetPrice: input.targetPrice,
      stopLossPrice: input.stopLossPrice,
      detectedAt: now,
      signalDirection: SignalDirection.NEUTRAL,
      overallScore: input.eliteScore,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata,
    };

    this.opportunities.set(id, record);
    this.addToIndex(input.stockSymbol, id);
    this.evaluateStageTransitions(record);

    return record;
  }

  updateOpportunity(
    id: string,
    input: UpdateOpportunityInput,
  ): OpportunityRecord | null {
    const record = this.opportunities.get(id);
    if (!record) return null;

    const now = new Date().toISOString();
    const snapshot = this.createSnapshotFromUpdate(record, input, now);
    record.snapshots.push(snapshot);

    if (record.snapshots.length > this.config.tracking.maxSnapshots) {
      record.snapshots = record.snapshots.slice(-this.config.tracking.maxSnapshots);
    }

    if (input.currentPrice !== undefined) record.currentPrice = input.currentPrice;
    if (input.targetPrice !== undefined) record.targetPrice = input.targetPrice;
    if (input.stopLossPrice !== undefined) record.stopLossPrice = input.stopLossPrice;
    if (input.eliteScore !== undefined) record.overallScore = input.eliteScore;
    if (input.metadata) record.metadata = { ...record.metadata, ...input.metadata };

    record.signalDirection = this.calculateSignalDirection(record);
    record.updatedAt = now;

    this.evaluateStageTransitions(record, input.reason);

    return record;
  }

  getOpportunity(id: string): OpportunityRecord | null {
    return this.opportunities.get(id) || null;
  }

  getOpportunitiesBySymbol(symbol: string): OpportunityRecord[] {
    const ids = this.symbolIndex.get(symbol);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.opportunities.get(id))
      .filter((r): r is OpportunityRecord => r !== undefined);
  }

  getActiveOpportunities(): OpportunityRecord[] {
    const activeStages = new Set([
      OpportunityStage.DETECTED,
      OpportunityStage.EMERGING,
      OpportunityStage.CONFIRMED,
      OpportunityStage.STRENGTHENING,
      OpportunityStage.MATURE,
      OpportunityStage.WEAKENING,
    ]);
    return Array.from(this.opportunities.values()).filter((r) =>
      activeStages.has(r.stage),
    );
  }

  getAllOpportunities(): OpportunityRecord[] {
    return Array.from(this.opportunities.values());
  }

  transitionStage(
    id: string,
    toStage: OpportunityStage,
    reason: StageTransitionReason,
    confidence: number = 0.8,
    description?: string,
  ): OpportunityRecord | null {
    const record = this.opportunities.get(id);
    if (!record) return null;

    const now = new Date().toISOString();
    const transition: StageTransition = {
      from: record.stage,
      to: toStage,
      reason,
      confidence,
      description: description || `Gecis: ${record.stage} -> ${toStage}`,
      timestamp: now,
    };

    record.stageHistory.push(transition);
    record.stage = toStage;
    record.updatedAt = now;

    if (toStage === OpportunityStage.CONFIRMED && !record.confirmedAt) {
      record.confirmedAt = now;
    }
    if (toStage === OpportunityStage.MATURE && !record.matureAt) {
      record.matureAt = now;
    }
    if (
      toStage === OpportunityStage.EXPIRED ||
      toStage === OpportunityStage.CANCELLED
    ) {
      record.completedAt = now;
    }

    return record;
  }

  cancelOpportunity(
    id: string,
    reason: StageTransitionReason = StageTransitionReason.MANUAL,
  ): OpportunityRecord | null {
    return this.transitionStage(
      id,
      OpportunityStage.CANCELLED,
      reason,
      1,
      'Firsat iptal edildi',
    );
  }

  private evaluateStageTransitions(
    record: OpportunityRecord,
    overrideReason?: StageTransitionReason,
  ): void {
    const latestSnapshot = record.snapshots[record.snapshots.length - 1];
    if (!latestSnapshot) return;

    const reason = overrideReason || StageTransitionReason.AUTOMATIC;

    switch (record.stage) {
      case OpportunityStage.DETECTED:
        if (
          latestSnapshot.confidence >= this.config.stageTransitions.detectedToEmerging.minConfidence &&
          latestSnapshot.eliteScore >= this.config.stageTransitions.detectedToEmerging.minScore
        ) {
          this.transitionStage(
            record.id,
            OpportunityStage.EMERGING,
            reason,
            latestSnapshot.confidence,
            'Firsat gelisme asamasina gecti',
          );
        }
        break;

      case OpportunityStage.EMERGING:
        if (
          latestSnapshot.confidence >= this.config.stageTransitions.emergingToConfirmed.minConfirmationLevel &&
          latestSnapshot.consensusScore >= this.config.stageTransitions.emergingToConfirmed.minConsensus
        ) {
          this.transitionStage(
            record.id,
            OpportunityStage.CONFIRMED,
            reason,
            latestSnapshot.confidence,
            'Firsat dogrulandi',
          );
        }
        break;

      case OpportunityStage.CONFIRMED: {
        const prevScore = record.snapshots.length >= 2
          ? record.snapshots[record.snapshots.length - 2].eliteScore
          : latestSnapshot.eliteScore;
        const scoreImprovement = latestSnapshot.eliteScore - prevScore;
        if (
          scoreImprovement >= this.config.stageTransitions.confirmedToStrengthening.minScoreImprovement &&
          latestSnapshot.healthIndex >= this.config.stageTransitions.confirmedToStrengthening.minHealthIndex
        ) {
          this.transitionStage(
            record.id,
            OpportunityStage.STRENGTHENING,
            reason,
            latestSnapshot.confidence,
            'Firsat gucleniyor',
          );
        }
        break;
      }

      case OpportunityStage.STRENGTHENING: {
        const daysSinceConfirm = record.confirmedAt
          ? (Date.now() - new Date(record.confirmedAt).getTime()) / 86400000
          : 0;
        if (
          daysSinceConfirm >= this.config.stageTransitions.strengtheningToMature.minHoldingDays &&
          latestSnapshot.healthIndex >= 50
        ) {
          this.transitionStage(
            record.id,
            OpportunityStage.MATURE,
            reason,
            latestSnapshot.confidence,
            'Firsat olgunlasti',
          );
        }
        break;
      }

      case OpportunityStage.MATURE:
        if (
          latestSnapshot.healthIndex <= this.config.stageTransitions.matureToWeakening.maxHealthIndex &&
          latestSnapshot.momentumScore <= this.config.stageTransitions.matureToWeakening.maxMomentum
        ) {
          this.transitionStage(
            record.id,
            OpportunityStage.WEAKENING,
            reason,
            latestSnapshot.confidence,
            'Firsat zayiflamaya basladi',
          );
        }
        break;

      case OpportunityStage.WEAKENING:
        if (
          latestSnapshot.healthIndex <= this.config.stageTransitions.weakeningToExpired.maxHealthIndex
        ) {
          this.transitionStage(
            record.id,
            OpportunityStage.EXPIRED,
            reason,
            latestSnapshot.confidence,
            'Firsatin suresi doldu',
          );
        }
        break;
    }
  }

  private createSnapshot(
    input: TrackOpportunityInput,
    timestamp: string,
    stage: OpportunityStage,
  ): OpportunitySnapshot {
    return {
      timestamp,
      eliteScore: input.eliteScore,
      confidence: input.confidence,
      consensusScore: input.consensusScore,
      riskScore: input.riskScore,
      momentumScore: input.momentumScore || 0.5,
      volumeScore: input.volumeScore || 0.5,
      volatilityScore: input.volatilityScore || 0.5,
      healthIndex: 50,
      stage,
      currentPrice: input.currentPrice,
    };
  }

  private createSnapshotFromUpdate(
    record: OpportunityRecord,
    input: UpdateOpportunityInput,
    timestamp: string,
  ): OpportunitySnapshot {
    const last = record.snapshots[record.snapshots.length - 1];
    return {
      timestamp,
      eliteScore: input.eliteScore ?? last.eliteScore,
      confidence: input.confidence ?? last.confidence,
      consensusScore: input.consensusScore ?? last.consensusScore,
      riskScore: input.riskScore ?? last.riskScore,
      momentumScore: input.momentumScore ?? last.momentumScore,
      volumeScore: input.volumeScore ?? last.volumeScore,
      volatilityScore: input.volatilityScore ?? last.volatilityScore,
      healthIndex: last.healthIndex,
      stage: record.stage,
      currentPrice: input.currentPrice ?? last.currentPrice,
    };
  }

  private calculateInitialHealth(input: TrackOpportunityInput): import('./types').HealthIndex {
    const w = this.config.healthWeights;
    const scoreNorm = input.eliteScore / 100;
    const riskNorm = 1 - input.riskScore;
    const momentum = input.momentumScore || 0.5;
    const overall =
      scoreNorm * w.scoreWeight +
      input.confidence * w.confidenceWeight +
      momentum * w.momentumWeight +
      riskNorm * w.riskWeight +
      0.7 * w.stabilityWeight;

    return {
      overall: Math.round(overall * 100),
      stability: 0.7,
      momentum,
      riskLevel: input.riskScore,
      quality: scoreNorm,
      level: this.getHealthLevel(overall * 100),
      factors: [],
      calculatedAt: new Date().toISOString(),
    };
  }

  private calculateSignalDirection(record: OpportunityRecord): SignalDirection {
    if (record.snapshots.length < 2) return SignalDirection.NEUTRAL;
    const recent = record.snapshots.slice(-3);
    const scoreChanges = recent.map((s, i) =>
      i > 0 ? s.eliteScore - recent[i - 1].eliteScore : 0,
    ).slice(1);
    const avgChange = scoreChanges.reduce((a, b) => a + b, 0) / scoreChanges.length;
    if (avgChange > 2) return SignalDirection.STRENGTHENING;
    if (avgChange < -2) return SignalDirection.WEAKENING;
    return SignalDirection.NEUTRAL;
  }

  private getHealthLevel(score: number): HealthLevel {
    if (score >= 80) return HealthLevel.EXCELLENT;
    if (score >= 60) return HealthLevel.GOOD;
    if (score >= 40) return HealthLevel.FAIR;
    if (score >= 20) return HealthLevel.POOR;
    return HealthLevel.CRITICAL;
  }

  private createEarlyDetectionMetrics(
    input: TrackOpportunityInput,
    now: string,
  ): EarlyDetectionMetrics {
    const timeSinceDetection = input.timeSinceDetection || 0;
    const confirmationLevel = input.confirmationLevel || 0;
    const leadTime = Math.max(0, 72 - timeSinceDetection);
    const persistence = confirmationLevel > 0.5 ? 1 : confirmationLevel;

    let result: EarlyDetectionResult;
    if (timeSinceDetection <= this.config.earlyDetection.earlyThresholdHours) {
      result = EarlyDetectionResult.EARLY;
    } else if (timeSinceDetection <= this.config.earlyDetection.onTimeThresholdHours) {
      result = EarlyDetectionResult.ON_TIME;
    } else if (timeSinceDetection <= this.config.earlyDetection.lateThresholdHours) {
      result = EarlyDetectionResult.LATE;
    } else {
      result = EarlyDetectionResult.MISSED;
    }

    return {
      firstDetectionTime: now,
      confirmationDelay: timeSinceDetection,
      leadTime,
      signalPersistence: persistence,
      earlyDetectionSuccess: result === EarlyDetectionResult.EARLY || result === EarlyDetectionResult.ON_TIME,
      result,
      timeToConfirm: confirmationLevel > 0.6 ? timeSinceDetection : 0,
      timeToMature: 0,
      signalFreshness: Math.max(0, 1 - timeSinceDetection / 72),
      description: `Tespit: ${result}`,
    };
  }

  private createMarketContext(input: TrackOpportunityInput): import('./types').MarketContext {
    return {
      regime: input.marketRegime,
      regimeConfidence: input.regimeConfidence || 0.5,
      sector: input.sector || '',
      industry: input.industry || '',
      timeframe: input.timeframe || 'D1',
      sectorMomentum: input.sectorMomentum || 0.5,
      marketPhase: input.marketPhase || '',
    };
  }

  private generateId(symbol: string): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 6);
    return `opp_${symbol}_${ts}_${rand}`;
  }

  private addToIndex(symbol: string, id: string): void {
    if (!this.symbolIndex.has(symbol)) {
      this.symbolIndex.set(symbol, new Set());
    }
    this.symbolIndex.get(symbol)!.add(id);
  }
}
