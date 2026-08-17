import { Test, TestingModule } from '@nestjs/testing';
import { FinancialRulesEngine } from './financial-rules-engine.service';
import { FinancialData } from './rule.types';
import {
  PriceToBookRule,
  EvToEbitdaRule,
  NetProfitGrowthRule,
  EquityGrowthRule,
  DebtRatioRule,
  SectorComparisonRule,
} from './rules';

describe('FinancialRulesEngine', () => {
  let engine: FinancialRulesEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialRulesEngine,
        PriceToBookRule,
        EvToEbitdaRule,
        NetProfitGrowthRule,
        EquityGrowthRule,
        DebtRatioRule,
        SectorComparisonRule,
      ],
    }).compile();

    engine = module.get(FinancialRulesEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('evaluate', () => {
    const completeData: FinancialData = {
      symbol: 'THYAO',
      priceToBook: 1.4,
      enterpriseValueToEBITDA: 9.5,
      netProfit: 32000000000,
      netProfitPrevious: 25000000000,
      equity: 180000000000,
      equityPrevious: 160000000000,
      totalDebt: 100000000000,
      totalAssets: 280000000000,
      sector: 'Ulaştırma',
      sectorAverages: {
        priceToBook: 1.5,
        enterpriseValueToEBITDA: 10,
        debtRatio: 0.36,
      },
    };

    it('should return all 6 rules', () => {
      const result = engine.evaluate(completeData);
      expect(result.symbol).toBe('THYAO');
      expect(result.rules).toHaveLength(6);
    });

    it('should return correct rule ids', () => {
      const result = engine.evaluate(completeData);
      const ids = result.rules.map((r) => r.id);
      expect(ids).toEqual([
        'price_to_book',
        'ev_to_ebitda',
        'net_profit_growth',
        'equity_growth',
        'debt_ratio',
        'sector_comparison',
      ]);
    });

    it('should PASS all rules with good data', () => {
      const result = engine.evaluate(completeData);
      const statuses = result.rules.map((r) => r.status);
      expect(statuses.every((s) => s === 'PASS')).toBe(true);
    });

    it('should FAIL price_to_book when value is high', () => {
      const data: FinancialData = { ...completeData, priceToBook: 5.0 };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'price_to_book');
      expect(rule!.status).toBe('FAIL');
    });

    it('should WARNING price_to_book when value is moderate', () => {
      const data: FinancialData = { ...completeData, priceToBook: 2.0 };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'price_to_book');
      expect(rule!.status).toBe('WARNING');
    });

    it('should mark price_to_book UNAVAILABLE when value is null', () => {
      const data: FinancialData = { ...completeData, priceToBook: null };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'price_to_book');
      expect(rule!.status).toBe('UNAVAILABLE');
    });

    it('should FAIL ev_to_ebitda when value is high', () => {
      const data: FinancialData = { ...completeData, enterpriseValueToEBITDA: 20 };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'ev_to_ebitda');
      expect(rule!.status).toBe('FAIL');
    });

    it('should WARNING ev_to_ebitda when value is moderate', () => {
      const data: FinancialData = { ...completeData, enterpriseValueToEBITDA: 12 };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'ev_to_ebitda');
      expect(rule!.status).toBe('WARNING');
    });

    it('should PASS net_profit_growth when growth is positive', () => {
      const result = engine.evaluate(completeData);
      const rule = result.rules.find((r) => r.id === 'net_profit_growth');
      expect(rule!.status).toBe('PASS');
      expect(rule!.value).toBeCloseTo(28);
    });

    it('should FAIL net_profit_growth when growth is negative', () => {
      const data: FinancialData = {
        ...completeData,
        netProfit: 20000000000,
        netProfitPrevious: 25000000000,
      };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'net_profit_growth');
      expect(rule!.status).toBe('FAIL');
    });

    it('should mark net_profit_growth UNAVAILABLE when data is missing', () => {
      const data: FinancialData = { ...completeData, netProfit: null, netProfitPrevious: null };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'net_profit_growth');
      expect(rule!.status).toBe('UNAVAILABLE');
    });

    it('should PASS equity_growth when growth is positive', () => {
      const result = engine.evaluate(completeData);
      const rule = result.rules.find((r) => r.id === 'equity_growth');
      expect(rule!.status).toBe('PASS');
      expect(rule!.value).toBeCloseTo(12.5);
    });

    it('should FAIL equity_growth when growth is negative', () => {
      const data: FinancialData = {
        ...completeData,
        equity: 140000000000,
        equityPrevious: 160000000000,
      };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'equity_growth');
      expect(rule!.status).toBe('FAIL');
    });

    it('should PASS debt_ratio when ratio is low', () => {
      const result = engine.evaluate(completeData);
      const rule = result.rules.find((r) => r.id === 'debt_ratio');
      expect(rule!.status).toBe('PASS');
      expect(rule!.value).toBeCloseTo(100 / 280);
    });

    it('should FAIL debt_ratio when ratio is high', () => {
      const data: FinancialData = {
        ...completeData,
        totalDebt: 250000000000,
        totalAssets: 275000000000,
      };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'debt_ratio');
      expect(rule!.status).toBe('FAIL');
    });

    it('should mark debt_ratio UNAVAILABLE when data is missing', () => {
      const data: FinancialData = { ...completeData, totalDebt: null, totalAssets: null };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'debt_ratio');
      expect(rule!.status).toBe('UNAVAILABLE');
    });

    it('should PASS sector_comparison when close to averages', () => {
      const result = engine.evaluate(completeData);
      const rule = result.rules.find((r) => r.id === 'sector_comparison');
      expect(rule!.status).toBe('PASS');
    });

    it('should FAIL sector_comparison when far from averages', () => {
      const data: FinancialData = {
        ...completeData,
        priceToBook: 5.0,
        enterpriseValueToEBITDA: 25,
        totalDebt: 250000000000,
      };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'sector_comparison');
      expect(rule!.status).toBe('FAIL');
    });

    it('should mark sector_comparison UNAVAILABLE when sector data is missing', () => {
      const data: FinancialData = { ...completeData, sector: null, sectorAverages: undefined };
      const result = engine.evaluate(data);
      const rule = result.rules.find((r) => r.id === 'sector_comparison');
      expect(rule!.status).toBe('UNAVAILABLE');
    });

    it('should handle all null data gracefully', () => {
      const data: FinancialData = {
        symbol: 'TEST',
        priceToBook: null,
        enterpriseValueToEBITDA: null,
        netProfit: null,
        netProfitPrevious: null,
        equity: null,
        equityPrevious: null,
        totalDebt: null,
        totalAssets: null,
        sector: null,
      };
      const result = engine.evaluate(data);
      expect(result.rules).toHaveLength(6);
      result.rules.forEach((rule) => {
        expect(rule.status).toBe('UNAVAILABLE');
        expect(rule.id).toBeDefined();
        expect(rule.name).toBeDefined();
        expect(rule.reason).toBeDefined();
      });
    });
  });
});
