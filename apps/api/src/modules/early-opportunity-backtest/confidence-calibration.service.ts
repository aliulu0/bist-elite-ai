import { Injectable } from '@nestjs/common';
import { FutureOutcome, ConfidenceCalibrationResult, ConfidenceCalibrationBucket, SampleQualityLabel, SampleQualityResult } from './early-opportunity-backtest.types';

@Injectable()
export class ConfidenceCalibrationService {
  calibrate(
    outcomes: FutureOutcome[],
    confidenceScores: { ticker: string; decisionDate: string; confidence: number }[],
  ): ConfidenceCalibrationResult {
    const low: number[] = [];
    const medium: number[] = [];
    const high: number[] = [];

    for (const cs of confidenceScores) {
      const outcome = outcomes.find(
        (o) => o.ticker === cs.ticker && o.decisionDate === cs.decisionDate,
      );
      if (!outcome || !outcome.dataAvailable) continue;
      const primaryReturn = this.getPrimaryReturn(outcome);
      if (primaryReturn == null) continue;

      if (cs.confidence < 40) low.push(primaryReturn);
      else if (cs.confidence < 70) medium.push(primaryReturn);
      else high.push(primaryReturn);
    }

    const buckets: ConfidenceCalibrationBucket[] = [
      this.buildBucket('LOW', [0, 39], low, outcomes),
      this.buildBucket('MEDIUM', [40, 69], medium, outcomes),
      this.buildBucket('HIGH', [70, 100], high, outcomes),
    ];

    const overallSampleCount = low.length + medium.length + high.length;
    const meaningfulCorrelation = overallSampleCount >= 30 ? this.detectCorrelation(buckets) : null;

    return {
      buckets,
      overallSampleCount,
      meaningfulCorrelation,
      interpretation: this.buildInterpretation(overallSampleCount, meaningfulCorrelation),
    };
  }

  classifySampleQuality(sampleCount: number): SampleQualityResult {
    let label: SampleQualityLabel;
    let description: string;

    if (sampleCount < 10) {
      label = 'INSUFFICIENT_SAMPLE';
      description = 'Örneklem sayısı güvenilir yorum için yetersiz.';
    } else if (sampleCount < 30) {
      label = 'LOW_CONFIDENCE';
      description = 'Örneklem sayısı düşük güven sağlıyor.';
    } else if (sampleCount < 100) {
      label = 'MODERATE_CONFIDENCE';
      description = 'Örneklem sayısı orta düzey güven sağlıyor.';
    } else {
      label = 'STRONGER_STATISTICAL_SIGNAL';
      description = 'Örneklem sayısı güçlü istatistiksel sinyal sağlıyor.';
    }

    return { sampleCount, label, description };
  }

  private getPrimaryReturn(outcome: FutureOutcome): number | null {
    const primary = outcome.outcomes.find((o) => o.horizon === '3M') || outcome.outcomes.find((o) => o.dataAvailable);
    return primary?.percentageReturn ?? null;
  }

  private buildBucket(
    bucket: 'LOW' | 'MEDIUM' | 'HIGH',
    range: [number, number],
    returns: number[],
    outcomes: FutureOutcome[],
  ): ConfidenceCalibrationBucket {
    if (returns.length === 0) {
      return {
        bucket,
        confidenceRange: range,
        sampleCount: 0,
        averageReturn: 0,
        medianReturn: 0,
        winRate: 0,
        averageDrawdown: 0,
        benchmarkExcessReturn: null,
        interpretation: 'Örneklem yok.',
      };
    }

    const sorted = [...returns].sort((a, b) => a - b);
    const avg = returns.reduce((s, v) => s + v, 0) / returns.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const winRate = (returns.filter((r) => r > 0).length / returns.length) * 100;
    const avgDrawdown = outcomes
      .filter((o) => o.dataAvailable)
      .reduce((s, o) => s + o.overallMaxDrawdown, 0) / Math.max(1, outcomes.filter((o) => o.dataAvailable).length);

    const interpretation = this.bucketInterpretation(bucket, returns.length, avg, winRate);

    return {
      bucket,
      confidenceRange: range,
      sampleCount: returns.length,
      averageReturn: Math.round(avg * 100) / 100,
      medianReturn: Math.round(median * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      averageDrawdown: Math.round(avgDrawdown * 100) / 100,
      benchmarkExcessReturn: null,
      interpretation,
    };
  }

  private detectCorrelation(buckets: ConfidenceCalibrationBucket[]): boolean {
    const nonEmpty = buckets.filter((b) => b.sampleCount > 0);
    if (nonEmpty.length < 2) return false;
    const high = nonEmpty.find((b) => b.bucket === 'HIGH');
    const low = nonEmpty.find((b) => b.bucket === 'LOW');
    if (high && low && high.averageReturn > low.averageReturn) return true;
    return false;
  }

  private buildInterpretation(sampleCount: number, meaningful: boolean | null): string {
    if (sampleCount === 0) return 'Kalibrasyon için yeterli veri yok.';
    if (meaningful === true) return 'Yüksek güven seviyesi tarihsel olarak daha iyi sonuçlarla ilişkili.';
    if (meaningful === false) return 'Güven seviyesi ile getiri arasında anlamlı korelasyon bulunamadı.';
    return 'Örneklem sayısı güvenilir korelasyon analizi için yetersiz.';
  }

  private bucketInterpretation(bucket: string, count: number, avg: number, winRate: number): string {
    if (count === 0) return 'Örneklem yok.';
    return `${bucket} güven: ${count} örnek, ortalama getiri %${avg.toFixed(2)}, kazanma oranı %${winRate.toFixed(1)}.`;
  }
}