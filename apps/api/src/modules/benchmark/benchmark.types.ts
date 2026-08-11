export interface BenchmarkResult {
  strategyReturn: number;
  benchmarkReturn: number;
  sectorReturn: number;
  alpha: number;
  beta: number;
  trackingError: number;
  informationRatio: number;
  captureRatio: number;
  excessReturn: number;
  metadata: Record<string, unknown>;
  isValid: boolean;
}
