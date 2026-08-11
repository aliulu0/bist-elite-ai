import { Injectable } from '@nestjs/common';
import { NormalizationConfig, RankingFactor } from '../ranking.types';

@Injectable()
export class Normalizer {
  private readonly config: NormalizationConfig;

  constructor(config: NormalizationConfig) {
    this.config = config;
  }

  normalize(factors: RankingFactor[], allFactorValues: Map<string, number[]>): RankingFactor[] {
    switch (this.config.mode) {
      case 'PERCENTILE':
        return this.percentileNormalize(factors, allFactorValues);
      case 'Z_SCORE':
        return this.zScoreNormalize(factors, allFactorValues);
      case 'MIN_MAX':
        return this.minMaxNormalize(factors, allFactorValues);
      default:
        return this.percentileNormalize(factors, allFactorValues);
    }
  }

  normalizeScore(rawScore: number, allScores: number[]): number {
    switch (this.config.mode) {
      case 'PERCENTILE':
        return this.percentileRank(rawScore, allScores);
      case 'Z_SCORE':
        return this.zScore(rawScore, allScores);
      case 'MIN_MAX':
        return this.minMax(rawScore, allScores);
      default:
        return this.percentileRank(rawScore, allScores);
    }
  }

  private percentileNormalize(factors: RankingFactor[], allValues: Map<string, number[]>): RankingFactor[] {
    return factors.map((f) => {
      const values = allValues.get(f.name) ?? [f.rawValue];
      return { ...f, normalizedValue: this.percentileRank(f.rawValue, values) };
    });
  }

  private zScoreNormalize(factors: RankingFactor[], allValues: Map<string, number[]>): RankingFactor[] {
    return factors.map((f) => {
      const values = allValues.get(f.name) ?? [f.rawValue];
      const z = this.zScore(f.rawValue, values);
      const normalized = 50 + z * this.config.zScoreStdDev;
      return { ...f, normalizedValue: Math.min(100, Math.max(0, normalized)) };
    });
  }

  private minMaxNormalize(factors: RankingFactor[], allValues: Map<string, number[]>): RankingFactor[] {
    return factors.map((f) => {
      const values = allValues.get(f.name) ?? [f.rawValue];
      return { ...f, normalizedValue: this.minMax(f.rawValue, values) };
    });
  }

  private percentileRank(value: number, values: number[]): number {
    if (values.length === 0) return 50;
    const sorted = [...values].sort((a, b) => a - b);
    const below = sorted.filter((v) => v < value).length;
    const equal = sorted.filter((v) => v === value).length;
    return Math.round(((below + equal * 0.5) / sorted.length) * 100 * 100) / 100;
  }

  private zScore(value: number, values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  private minMax(value: number, values: number[]): number {
    if (values.length === 0) return 50;
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max === min) return 50;
    return Math.round(((value - min) / (max - min)) * 100 * 100) / 100;
  }
}
