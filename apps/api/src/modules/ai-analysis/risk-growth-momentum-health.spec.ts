import { RiskAnalysisHandler } from './modules/risk-analysis.handler';
import { GrowthAnalysisHandler } from './modules/growth-analysis.handler';
import { MomentumAnalysisHandler } from './modules/momentum-analysis.handler';
import { FinancialHealthHandler } from './modules/financial-health.handler';
import { buildFullInput, buildCompany, buildBalance, buildCash, buildIncome } from './test-helpers';

describe('RiskAnalysisHandler', () => {
  const handler = new RiskAnalysisHandler();

  it('should have correct name and weight', () => {
    expect(handler.name).toBe('risk');
    expect(handler.weight).toBe(10);
  });

  it('should return 50 with warning when no financial data', async () => {
    const result = await handler.analyze({ company: buildCompany() });
    expect(result.score).toBe(50);
    expect(result.warnings.some((w: string) => w.includes('No financial data'))).toBe(true);
  });

  it('should detect high debt risk', async () => {
    const input = {
      ...buildFullInput(),
      balanceSheet: buildBalance({
        totalAssets: 1000,
        totalDebt: 800,
        equity: 200,
        currentAssets: 100,
        currentLiabilities: 200,
      }),
    };
    const result = await handler.analyze(input);
    expect(result.risks.some((r: string) => r.includes('debt ratio'))).toBe(true);
  });

  it('should detect liquidity stress', async () => {
    const input = { ...buildFullInput(), balanceSheet: buildBalance({ currentAssets: 50, currentLiabilities: 100 }) };
    const result = await handler.analyze(input);
    expect(result.metrics.currentRatio).toBe(0.5);
    expect(result.risks.some((r: string) => r.includes('Current ratio'))).toBe(true);
  });

  it('should detect negative operating cash flow', async () => {
    const input = { ...buildFullInput(), cashFlow: buildCash({ operatingCashFlow: -100000 }) };
    const result = await handler.analyze(input);
    expect(result.risks.some((r: string) => r.includes('Negative operating cash flow'))).toBe(true);
  });

  it('should give high score for low risk inputs', async () => {
    const input = {
      ...buildFullInput(),
      balanceSheet: buildBalance({
        totalAssets: 2000,
        totalDebt: 200,
        equity: 1800,
        currentAssets: 1000,
        currentLiabilities: 500,
      }),
      incomeStatement: buildIncome({ revenue: 1000, netProfit: 200 }),
    };
    const result = await handler.analyze(input);
    expect(result.score).toBeGreaterThan(60);
  });

  it('should increase confidence with more data sources', async () => {
    const withAll = await handler.analyze(buildFullInput());
    const withOnlyBalance = await handler.analyze({ company: buildCompany(), balanceSheet: buildBalance() });
    expect(withAll.confidence).toBeGreaterThanOrEqual(withOnlyBalance.confidence);
  });
});

describe('GrowthAnalysisHandler', () => {
  const handler = new GrowthAnalysisHandler();

  it('should have correct name and weight', () => {
    expect(handler.name).toBe('growth');
    expect(handler.weight).toBe(10);
  });

  it('should return valid ModuleResult for full input', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.module).toBe('growth');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should return neutral score when no income statement', async () => {
    const result = await handler.analyze({ company: buildCompany() });
    expect(result.score).toBe(50);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should reward high margins', async () => {
    const input = {
      ...buildFullInput(),
      incomeStatement: buildIncome({ revenue: 1000, netProfit: 300, grossProfit: 500, operatingIncome: 400, ebitda: 450 }),
    };
    const result = await handler.analyze(input);
    expect(result.strengths.length).toBeGreaterThan(0);
  });
});

describe('MomentumAnalysisHandler', () => {
  const handler = new MomentumAnalysisHandler();

  it('should have correct name and weight', () => {
    expect(handler.name).toBe('momentum');
    expect(handler.weight).toBe(10);
  });

  it('should return valid ModuleResult', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.module).toBe('momentum');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should handle positive cash flow', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.strengths.length).toBeGreaterThan(0);
  });
});

describe('FinancialHealthHandler', () => {
  const handler = new FinancialHealthHandler();

  it('should have correct name and weight', () => {
    expect(handler.name).toBe('financialHealth');
    expect(handler.weight).toBe(10);
  });

  it('should return valid ModuleResult', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.module).toBe('financialHealth');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should return low score with warning when no data', async () => {
    const result = await handler.analyze({ company: buildCompany() });
    expect(result.score).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should evaluate current ratio', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.metrics.currentRatio).toBeDefined();
  });
});
