import { BenchmarkEngine, BenchmarkInput } from './benchmark.engine';
import { BenchmarkResult } from './benchmark.types';
import { DEFAULT_BENCHMARK_CONFIG } from './benchmark.config';

function makeInput(overrides?: Partial<BenchmarkInput>): BenchmarkInput {
  return {
    strategyReturns: [1.5, 2.0, -0.5, 1.0, 0.8, 1.2, -0.3, 0.9, 1.1, 0.7],
    benchmarkReturns: [1.0, 1.5, -0.8, 0.5, 0.6, 0.8, -0.5, 0.4, 0.9, 0.5],
    sectorReturns: [0.8, 1.2, -0.6, 0.7, 0.5, 0.9, -0.4, 0.6, 0.8, 0.4],
    ...overrides,
  };
}

describe('BenchmarkEngine', () => {
  let engine: BenchmarkEngine;

  beforeEach(() => {
    engine = new BenchmarkEngine();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('empty and invalid data', () => {
    it('should return invalid for empty strategy returns', () => {
      const result = engine.evaluate(makeInput({ strategyReturns: [] }));
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for empty benchmark returns', () => {
      const result = engine.evaluate(makeInput({ benchmarkReturns: [] }));
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for insufficient data points', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [1.0, 2.0],
        benchmarkReturns: [1.0, 2.0],
      }));
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for null strategy returns', () => {
      const result = engine.evaluate(makeInput({ strategyReturns: null as any }));
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for null benchmark returns', () => {
      const result = engine.evaluate(makeInput({ benchmarkReturns: null as any }));
      expect(result.isValid).toBe(false);
    });
  });

  describe('valid data', () => {
    it('should produce valid result', () => {
      const result = engine.evaluate(makeInput());
      expect(result.isValid).toBe(true);
    });

    it('should calculate strategy return', () => {
      const result = engine.evaluate(makeInput());
      expect(typeof result.strategyReturn).toBe('number');
      expect(result.strategyReturn).not.toBeNaN();
    });

    it('should calculate benchmark return', () => {
      const result = engine.evaluate(makeInput());
      expect(typeof result.benchmarkReturn).toBe('number');
      expect(result.benchmarkReturn).not.toBeNaN();
    });

    it('should calculate sector return', () => {
      const result = engine.evaluate(makeInput());
      expect(typeof result.sectorReturn).toBe('number');
      expect(result.sectorReturn).not.toBeNaN();
    });
  });

  describe('excess return', () => {
    it('should be positive when strategy outperforms', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [2.0, 2.0, 2.0, 2.0, 2.0],
        benchmarkReturns: [1.0, 1.0, 1.0, 1.0, 1.0],
      }));
      expect(result.excessReturn).toBeGreaterThan(0);
    });

    it('should be negative when strategy underperforms', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [0.5, 0.5, 0.5, 0.5, 0.5],
        benchmarkReturns: [1.0, 1.0, 1.0, 1.0, 1.0],
      }));
      expect(result.excessReturn).toBeLessThan(0);
    });

    it('should equal strategy - benchmark', () => {
      const result = engine.evaluate(makeInput());
      expect(result.excessReturn).toBeCloseTo(result.strategyReturn - result.benchmarkReturn, 10);
    });
  });

  describe('beta', () => {
    it('should be positive when strategy and benchmark move together', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [1.0, 2.0, 1.5, 2.5, 1.0],
        benchmarkReturns: [0.5, 1.0, 0.7, 1.2, 0.5],
      }));
      expect(result.beta).toBeGreaterThan(0);
    });

    it('should be approximately 1 when moves match benchmark', () => {
      const data = [1.0, 2.0, -0.5, 1.5, 0.8];
      const result = engine.evaluate(makeInput({
        strategyReturns: [...data],
        benchmarkReturns: [...data],
      }));
      expect(result.beta).toBeCloseTo(1, 1);
    });

    it('should be 0 for unrelated returns', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [1.0, -1.0, 1.0, -1.0, 1.0],
        benchmarkReturns: [1.0, 1.0, 1.0, 1.0, 1.0],
      }));
      expect(result.beta).toBe(0);
    });
  });

  describe('alpha', () => {
    it('should be positive when strategy beats risk-adjusted benchmark', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [3.0, 3.0, 3.0, 3.0, 3.0],
        benchmarkReturns: [1.0, 1.0, 1.0, 1.0, 1.0],
      }));
      expect(result.alpha).toBeGreaterThan(0);
    });

    it('should be negative when strategy underperforms', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [0.5, 0.5, 0.5, 0.5, 0.5],
        benchmarkReturns: [2.0, 2.0, 2.0, 2.0, 2.0],
      }));
      expect(result.alpha).toBeLessThan(0);
    });
  });

  describe('tracking error', () => {
    it('should be 0 when strategy matches benchmark exactly', () => {
      const data = [1.0, 2.0, -0.5, 1.5, 0.8];
      const result = engine.evaluate(makeInput({
        strategyReturns: [...data],
        benchmarkReturns: [...data],
      }));
      expect(result.trackingError).toBe(0);
    });

    it('should be positive when strategy differs from benchmark', () => {
      const result = engine.evaluate(makeInput());
      expect(result.trackingError).toBeGreaterThan(0);
    });
  });

  describe('information ratio', () => {
    it('should be high when excess return is high and tracking error is low', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [3.0, 2.5, 3.5, 2.8, 3.2],
        benchmarkReturns: [1.0, 1.5, 0.8, 1.2, 1.0],
      }));
      expect(result.informationRatio).toBeGreaterThan(0);
    });

    it('should be 0 when tracking error is 0', () => {
      const data = [1.0, 2.0, -0.5, 1.5, 0.8];
      const result = engine.evaluate(makeInput({
        strategyReturns: [...data],
        benchmarkReturns: [...data],
      }));
      expect(result.informationRatio).toBe(0);
    });
  });

  describe('capture ratio', () => {
    it('should be 1 when strategy matches benchmark', () => {
      const data = [1.0, 2.0, -0.5, 1.5, 0.8];
      const result = engine.evaluate(makeInput({
        strategyReturns: [...data],
        benchmarkReturns: [...data],
      }));
      expect(result.captureRatio).toBeCloseTo(1, 5);
    });

    it('should be > 1 when strategy outperforms', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [2.0, 2.0, 2.0, 2.0, 2.0],
        benchmarkReturns: [1.0, 1.0, 1.0, 1.0, 1.0],
      }));
      expect(result.captureRatio).toBeGreaterThan(1);
    });

    it('should be < 1 when strategy underperforms', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [0.5, 0.5, 0.5, 0.5, 0.5],
        benchmarkReturns: [1.0, 1.0, 1.0, 1.0, 1.0],
      }));
      expect(result.captureRatio).toBeLessThan(1);
    });
  });

  describe('sector return', () => {
    it('should calculate sector return from data', () => {
      const result = engine.evaluate(makeInput());
      expect(result.sectorReturn).not.toBe(0);
    });

    it('should be 0 when no sector data', () => {
      const result = engine.evaluate(makeInput({ sectorReturns: [] }));
      expect(result.sectorReturn).toBe(0);
    });

    it('should be 0 when sector returns is null', () => {
      const result = engine.evaluate(makeInput({ sectorReturns: null as any }));
      expect(result.sectorReturn).toBe(0);
    });
  });

  describe('metadata', () => {
    it('should include data points info', () => {
      const result = engine.evaluate(makeInput());
      const meta = result.metadata as Record<string, unknown>;
      expect(meta.strategyDataPoints).toBe(10);
      expect(meta.benchmarkDataPoints).toBe(10);
    });

    it('should include risk-free rate', () => {
      const result = engine.evaluate(makeInput());
      const meta = result.metadata as Record<string, unknown>;
      expect(meta.riskFreeRate).toBe(0.15);
    });

    it('should include annualized returns', () => {
      const result = engine.evaluate(makeInput());
      const meta = result.metadata as Record<string, unknown>;
      expect(typeof meta.annualizedStrategy).toBe('number');
      expect(typeof meta.annualizedBenchmark).toBe('number');
    });
  });

  describe('config overrides', () => {
    it('should respect custom risk-free rate', () => {
      const engine2 = new BenchmarkEngine({ riskFreeRate: 0.05 });
      const result = engine2.evaluate(makeInput({
        strategyReturns: [1.0, 1.0, 1.0, 1.0, 1.0],
        benchmarkReturns: [1.0, 1.0, 1.0, 1.0, 1.0],
      }));
      const meta = result.metadata as Record<string, unknown>;
      expect(meta.riskFreeRate).toBe(0.05);
    });

    it('should respect custom minDataPoints', () => {
      const engine2 = new BenchmarkEngine({ minDataPoints: 20 });
      const result = engine2.evaluate(makeInput());
      expect(result.isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle all positive returns', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [1.0, 2.0, 3.0, 1.5, 2.5],
        benchmarkReturns: [0.5, 1.0, 1.5, 0.8, 1.2],
      }));
      expect(result.isValid).toBe(true);
      expect(result.excessReturn).toBeGreaterThan(0);
    });

    it('should handle all negative returns', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [-1.0, -2.0, -0.5, -1.5, -0.8],
        benchmarkReturns: [-0.5, -1.0, -0.3, -0.8, -0.4],
      }));
      expect(result.isValid).toBe(true);
    });

    it('should handle mixed returns', () => {
      const result = engine.evaluate(makeInput());
      expect(result.isValid).toBe(true);
    });

    it('should handle exactly minDataPoints', () => {
      const result = engine.evaluate(makeInput({
        strategyReturns: [1.0, 2.0, -0.5, 1.0, 0.8],
        benchmarkReturns: [0.5, 1.5, -0.3, 0.8, 0.6],
      }));
      expect(result.isValid).toBe(true);
    });

    it('should produce deterministic results', () => {
      const input = makeInput();
      const r1 = engine.evaluate(input);
      const r2 = engine.evaluate(input);
      expect(r1.strategyReturn).toBe(r2.strategyReturn);
      expect(r1.beta).toBe(r2.beta);
      expect(r1.alpha).toBe(r2.alpha);
    });
  });
});
