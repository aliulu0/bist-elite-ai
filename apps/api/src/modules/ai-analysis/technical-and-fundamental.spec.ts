import { TechnicalAnalysisHandler } from './modules/technical-analysis.handler';
import { FundamentalAnalysisHandler } from './modules/fundamental-analysis.handler';
import { buildFullInput, buildCompany, buildIncome, buildFinancials, buildBalance, buildCash } from './test-helpers';

describe('TechnicalAnalysisHandler', () => {
  const handler = new TechnicalAnalysisHandler();

  it('should have correct name and weight', () => {
    expect(handler.name).toBe('technical');
    expect(handler.weight).toBe(12);
    expect(handler.enabled).toBe(true);
  });

  it('should return valid ModuleResult for full input', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.module).toBe('technical');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.explanation).toBeTruthy();
  });

  it('should handle large-cap stocks', async () => {
    const input = { ...buildFullInput(), company: buildCompany({ marketCap: 50_000_000_000 }) };
    const result = await handler.analyze(input);
    expect(result.strengths.some((s: string) => s.includes('Large-cap'))).toBe(true);
    expect(result.metrics.marketCap).toBe(50_000_000_000);
  });

  it('should handle small-cap stocks', async () => {
    const input = { ...buildFullInput(), company: buildCompany({ marketCap: 200_000_000 }) };
    const result = await handler.analyze(input);
    expect(result.weaknesses.some((w: string) => w.includes('Small-cap'))).toBe(true);
    expect(result.risks.some((r: string) => r.includes('liquidity'))).toBe(true);
  });

  it('should handle zero market cap', async () => {
    const input = { ...buildFullInput(), company: buildCompany({ marketCap: 0 }) };
    const result = await handler.analyze(input);
    expect(result.warnings.some((w: string) => w.includes('Market cap'))).toBe(true);
  });

  it('should score profit margin from financials', async () => {
    const input = { ...buildFullInput(), financials: buildFinancials({ revenue: 1000, netIncome: 200 }) };
    const result = await handler.analyze(input);
    expect(result.metrics.profitMargin).toBe(20);
    expect(result.strengths.some((s: string) => s.includes('profit margin'))).toBe(true);
  });

  it('should handle negative profit margin', async () => {
    const input = { ...buildFullInput(), financials: buildFinancials({ revenue: 1000, netIncome: -100 }) };
    const result = await handler.analyze(input);
    expect(result.metrics.profitMargin).toBe(-10);
    expect(result.weaknesses.some((w: string) => w.includes('Negative profit margin'))).toBe(true);
  });
});

describe('FundamentalAnalysisHandler', () => {
  const handler = new FundamentalAnalysisHandler();

  it('should have correct name and weight', () => {
    expect(handler.name).toBe('fundamental');
    expect(handler.weight).toBe(12);
  });

  it('should return valid ModuleResult for full input', async () => {
    const result = await handler.analyze(buildFullInput());
    expect(result.module).toBe('fundamental');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.metrics.grossMargin).toBeDefined();
    expect(result.metrics.netMargin).toBeDefined();
  });

  it('should return 0 score when no financial data', async () => {
    const result = await handler.analyze({ company: buildCompany() });
    expect(result.score).toBe(0);
    expect(result.confidence).toBe(0);
  });

  it('should detect high gross margin', async () => {
    const input = { ...buildFullInput(), incomeStatement: buildIncome({ revenue: 1000, grossProfit: 400 }) };
    const result = await handler.analyze(input);
    expect(result.metrics.grossMargin).toBe(40);
    expect(result.strengths.some((s: string) => s.includes('gross margin'))).toBe(true);
  });

  it('should detect low gross margin', async () => {
    const input = { ...buildFullInput(), incomeStatement: buildIncome({ revenue: 1000, grossProfit: 100 }) };
    const result = await handler.analyze(input);
    expect(result.metrics.grossMargin).toBe(10);
    expect(result.weaknesses.some((w: string) => w.includes('Low gross margin'))).toBe(true);
  });

  it('should detect negative net profit', async () => {
    const input = { ...buildFullInput(), incomeStatement: buildIncome({ revenue: 1000, netProfit: -50 }) };
    const result = await handler.analyze(input);
    expect(result.metrics.netMargin).toBe(-5);
    expect(result.weaknesses.some((w: string) => w.includes('Negative net profit'))).toBe(true);
  });

  it('should detect high debt ratio', async () => {
    const input = { ...buildFullInput(), balanceSheet: buildBalance({ totalAssets: 1000, totalDebt: 800 }) };
    const result = await handler.analyze(input);
    expect(result.metrics.debtRatio).toBe(0.8);
    expect(result.weaknesses.some((w: string) => w.includes('debt-to-asset'))).toBe(true);
  });

  it('should detect positive free cash flow', async () => {
    const input = { ...buildFullInput(), cashFlow: buildCash({ freeCashFlow: 500000 }) };
    const result = await handler.analyze(input);
    expect(result.strengths.some((s: string) => s.includes('free cash flow'))).toBe(true);
  });

  it('should detect negative free cash flow', async () => {
    const input = { ...buildFullInput(), cashFlow: buildCash({ freeCashFlow: -500000 }) };
    const result = await handler.analyze(input);
    expect(result.weaknesses.some((w: string) => w.includes('Negative free cash flow'))).toBe(true);
  });

  it('should increase confidence with more data', async () => {
    const withAll = await handler.analyze(buildFullInput());
    const withOnlyIncome = await handler.analyze({ company: buildCompany(), incomeStatement: buildIncome() });
    expect(withAll.confidence).toBeGreaterThanOrEqual(withOnlyIncome.confidence);
  });
});
