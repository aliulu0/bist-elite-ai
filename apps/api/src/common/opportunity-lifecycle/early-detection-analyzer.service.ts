import { Injectable } from '@nestjs/common';
import {
  OpportunityRecord,
  EarlyDetectionMetrics,
  EarlyDetectionResult,
  LIFECYCLE_CONFIG_DEFAULTS,
  LifecycleConfig,
} from './types';

@Injectable()
export class EarlyDetectionAnalyzerService {
  private config: LifecycleConfig = { ...LIFECYCLE_CONFIG_DEFAULTS };

  analyzeDetection(record: OpportunityRecord): EarlyDetectionMetrics {
    return record.earlyDetection;
  }

  recalculateDetection(record: OpportunityRecord): EarlyDetectionMetrics {
    const detectionTime = new Date(record.detectedAt).getTime();
    const confirmationTime = record.confirmedAt
      ? new Date(record.confirmedAt).getTime()
      : undefined;

    const timeToConfirm = confirmationTime
      ? (confirmationTime - detectionTime) / 3600000
      : 0;

    const timeToMature = record.matureAt
      ? (new Date(record.matureAt).getTime() - detectionTime) / 3600000
      : 0;

    const elapsedHours = (Date.now() - detectionTime) / 3600000;
    const classificationHours = confirmationTime !== undefined ? timeToConfirm : elapsedHours;

    const leadTime = Math.max(0, 72 - classificationHours);
    const persistence = this.calculatePersistence(record);
    const freshness = this.calculateFreshness(record);

    const result = this.classifyDetection(classificationHours);

    return {
      firstDetectionTime: record.detectedAt,
      confirmationDelay: classificationHours,
      leadTime,
      signalPersistence: persistence,
      earlyDetectionSuccess: result === EarlyDetectionResult.EARLY || result === EarlyDetectionResult.ON_TIME,
      result,
      timeToConfirm,
      timeToMature,
      signalFreshness: freshness,
      description: this.generateDescription(result, classificationHours, persistence),
    };
  }

  private classifyDetection(timeToConfirmHours: number): EarlyDetectionResult {
    const thresholds = this.config.earlyDetection;
    if (timeToConfirmHours <= thresholds.earlyThresholdHours) {
      return EarlyDetectionResult.EARLY;
    }
    if (timeToConfirmHours <= thresholds.onTimeThresholdHours) {
      return EarlyDetectionResult.ON_TIME;
    }
    if (timeToConfirmHours <= thresholds.lateThresholdHours) {
      return EarlyDetectionResult.LATE;
    }
    return EarlyDetectionResult.MISSED;
  }

  private calculatePersistence(record: OpportunityRecord): number {
    const scores = record.snapshots.map((s) => s.eliteScore);
    if (scores.length < 2) return 1;

    let positiveCount = 0;
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] >= scores[i - 1]) positiveCount++;
    }
    return positiveCount / (scores.length - 1);
  }

  private calculateFreshness(record: OpportunityRecord): number {
    const elapsed = (Date.now() - new Date(record.detectedAt).getTime()) / 3600000;
    return Math.max(0, 1 - elapsed / 72);
  }

  private generateDescription(
    result: EarlyDetectionResult,
    timeToConfirm: number,
    persistence: number,
  ): string {
    const resultText: Record<EarlyDetectionResult, string> = {
      [EarlyDetectionResult.EARLY]: 'Erken tespit edildi',
      [EarlyDetectionResult.ON_TIME]: 'Zamaninda tespit edildi',
      [EarlyDetectionResult.LATE]: 'Gecikmis tespit',
      [EarlyDetectionResult.MISSED]: 'Tespit kacirildi',
    };
    return `${resultText[result]} (${timeToConfirm.toFixed(1)} saat, dayaniklilik: ${(persistence * 100).toFixed(0)}%)`;
  }
}
