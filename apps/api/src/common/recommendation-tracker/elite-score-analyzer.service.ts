import { Injectable } from '@nestjs/common';
import { RecommendationRecord, EliteScoreAnalysis } from './types';

@Injectable()
export class EliteScoreAnalyzerService {
  analyzeScoreAccuracy(recommendations: RecommendationRecord[]): EliteScoreAnalysis[] {
    return recommendations.map(rec => this.analyzeSingleRecommendation(rec));
  }

  analyzeConfidenceAccuracy(recommendations: RecommendationRecord[]): number {
    const completed = recommendations.filter(r => r.actualReturn !== undefined);
    if (completed.length === 0) return 0;

    let correctPredictions = 0;
    for (const rec of completed) {
      const predictedPositive = rec.entryConfidence >= 0.5;
      const actualPositive = (rec.actualReturn || 0) > 0;
      if (predictedPositive === actualPositive) correctPredictions++;
    }
    return correctPredictions / completed.length;
  }

  analyzeScoreStability(recommendations: RecommendationRecord[]): number {
    const completed = recommendations.filter(r => r.actualReturn !== undefined);
    if (completed.length < 2) return 0;

    const scores = completed.map(r => r.entryEliteScore);
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
    const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (scores.length - 1);
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
    return Math.max(0, 1 - coefficientOfVariation);
  }

  analyzePredictionQuality(recommendations: RecommendationRecord[]): number {
    const completed = recommendations.filter(r => r.actualReturn !== undefined);
    if (completed.length === 0) return 0;

    const predictions = completed.map(r => r.entryConfidence / 100);
    const outcomes = completed.map(r => (r.actualReturn || 0) > 0 ? 1 : 0);
    const brierScore = this.calculateBrierScore(predictions, outcomes);
    return Math.max(0, 1 - brierScore);
  }

  getScoreDistributionStats(recommendations: RecommendationRecord[]): {
    mean: number;
    median: number;
    stdDev: number;
  } {
    if (recommendations.length === 0) {
      return { mean: 0, median: 0, stdDev: 0 };
    }

    const scores = recommendations.map(r => r.entryEliteScore);
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length;

    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;

    const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (scores.length - 1 || 1);
    const stdDev = Math.sqrt(variance);

    return { mean, median, stdDev };
  }

  calculateBrierScore(predictions: number[], outcomes: number[]): number {
    if (predictions.length === 0 || predictions.length !== outcomes.length) return 0;
    const n = predictions.length;
    const sumSquaredDiffs = predictions.reduce((s, p, i) => s + Math.pow(p - outcomes[i], 2), 0);
    return sumSquaredDiffs / n;
  }

  calculateCalibrationError(predictions: number[], outcomes: number[]): number {
    if (predictions.length === 0 || predictions.length !== outcomes.length) return 0;

    const bins = 10;
    let totalError = 0;
    let totalBins = 0;

    for (let b = 0; b < bins; b++) {
      const lower = b / bins;
      const upper = (b + 1) / bins;
      const binPredictions: number[] = [];
      const binOutcomes: number[] = [];

      for (let i = 0; i < predictions.length; i++) {
        if (predictions[i] >= lower && predictions[i] < upper) {
          binPredictions.push(predictions[i]);
          binOutcomes.push(outcomes[i]);
        }
      }

      if (binPredictions.length > 0) {
        const avgPrediction = binPredictions.reduce((s, v) => s + v, 0) / binPredictions.length;
        const avgOutcome = binOutcomes.reduce((s, v) => s + v, 0) / binOutcomes.length;
        totalError += Math.abs(avgPrediction - avgOutcome);
        totalBins++;
      }
    }

    return totalBins > 0 ? totalError / totalBins : 0;
  }

  private analyzeSingleRecommendation(rec: RecommendationRecord): EliteScoreAnalysis {
    const actualReturn = rec.actualReturn || 0;
    const predictedPositive = rec.entryEliteScore >= 50;
    const actualPositive = actualReturn > 0;
    const scoreAccuracy = predictedPositive === actualPositive ? 1 : 0;

    const confidenceAccuracy = rec.entryConfidence > 0
      ? Math.max(0, 1 - Math.abs(rec.entryConfidence - (actualPositive ? 1 : 0)))
      : 0;

    const scoreDrift = actualReturn !== 0
      ? Math.abs(rec.entryEliteScore - 50) / 50 * (actualReturn > 0 ? 1 : -1)
      : 0;

    const predictions = [rec.entryConfidence / 100];
    const outcomes = [actualPositive ? 1 : 0];
    const brierScore = this.calculateBrierScore(predictions, outcomes);
    const calibrationError = this.calculateCalibrationError(predictions, outcomes);

    return {
      recommendationId: rec.id,
      stockSymbol: rec.stockSymbol,
      scoreAccuracy,
      confidenceAccuracy,
      scoreStability: 1,
      scoreDrift,
      predictionQuality: Math.max(0, 1 - brierScore),
      brierScore,
      calibrationError,
      scoreDistribution: {
        mean: rec.entryEliteScore,
        median: rec.entryEliteScore,
        stdDev: 0,
      },
      analyzedAt: new Date().toISOString(),
    };
  }
}
