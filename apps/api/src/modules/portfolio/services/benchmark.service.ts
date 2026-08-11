import { Injectable, Logger } from '@nestjs/common';
import { BenchmarkType, StoredBenchmark } from '../types/portfolio.types';

@Injectable()
export class BenchmarkService {
  private readonly logger = new Logger(BenchmarkService.name);

  private readonly benchmarks: Map<string, StoredBenchmark> = new Map();

  registerBenchmark(symbol: string, name: string, type: BenchmarkType): void {
    this.benchmarks.set(symbol, {
      symbol,
      name,
      type,
      data: [],
    });
    this.logger.log(`Registered benchmark: ${name} (${symbol})`);
  }

  updateBenchmarkData(symbol: string, price: number): void {
    const benchmark = this.benchmarks.get(symbol);
    if (!benchmark) {
      this.logger.warn(`Benchmark ${symbol} not found`);
      return;
    }
    benchmark.data.push({
      date: new Date().toISOString().split('T')[0],
      value: price,
    });
  }

  getBenchmarkReturns(symbol: string, startDate: string, endDate: string): number[] {
    const benchmark = this.benchmarks.get(symbol);
    if (!benchmark || benchmark.data.length === 0) return [];

    const filtered = benchmark.data.filter((d) => d.date >= startDate && d.date <= endDate);
    return this.calculateReturns(filtered.map((d) => d.value));
  }

  getBenchmarkPerformance(symbol: string): { totalReturn: number; annualizedReturn: number } | null {
    const benchmark = this.benchmarks.get(symbol);
    if (!benchmark || benchmark.data.length < 2) return null;

    const firstValue = benchmark.data[0].value;
    const lastValue = benchmark.data[benchmark.data.length - 1].value;
    const totalReturn = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    const years = benchmark.data.length / 365;
    const annualizedReturn = years > 0 ? (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100 : 0;

    return {
      totalReturn: Math.round(totalReturn * 100) / 100,
      annualizedReturn: Math.round(annualizedReturn * 100) / 100,
    };
  }

  getAvailableBenchmarks(): { symbol: string; name: string; type: BenchmarkType }[] {
    return Array.from(this.benchmarks.values()).map(({ symbol, name, type }) => ({
      symbol,
      name,
      type,
    }));
  }

  private calculateReturns(values: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
        returns.push((values[i] - values[i - 1]) / values[i - 1]);
      }
    }
    return returns;
  }
}
