import { Injectable } from '@nestjs/common';
import {
  PerformanceEvaluation, CalibrationStatus, ScoringSnapshot,
  CalibrationConfig, CALIBRATION_CONFIG_DEFAULTS
} from './types';

@Injectable()
export class PerformanceEvaluatorService {
  evaluate(
    snapshots: ScoringSnapshot[],
    validationResults?: Array<{
      strategyId: string;
      overallScore: number;
      performanceMetrics: {
        winRate: number;
        profitFactor: number;
        sharpeRatio: number;
        maxDrawdown: number;
      };
      signalQuality: {
        precision: number;
        recall: number;
        f1Score: number;
      };
      eliteScoreValidation?: {
        accuracy: number;
        confidenceCalibration: number;
        calibrationError: number;
        brierScore: number;
        componentContribution: Record<string, number>;
      };
    }>,
    config?: Partial<CalibrationConfig>
  ): PerformanceEvaluation {
    const cfg = { ...CALIBRATION_CONFIG_DEFAULTS, ...config };

    if (!snapshots || snapshots.length === 0) {
      return this.getEmptyEvaluation();
    }

    const predictionAccuracy = this.calculatePredictionAccuracy(snapshots);
    const precision = this.calculatePrecision(snapshots);
    const recall = this.calculateRecall(snapshots);
    const f1Score = (precision + recall) > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;

    const validationMetrics = this.aggregateValidationMetrics(validationResults);

    const scoreDistribution = this.calculateScoreDistribution(snapshots);

    const calibrationError = this.calculateCalibrationError(snapshots);
    const brierScore = this.calculateBrierScore(snapshots);

    const historicalReliability = this.calculateHistoricalReliability(snapshots);

    const overallHealth = this.determineOverallHealth(
      predictionAccuracy, calibrationError, brierScore,
      validationMetrics.profitFactor, validationMetrics.sharpeRatio,
      cfg
    );

    return {
      predictionAccuracy,
      precision,
      recall,
      f1Score,
      profitFactor: validationMetrics.profitFactor,
      sharpeRatio: validationMetrics.sharpeRatio,
      maxDrawdown: validationMetrics.maxDrawdown,
      historicalReliability,
      scoreDistribution,
      calibrationError,
      brierScore,
      overallHealth,
    };
  }

  private getEmptyEvaluation(): PerformanceEvaluation {
    return {
      predictionAccuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      historicalReliability: 0,
      scoreDistribution: { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 },
      calibrationError: 1,
      brierScore: 1,
      overallHealth: CalibrationStatus.CRITICAL,
    };
  }

  private calculatePredictionAccuracy(snapshots: ScoringSnapshot[]): number {
    if (snapshots.length === 0) return 0;

    let correct = 0;
    for (const snapshot of snapshots) {
      const predictedDirection = snapshot.overallScore >= 50 ? 1 : -1;
      const actualDirection = snapshot.actualOutcome >= 0 ? 1 : -1;
      if (predictedDirection === actualDirection) {
        correct++;
      }
    }

    return correct / snapshots.length;
  }

  private calculatePrecision(snapshots: ScoringSnapshot[]): number {
    let truePositives = 0;
    let falsePositives = 0;

    for (const snapshot of snapshots) {
      if (snapshot.overallScore >= 50) {
        if (snapshot.actualOutcome >= 0) {
          truePositives++;
        } else {
          falsePositives++;
        }
      }
    }

    return (truePositives + falsePositives) > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;
  }

  private calculateRecall(snapshots: ScoringSnapshot[]): number {
    let truePositives = 0;
    let falseNegatives = 0;

    for (const snapshot of snapshots) {
      if (snapshot.actualOutcome >= 0) {
        if (snapshot.overallScore >= 50) {
          truePositives++;
        } else {
          falseNegatives++;
        }
      }
    }

    return (truePositives + falseNegatives) > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;
  }

