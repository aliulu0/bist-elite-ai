export interface BenchmarkConfig {
  riskFreeRate: number;
  tradingDaysPerYear: number;
  minDataPoints: number;
  benchmarkWeight: number;
  sectorWeight: number;
}

export const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  riskFreeRate: 0.15,
  tradingDaysPerYear: 252,
  minDataPoints: 5,
  benchmarkWeight: 1.0,
  sectorWeight: 1.0,
};
