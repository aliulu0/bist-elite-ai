import { Injectable } from '@nestjs/common';
import { RecommendationRecord, AIAnalysisReview } from './types';

@Injectable()
export class AIAnalysisReviewerService {
  reviewExplanationConsistency(recommendations: RecommendationRecord[]): AIAnalysisReview[] {
    return recommendations.map(rec => this.reviewSingleRecommendation(rec));
  }

  reviewEvidenceQuality(recommendations: RecommendationRecord[]): number {
    const completed = recommendations.filter(r => r.actualReturn !== undefined);
    if (completed.length === 0) return 0;

    let totalQuality = 0;
    for (const rec of completed) {
      const hasEntryData = rec.entryEliteScore > 0 && rec.entryConfidence > 0 && rec.entryConsensusScore > 0;
      const hasMetadata = rec.metadata !== undefined && Object.keys(rec.metadata || {}).length > 0;
      const qualityScore = (hasEntryData ? 0.6 : 0) + (hasMetadata ? 0.4 : 0);
      totalQuality += qualityScore;
    }
    return totalQuality / completed.length;
  }

  reviewRecommendationQuality(recommendations: RecommendationRecord[]): number {
    const completed = recommendations.filter(r => r.actualReturn !== undefined);
    if (completed.length === 0) return 0;

    let totalQuality = 0;
    for (const rec of completed) {
      const actualReturn = rec.actualReturn || 0;
      const entryScore = rec.entryEliteScore;
      const confidence = rec.entryConfidence;

      const returnComponent = actualReturn > 0 ? Math.min(actualReturn / 10, 1) : Math.max(1 + actualReturn / 10, 0);
      const scoreComponent = entryScore >= 50 ? (entryScore - 50) / 50 : 0;
      const confidenceComponent = confidence;

      const quality = (returnComponent * 0.5) + (scoreComponent * 0.25) + (confidenceComponent * 0.25);
      totalQuality += Math.max(0, Math.min(1, quality));
    }
    return totalQuality / completed.length;
  }

  reviewConfidenceCalibration(recommendations: RecommendationRecord[]): number {
    const completed = recommendations.filter(r => r.actualReturn !== undefined);
    if (completed.length === 0) return 0;

    const buckets: Record<string, { predicted: number; actual: number; count: number }> = {};

    for (const rec of completed) {
      const bucket = Math.floor(rec.entryConfidence * 10) / 10;
      const bucketKey = bucket.toFixed(1);
      if (!buckets[bucketKey]) {
        buckets[bucketKey] = { predicted: 0, actual: 0, count: 0 };
      }
      buckets[bucketKey].predicted += rec.entryConfidence;
      buckets[bucketKey].actual += (rec.actualReturn || 0) > 0 ? 1 : 0;
      buckets[bucketKey].count++;
    }

    let totalCalibrationError = 0;
    let bucketCount = 0;

    for (const key of Object.keys(buckets)) {
      const bucket = buckets[key];
      if (bucket.count > 0) {
        const avgPredicted = bucket.predicted / bucket.count;
        const avgActual = bucket.actual / bucket.count;
        totalCalibrationError += Math.abs(avgPredicted - avgActual);
        bucketCount++;
      }
    }

    const avgCalibrationError = bucketCount > 0 ? totalCalibrationError / bucketCount : 1;
    return Math.max(0, 1 - avgCalibrationError);
  }

  getConsistencyReport(recommendations: RecommendationRecord[]): AIAnalysisReview[] {
    return this.reviewExplanationConsistency(recommendations);
  }

  private reviewSingleRecommendation(rec: RecommendationRecord): AIAnalysisReview {
    const actualReturn = rec.actualReturn || 0;
    const actualPositive = actualReturn > 0;

    const explanationConsistency = this.calculateExplanationConsistency(rec, actualPositive);
    const evidenceQuality = this.calculateEvidenceQuality(rec);
    const recommendationQuality = this.calculateRecommendationQuality(rec, actualPositive);
    const confidenceCalibration = this.calculateConfidenceCalibration(rec, actualPositive);

    const overallScore = (
      explanationConsistency * 0.25 +
      evidenceQuality * 0.25 +
      recommendationQuality * 0.30 +
      confidenceCalibration * 0.20
    );

    const factors = this.generateFactors(rec, actualPositive, explanationConsistency, evidenceQuality, recommendationQuality, confidenceCalibration);

    return {
      recommendationId: rec.id,
      stockSymbol: rec.stockSymbol,
      explanationConsistency,
      evidenceQuality,
      recommendationQuality,
      confidenceCalibration,
      overallScore,
      factors,
      reviewedAt: new Date().toISOString(),
    };
  }

  private calculateExplanationConsistency(rec: RecommendationRecord, actualPositive: boolean): number {
    const predictedPositive = rec.entryEliteScore >= 50;
    if (predictedPositive === actualPositive) return 1;
    if (Math.abs(rec.entryEliteScore - 50) < 10) return 0.5;
    return 0;
  }

  private calculateEvidenceQuality(rec: RecommendationRecord): number {
    let score = 0;
    if (rec.entryEliteScore > 0) score += 0.3;
    if (rec.entryConfidence > 0) score += 0.3;
    if (rec.entryConsensusScore > 0) score += 0.2;
    if (rec.strategyUsed) score += 0.1;
    if (rec.sector) score += 0.1;
    return score;
  }

  private calculateRecommendationQuality(rec: RecommendationRecord, actualPositive: boolean): number {
    const return_ = rec.actualReturn || 0;
    if (actualPositive && rec.entryEliteScore >= 70) return 1;
    if (actualPositive && rec.entryEliteScore >= 50) return 0.75;
    if (!actualPositive && rec.entryEliteScore < 50) return 0.75;
    if (!actualPositive && rec.entryEliteScore < 30) return 1;
    return 0.25;
  }

  private calculateConfidenceCalibration(rec: RecommendationRecord, actualPositive: boolean): number {
    const expectedAccuracy = rec.entryConfidence;
    const actualAccuracy = actualPositive ? 1 : 0;
    return Math.max(0, 1 - Math.abs(expectedAccuracy - actualAccuracy));
  }

  private generateFactors(
    rec: RecommendationRecord,
    actualPositive: boolean,
    explanationConsistency: number,
    evidenceQuality: number,
    recommendationQuality: number,
    confidenceCalibration: number,
  ): Array<{ factor: string; score: number; description: string }> {
    return [
      {
        factor: 'Aciklama Tutarliligi',
        score: explanationConsistency,
        description: explanationConsistency >= 0.7
          ? 'Aciklama sonuc ile uyumlu'
          : 'Aciklama sonuc ile uyumsuz',
      },
      {
        factor: 'Kanit Kalitesi',
        score: evidenceQuality,
        description: evidenceQuality >= 0.7
          ? 'Yeterli kanit mevcut'
          : 'Kanit kalitesi dusuk',
      },
      {
        factor: 'Oneri Kalitesi',
        score: recommendationQuality,
        description: recommendationQuality >= 0.7
          ? 'Oneri basarili'
          : 'Oneri basarisiz',
      },
      {
        factor: 'Guven Kalibrasyonu',
        score: confidenceCalibration,
        description: confidenceCalibration >= 0.7
          ? 'Guven duzeyi uygun'
          : 'Guven duzeyi uygun degil',
      },
    ];
  }
}
