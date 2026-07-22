import { Injectable } from '@nestjs/common';
import {
  ComponentTrend, TrendDirection, ScoringSnapshot,
  CalibrationConfig, CALIBRATION_CONFIG_DEFAULTS, TrendAnalysisPoint
} from './types';

@Injectable()
export class TrendAnalyzerService {
  analyze(
    snapshots: ScoringSnapshot[],
    config?: Partial<CalibrationConfig>
  ): ComponentTrend[] {
    const cfg = { ...CALIBRATION_CONFIG_DEFAULTS, ...config };

    if (!snapshots || snapshots.length === 0) {
      return [];
    }

    const components = this.extractComponents(snapshots);
    return components.map(component =>
      this.analyzeComponentTrend(component, snapshots, cfg)
    );
  }

  private extractComponents(snapshots: ScoringSnapshot[]): string[] {
    const componentSet = new Set<string>();
    for (const snapshot of snapshots) {
      for (const key of Object.keys(snapshot.componentScores)) {
        componentSet.add(key);
      }
    }
    return Array.from(componentSet);
  }

  private analyzeComponentTrend(
    component: string,
    snapshots: ScoringSnapshot[],
    config: CalibrationConfig
  ): ComponentTrend {
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const dataPoints: TrendAnalysisPoint[] = sorted
      .filter(s => s.componentScores[component] !== undefined)
      .map(s => ({
        timestamp: s.timestamp,
        value: s.componentScores[component],
        sampleSize: 1,
      }));

    if (dataPoints.length < 5) {
      return {
        component,
        direction: TrendDirection.INSUFFICIENT_DATA,
        strength: 0,
        dataPoints,
        slope: 0,
        rSquared: 0,
        forecast: 0,
        confidence: 0,
      };
    }

    const values = dataPoints.map(d => d.value);
    const indices = dataPoints.map((_, i) => i);

    const { slope, intercept, rSquared } = this.linearRegression(indices, values);

    const direction = this.determineDirection(slope, config.thresholds.trendSensitivity);

    const strength = this.calculateStrength(rSquared, dataPoints.length);

    const forecast = this.forecastNext(slope, intercept, indices.length);

    const confidence = this.calculateTrendConfidence(
      rSquared, dataPoints.length, strength
    );

    return {
      component,
      direction,
      strength,
      dataPoints,
      slope,
      rSquared,
      forecast,
      confidence,
    };
  }

  private linearRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
    rSquared: number;
  } {
    const n = x.length;
    if (n < 2) return { slope: 0, intercept: y[0] || 0, rSquared: 0 };

    const meanX = x.reduce((s, v) => s + v, 0) / n;
    const meanY = y.reduce((s, v) => s + v, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denominator += (x[i] - meanX) * (x[i] - meanX);
    }

    const slope = denominator > 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept;
      ssRes += Math.pow(y[i] - predicted, 2);
      ssTot += Math.pow(y[i] - meanY, 2);
    }

    const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    return { slope, intercept, rSquared: Math.max(0, rSquared) };
  }

  private determineDirection(slope: number, sensitivity: number): TrendDirection {
    const normalizedSlope = slope;

    if (normalizedSlope > sensitivity) return TrendDirection.IMPROVING;
    if (normalizedSlope < -sensitivity) return TrendDirection.DEGRADING;
    return TrendDirection.STABLE;
  }

  private calculateStrength(rSquared: number, sampleSize: number): number {
    const sampleFactor = Math.min(1, sampleSize / 50);
    return rSquared * sampleFactor;
  }

  private forecastNext(slope: number, intercept: number, nextIndex: number): number {
    return slope * nextIndex + intercept;
  }

  private calculateTrendConfidence(
    rSquared: number,
    sampleSize: number,
    strength: number
  ): number {
    const sampleConfidence = Math.min(1, sampleSize / 30);
    const fitConfidence = rSquared;
    const strengthConfidence = strength;

    return sampleConfidence * 0.3 + fitConfidence * 0.4 + strengthConfidence * 0.3;
  }

  analyzeOverallTrend(snapshots: ScoringSnapshot[]): {
    direction: TrendDirection;
    strength: number;
    improving: string[];
    degrading: string[];
    stable: string[];
  } {
    if (!snapshots || snapshots.length < 5) {
      return {
        direction: TrendDirection.INSUFFICIENT_DATA,
        strength: 0,
        improving: [],
        degrading: [],
        stable: [],
      };
    }

    const trends = this.analyze(snapshots);

    const improving = trends
      .filter(t => t.direction === TrendDirection.IMPROVING)
      .map(t => t.component);

    const degrading = trends
      .filter(t => t.direction === TrendDirection.DEGRADING)
      .map(t => t.component);

    const stable = trends
      .filter(t => t.direction === TrendDirection.STABLE)
      .map(t => t.component);

    let overallDirection: TrendDirection;
    if (improving.length > degrading.length && improving.length > stable.length) {
      overallDirection = TrendDirection.IMPROVING;
    } else if (degrading.length > improving.length && degrading.length > stable.length) {
      overallDirection = TrendDirection.DEGRADING;
    } else {
      overallDirection = TrendDirection.STABLE;
    }

    const avgStrength = trends.length > 0
      ? trends.reduce((s, t) => s + t.strength, 0) / trends.length
      : 0;

    return {
      direction: overallDirection,
      strength: avgStrength,
      improving,
      degrading,
      stable,
    };
  }
}
