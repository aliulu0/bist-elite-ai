import { Injectable } from '@nestjs/common';
import { EliteScoreValidationResult, TradeRecord, ValidationStatus } from './types';

@Injectable()
export class EliteScoreValidator {
  validate(
    eliteScores: Array<{
      date: string;
      score: number;
      confidence: number;
      componentScores: Record<string, number>;
      actualOutcome: number;
    }>
  ): EliteScoreValidationResult {
    if (!eliteScores || eliteScores.length === 0) {
      return this.getEmptyResult();
    }

    const accuracy = this.calculateAccuracy(eliteScores);
    const confidenceCalibration = this.calculateConfidenceCalibration(eliteScores);
    const historicalReliability = this.calculateHistoricalReliability(eliteScores);
    const componentContribution = this.analyzeComponentContribution(eliteScores);
    const scoreDistribution = this.calculateScoreDistribution(eliteScores);
    const calibrationError = this.calculateCalibrationError(eliteScores);
    const brierScore = this.calculateBrierScore(eliteScores);

    const status = this.determineStatus(accuracy, confidenceCalibration, brierScore);

    return {
      accuracy,
      confidenceCalibration,
      historicalReliability,
      componentContribution,
      scoreDistribution,
      calibrationError,
      brierScore,
      status,
    };
  }

  private calculateAccuracy(
    eliteScores: Array<{
      date: string;
      score: number;
      confidence: number;
      actualOutcome: number;
    }>
  ): number {
    let correct = 0;
    let total = 0;

    for (const es of eliteScores) {
      const predictedDirection = es.score >= 50 ? 1 : -1;
      const actualDirection = es.actualOutcome >= 0 ? 1 : -1;

      if (es.score !== 50) {
        total++;
        if (predictedDirection === actualDirection) {
          correct++;
        }
      }
    }

    return total > 0 ? correct / total : 0;
  }

  private calculateConfidenceCalibration(
    eliteScores: Array<{
      date: string;
      score: number;
      confidence: number;
      actualOutcome: number;
    }>
  ): number {
    const buckets = new Map<number, { predicted: number; actual: number; count: number }>();

    for (const es of eliteScores) {
      const bucket = Math.round(es.confidence * 10) / 10;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, { predicted: 0, actual: 0, count: 0 });
      }
      const b = buckets.get(bucket)!;
      b.predicted += es.confidence;
      b.actual += es.actualOutcome >= 0 ? 1 : 0;
      b.count++;
    }

    let totalError = 0;
    let count = 0;

    for (const [, bucket] of buckets) {
      if (bucket.count > 0) {
        const avgPredicted = bucket.predicted / bucket.count;
        const avgActual = bucket.actual / bucket.count;
        totalError += Math.abs(avgPredicted - avgActual);
        count++;
      }
    }

    return count > 0 ? 1 - (totalError / count) : 0;
  }

  private calculateHistoricalReliability(
    eliteScores: Array<{
      date: string;
      score: number;
      confidence: number;
      actualOutcome: number;
    }>
  ): number {
    if (eliteScores.length < 10) return 0.5;

    const sorted = [...eliteScores].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const firstAccuracy = this.calculateAccuracy(firstHalf);
    const secondAccuracy = this.calculateAccuracy(secondHalf);

    const stability = 1 - Math.abs(firstAccuracy - secondAccuracy);

    const consistency = this.calculateConsistency(sorted);

    return (stability * 0.5 + consistency * 0.5);
  }

  private calculateConsistency(
    sortedScores: Array<{
      date: string;
      score: number;
      confidence: number;
      actualOutcome: number;
    }>
  ): number {
    if (sortedScores.length < 10) return 0.5;

    const windowSize = Math.min(10, Math.floor(sortedScores.length / 3));
    const windows: number[] = [];

    for (let i = 0; i <= sortedScores.length - windowSize; i += windowSize) {
      const window = sortedScores.slice(i, i + windowSize);
      windows.push(this.calculateAccuracy(window));
    }

    if (windows.length < 2) return 0.5;

    const mean = windows.reduce((s, v) => s + v, 0) / windows.length;
    const variance = windows.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / windows.length;

    return Math.max(0, 1 - variance * 4);
  }

  private analyzeComponentContribution(
    eliteScores: Array<{
      date: string;
      score: number;
      confidence: number;
      componentScores: Record<string, number>;
      actualOutcome: number;
    }>
  ): Record<string, number> {
    const componentCorrelations: Record<string, number[]> = {};

    for (const es of eliteScores) {
      for (const [component, value] of Object.entries(es.componentScores)) {
        if (!componentCorrelations[component]) {
          componentCorrelations[component] = [];
        }
        componentCorrelations[component].push(value * es.actualOutcome);
      }
    }

    const contributions: Record<string, number> = {};

    for (const [component, values] of Object.entries(componentCorrelations)) {
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      contributions[component] = stdDev > 0 ? mean / stdDev : 0;
    }

    return contributions;
  }

  private calculateScoreDistribution(
    eliteScores: Array<{
      date: string;
      score: number;
      confidence: number;
      actualOutcome: number;
    }>
  ): {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  } {
    const scores = eliteScores.map(es => es.score).sort((a, b) => a - b);
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

  private calculateCalibrationError(
    eliteScores: Array<{
      date: string;
      score: number;
      confidence: number;
      actualOutcome: number;
    }>
  ): number {
    const bins = 10;
    const binSize = 1 / bins;
    let totalError = 0;

    for (let i = 0; i < bins; i++) {
      const lower = i * binSize;
      const upper = (i + 1) * binSize;

      const binScores = eliteScores.filter(es =>
        es.confidence >= lower && es.confidence < upper
      );

      if (binScores.length > 0) {
        const avgPredicted = binScores.reduce((s, es) => s + es.confidence, 0) / binScores.length;
        const avgActual = binScores.filter(es => es.actualOutcome >= 0).length / binScores.length;
        totalError += Math.abs(avgPredicted - avgActual);
      }
    }

    return totalError / bins;
  }

  private calculateBrierScore(
    eliteScores: Array<{
      date: string;
      score: number;
      confidence: number;
      actualOutcome: number;
    }>
  ): number {
    let sumSquaredErrors = 0;

    for (const es of eliteScores) {
      const predicted = es.confidence;
      const actual = es.actualOutcome >= 0 ? 1 : 0;
      sumSquaredErrors += Math.pow(predicted - actual, 2);
    }

    return sumSquaredErrors / eliteScores.length;
  }

  private determineStatus(
    accuracy: number,
    confidenceCalibration: number,
    brierScore: number
  ): ValidationStatus {
    const score = accuracy * 0.4 + confidenceCalibration * 0.3 + (1 - brierScore) * 0.3;

    if (score >= 0.7) return ValidationStatus.PASSED;
    if (score >= 0.5) return ValidationStatus.WARNING;
    if (score >= 0.3) return ValidationStatus.FAILED;
    return ValidationStatus.INSUFFICIENT_DATA;
  }

  private getEmptyResult(): EliteScoreValidationResult {
    return {
      accuracy: 0,
      confidenceCalibration: 0,
      historicalReliability: 0,
      componentContribution: {},
      scoreDistribution: { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 },
      calibrationError: 1,
      brierScore: 1,
      status: ValidationStatus.INSUFFICIENT_DATA,
    };
  }
}
