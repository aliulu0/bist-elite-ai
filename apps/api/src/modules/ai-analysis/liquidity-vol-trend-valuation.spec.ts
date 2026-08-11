import { LiquidityAnalysisHandler } from './modules/liquidity-analysis.handler';
import { VolatilityAnalysisHandler } from './modules/volatility-analysis.handler';
import { TrendAnalysisHandler } from './modules/trend-analysis.handler';
import { ValuationAnalysisHandler } from './modules/valuation-analysis.handler';
import { buildFullInput, buildCompany, buildBalance } from './test-helpers';

describe('LiquidityAnalysisHandler', () => {
  const handler = new LiquidityAnalysisHandler();

  it('should have correct name and weight', () => {
    expect(handler.name).toBe('liquidity');
    expect(handler.weight).toBe(8);
  });

  it('should return valid ModuleResult', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.module).toBe('liquidity');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should return low score when no data', async () => {
    const result = await handler.analyze({ company: buildCompany() });
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should detect good liquidity', async () => {
    const input = {
      ...buildFullInput(),
      balanceSheet: buildBalance({ currentAssets: 1000, currentLiabilities: 500 }),
    };
    const result = await handler.analyze(input);
    expect(result.metrics.currentRatio).toBe(2);
    expect(result.score).toBeGreaterThan(50);
  });
});

describe('VolatilityAnalysisHandler', () => {
  const handler = new VolatilityAnalysisHandler();

  it('should have correct name and weight', () => {
    expect(handler.name).toBe('volatility');
    expect(handler.weight).toBe(8);
  });

  it('should return valid ModuleResult', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.module).toBe('volatility');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('TrendAnalysisHandler', () => {
  const handler = new TrendAnalysisHandler();

  it('should have correct name and weight', () => {
    expect(handler.name).toBe('trend');
    expect(handler.weight).toBe(10);
  });

  it('should return valid ModuleResult', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.module).toBe('trend');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should use sector data', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.explanation).toBeTruthy();
  });
});

describe('ValuationAnalysisHandler', () => {
  const handler = new ValuationAnalysisHandler();

  it('should have correct name and weight', () => {
    expect(handler.name).toBe('valuation');
    expect(handler.weight).toBe(10);
  });

  it('should return valid ModuleResult', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.module).toBe('valuation');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should use balance sheet for valuation', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.metrics.netAssetValue).toBeDefined();
  });
});
