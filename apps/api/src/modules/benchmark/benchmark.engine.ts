import { Injectable, Optional } from '@nestjs/common';
import { BenchmarkResult } from './benchmark.types';
import { BenchmarkConfig, DEFAULT_BENCHMARK_CONFIG } from './benchmark.config';

export interface BenchmarkInput {
  strategyReturns: number[];
  benchmarkReturns: number[];
  sectorReturns: number[];
}

@Injectable()
export class BenchmarkEngine {
  private readonly config: BenchmarkConfig;

  constructor(@Optional() config?: Partial<BenchmarkConfig>) {
    this.config = { ...DEFAULT_BENCHMARK_CONFIG, ...config };
  }

  evaluate(input: BenchmarkInput): BenchmarkResult {
    const { strategyReturns, benchmarkReturns, sectorReturns } = input;

    if (!strategyReturns || strategyReturns.length === 0) {
      return this.emptyResult('No strategy returns provided');
    }

    if (!benchmarkReturns || benchmarkReturns.length === 0) {
      return this.emptyResult('No benchmark returns provided');
    }

    if (strategyReturns.length < this.config.minDataPoints) {
      return this.emptyResult(`Insufficient data points: ${strategyReturns.length} (minimum ${this.config.minDataPoints})`);
    }

    const strategyReturn = this.compoundReturn(strategyReturns);
    const benchmarkReturn = this.compoundReturn(benchmarkReturns);
    const sectorReturn = sectorReturns && sectorReturns.length > 0
      ? this.compoundReturn(sectorReturns)
      : 0;

    const beta = this.calculateBeta(strategyReturns, benchmarkReturns);
    const alpha = this.calculateAlpha(strategyReturn, benchmarkReturn, beta);
    const excessReturn = strategyReturn - benchmarkReturn;
    const trackingError = this.calculateTrackingError(strategyReturns, benchmarkReturns);
    const informationRatio = trackingError > 0 ? excessReturn / trackingError : 0;
    const captureRatio = benchmarkReturn !== 0 ? strategyReturn / benchmarkReturn : 0;

    return {
      strategyReturn,
      benchmarkReturn,
      sectorReturn,
      alpha,
      beta,
      trackingError,
      informationRatio,
      captureRatio,
      excessReturn,
      metadata: {
        strategyDataPoints: strategyReturns.length,
        benchmarkDataPoints: benchmarkReturns.length,
        sectorDataPoints: sectorReturns?.length ?? 0,
        riskFreeRate: this.config.riskFreeRate,
        tradingDaysPerYear: this.config.tradingDaysPerYear,
        annualizedStrategy: this.annualize(strategyReturn),
        annualizedBenchmark: this.annualize(benchmarkReturn),
      },
      isValid: true,
    };
  }

  private compoundReturn(returns: number[]): number {
    return returns.reduce((acc, r) => acc * (1 + r / 100), 1) - 1;
  }

  private annualize(totalReturn: number): number {
    const years = 1;
    if (years <= 0) return 0;
    return (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;
  }

  private calculateBeta(strategyReturns: number[], benchmarkReturns: number[]): number {
    const n = Math.min(strategyReturns.length, benchmarkReturns.length);
    if (n < 2) return 0;

    const sReturns = strategyReturns.slice(0, n);
    const bReturns = benchmarkReturns.slice(0, n);

    const sMean = sReturns.reduce((a, b) => a + b, 0) / n;
    const bMean = bReturns.reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let variance = 0;
    for (let i = 0; i < n; i++) {
      covariance += (sReturns[i] - sMean) * (bReturns[i] - bMean);
      variance += (bReturns[i] - bMean) ** 2;
    }

    return variance > 0 ? covariance / variance : 0;
  }

  private calculateAlpha(strategyReturn: number, benchmarkReturn: number, beta: number): number {
    const rf = this.config.riskFreeRate;
    return strategyReturn - (rf + beta * (benchmarkReturn - rf));
  }

  private calculateTrackingError(strategyReturns: number[], benchmarkReturns: number[]): number {
    const n = Math.min(strategyReturns.length, benchmarkReturns.length);
    if (n < 2) return 0;

    const excessReturns: number[] = [];
    for (let i = 0; i < n; i++) {
      excessReturns.push(strategyReturns[i] - benchmarkReturns[i]);
    }

    const mean = excessReturns.reduce((a, b) => a + b, 0) / n;
    const variance = excessReturns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / (n - 1);

    return Math.sqrt(variance);
  }

  private emptyResult(reason: string): BenchmarkResult {
    return {
      strategyReturn: 0,
      benchmarkReturn: 0,
      sectorReturn: 0,
      alpha: 0,
      beta: 0,
      trackingError: 0,
      informationRatio: 0,
      captureRatio: 0,
      excessReturn: 0,
      metadata: { reason },
      isValid: false,
    };
  }
}