  private aggregateValidationMetrics(
    validationResults?: Array<{
      performanceMetrics: {
        winRate: number;
        profitFactor: number;
        sharpeRatio: number;
        maxDrawdown: number;
      };
    }>
  ): {
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
  } {
    if (!validationResults || validationResults.length === 0) {
      return { profitFactor: 0, sharpeRatio: 0, maxDrawdown: 0 };
    }

    const avgProfitFactor = validationResults.reduce(
      (s, v) => s + v.performanceMetrics.profitFactor, 0
    ) / validationResults.length;

    const avgSharpeRatio = validationResults.reduce(
      (s, v) => s + v.performanceMetrics.sharpeRatio, 0
    ) / validationResults.length;

    const avgMaxDrawdown = validationResults.reduce(
      (s, v) => s + v.performanceMetrics.maxDrawdown, 0
    ) / validationResults.length;

    return {
      profitFactor: avgProfitFactor,
      sharpeRatio: avgSharpeRatio,
      maxDrawdown: avgMaxDrawdown,
    };
  }

  private calculateScoreDistribution(snapshots: ScoringSnapshot[]): {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  } {
    const scores = snapshots.map(s => s.overallScore).sort((a, b) => a - b);
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
    const median = scores.length % 2 === 0
      ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
      : scores[Math.floor(scores.length / 2)];
    const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median,
      stdDev,
      min: scores[0],
      max: scores[scores.length - 1],
    };
  }

  private calculateCalibrationError(snapshots: ScoringSnapshot[]): number {
    const bins = 10;
    const binSize = 1 / bins;
    let totalError = 0;
    let binsWithSamples = 0;

    for (let i = 0; i < bins; i++) {
      const lower = i * binSize;
      const upper = (i + 1) * binSize;

      const binSnapshots = snapshots.filter(s =>
        s.confidence >= lower && s.confidence < upper
      );

      if (binSnapshots.length > 0) {
        const avgConfidence = binSnapshots.reduce((s, sn) => s + sn.confidence, 0) / binSnapshots.length;
        const avgOutcome = binSnapshots.filter(s => s.actualOutcome >= 0).length / binSnapshots.length;
        totalError += Math.abs(avgConfidence - avgOutcome);
        binsWithSamples++;
      }
    }

    return binsWithSamples > 0 ? totalError / binsWithSamples : 1;
  }

  private calculateBrierScore(snapshots: ScoringSnapshot[]): number {
    if (snapshots.length === 0) return 1;

    let sumSquaredErrors = 0;
    for (const snapshot of snapshots) {
      const predicted = snapshot.confidence;
      const actual = snapshot.actualOutcome >= 0 ? 1 : 0;
      sumSquaredErrors += Math.pow(predicted - actual, 2);
    }

    return sumSquaredErrors / snapshots.length;
  }

  private calculateHistoricalReliability(snapshots: ScoringSnapshot[]): number {
    if (snapshots.length < 10) return 0.5;

    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const firstAccuracy = this.calculatePredictionAccuracy(firstHalf);
    const secondAccuracy = this.calculatePredictionAccuracy(secondHalf);

    const stability = 1 - Math.abs(firstAccuracy - secondAccuracy);

    const windows: number[] = [];
    const windowSize = Math.min(10, Math.floor(sorted.length / 3));

    for (let i = 0; i <= sorted.length - windowSize; i += windowSize) {
      const window = sorted.slice(i, i + windowSize);
      windows.push(this.calculatePredictionAccuracy(window));
    }

    let consistency = 0.5;
    if (windows.length >= 2) {
      const mean = windows.reduce((s, v) => s + v, 0) / windows.length;
      const variance = windows.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / windows.length;
      consistency = Math.max(0, 1 - variance * 4);
    }

    return stability * 0.5 + consistency * 0.5;
  }

  private determineOverallHealth(
    predictionAccuracy: number,
    calibrationError: number,
    brierScore: number,
    profitFactor: number,
    sharpeRatio: number,
    config: CalibrationConfig
  ): CalibrationStatus {
    const accuracyScore = predictionAccuracy;
    const calibrationScore = 1 - calibrationError;
    const brierScoreInverse = 1 - brierScore;
    const riskScore = Math.min(1, Math.max(0, profitFactor / 3)) * 0.5 +
      Math.min(1, Math.max(0, sharpeRatio / 2)) * 0.5;

    const overall = (
      accuracyScore * config.metricWeights.accuracyWeight +
      calibrationScore * config.metricWeights.calibrationWeight +
      brierScoreInverse * 0.1 +
      riskScore * config.metricWeights.contributionWeight
    );

    if (overall >= 0.75) return CalibrationStatus.HEALTHY;
    if (overall >= 0.6) return CalibrationStatus.NEEDS_REVIEW;
    if (overall >= 0.4) return CalibrationStatus.DEGRADING;
    return CalibrationStatus.CRITICAL;
  }
}
