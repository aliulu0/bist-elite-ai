import { Test, TestingModule } from '@nestjs/testing';
import { FundamentalValidationService } from './fundamental-validation.service';
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
import { FundamentalProviderInputs } from '../analysis-pipeline/fundamental.mapper';

const THYAO_PROFILE = {
  symbol: 'THYAO',
  companyName: 'TÜRK HAVA YOLLARI',
  sector: 'Ulaştırma',
  marketCap: 185000000000,
  lastUpdated: '2025-01-01',
  source: 'fintables',
};

const THYAO_RATIOS = {
  symbol: 'THYAO',
  priceToBook: 1.4,
  enterpriseValueToEBITDA: 9.5,
  lastUpdated: '2025-01-01',
  source: 'fintables',
};

const THYAO_BALANCE = {
  symbol: 'THYAO',
  equity: 180000000000,
  totalDebt: 100000000000,
  totalAssets: 280000000000,
  sharesOutstanding: 14000000000,
  lastUpdated: '2025-01-01',
  source: 'fintables',
};

const THYAO_INCOME = {
  symbol: 'THYAO',
  netProfit: 32000000000,
  lastUpdated: '2025-01-01',
  source: 'fintables',
};

describe('FundamentalValidationService', () => {
  let service: FundamentalValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FundamentalValidationService,
        FinancialRulesEngine,
        PriceToBookRule,
        EvToEbitdaRule,
        NetProfitGrowthRule,
        EquityGrowthRule,
        DebtRatioRule,
        SectorComparisonRule,
      ],
    }).compile();

    service = module.get(FundamentalValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate - complete data', () => {
    const data: FinancialData = {
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

    it('exposes pdDd with thresholds and AVAILABLE status', () => {
      const report = service.validate(data);
      expect(report.pdDd.availability).toBe('AVAILABLE');
      expect(report.pdDd.status).toBe('PASS');
      expect(report.pdDd.value).toBe(1.4);
      expect(report.pdDd.thresholds).toEqual({ pass: 1.5, warning: 3.0 });
    });

    it('exposes fdFavok with thresholds', () => {
      const report = service.validate(data);
      expect(report.fdFavok.availability).toBe('AVAILABLE');
      expect(report.fdFavok.status).toBe('PASS');
      expect(report.fdFavok.thresholds).toEqual({ pass: 10, warning: 15 });
    });

    it('classifies netProfitGrowth as PASS when positive', () => {
      const report = service.validate(data);
      expect(report.netProfitGrowth.availability).toBe('AVAILABLE');
      expect(report.netProfitGrowth.status).toBe('PASS');
      expect(report.netProfitGrowth.value).toBeCloseTo(28);
    });

    it('classifies debtRatio as PASS when low', () => {
      const report = service.validate(data);
      expect(report.debtRatio.availability).toBe('AVAILABLE');
      expect(report.debtRatio.status).toBe('PASS');
    });

    it('classifies sector comparison as PASS when close to averages', () => {
      const report = service.validate(data);
      expect(report.sectorRelative.availability).toBe('AVAILABLE');
      expect(report.sectorRelative.status).toBe('PASS');
    });

    it('produces overallStatus PASS and a non-zero score', () => {
      const report = service.validate(data);
      expect(report.overallStatus).toBe('PASS');
      expect(report.score).toBe(100);
    });
  });

  describe('validate - threshold boundaries', () => {
    it('PD/DD <= 1.5 passes, > 1.5 && <= 3.0 watches, > 3.0 fails', () => {
      const base: FinancialData = {
        symbol: 'X',
        priceToBook: 1.4,
        enterpriseValueToEBITDA: 9,
        netProfit: 100,
        netProfitPrevious: 100,
        equity: 100,
        equityPrevious: 100,
        totalDebt: 10,
        totalAssets: 100,
        sector: 'S',
        sectorAverages: { priceToBook: 2, enterpriseValueToEBITDA: 10, debtRatio: 0.5 },
      };

      expect(service.validate({ ...base, priceToBook: 1.5 }).pdDd.status).toBe('PASS');
      expect(service.validate({ ...base, priceToBook: 1.6 }).pdDd.status).toBe('WATCH');
      expect(service.validate({ ...base, priceToBook: 3.0 }).pdDd.status).toBe('WATCH');
      expect(service.validate({ ...base, priceToBook: 3.1 }).pdDd.status).toBe('FAIL');
    });

    it('FD/FAVÖK thresholds 10/15', () => {
      const base: FinancialData = {
        symbol: 'X',
        priceToBook: 1,
        enterpriseValueToEBITDA: 9,
        netProfit: 100,
        netProfitPrevious: 100,
        equity: 100,
        equityPrevious: 100,
        totalDebt: 10,
        totalAssets: 100,
        sector: 'S',
        sectorAverages: { priceToBook: 1, enterpriseValueToEBITDA: 9, debtRatio: 0.1 },
      };
      expect(service.validate({ ...base, enterpriseValueToEBITDA: 10 }).fdFavok.status).toBe('PASS');
      expect(service.validate({ ...base, enterpriseValueToEBITDA: 11 }).fdFavok.status).toBe('WATCH');
      expect(service.validate({ ...base, enterpriseValueToEBITDA: 15 }).fdFavok.status).toBe('WATCH');
      expect(service.validate({ ...base, enterpriseValueToEBITDA: 16 }).fdFavok.status).toBe('FAIL');
    });
  });

  describe('validate - missing data handling (UNKNOWN, no fabrication)', () => {
    const empty: FinancialData = {
      symbol: 'THYAO',
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

    it('marks every filter UNAVAILABLE with UNKNOWN status', () => {
      const report = service.validate(empty);
      for (const f of [report.pdDd, report.fdFavok, report.netProfitGrowth, report.equityGrowth, report.debtRatio, report.sectorRelative]) {
        expect(f.availability).toBe('UNAVAILABLE');
        expect(f.status).toBe('UNKNOWN');
        expect(f.value).toBeNull();
      }
    });

    it('does NOT fabricate a value for missing metrics', () => {
      const report = service.validate(empty);
      expect(report.pdDd.value).toBeNull();
      expect(report.fdFavok.value).toBeNull();
      expect(report.netProfitGrowth.value).toBeNull();
    });

    it('distinguishes UNKNOWN (missing) from FAIL (available but bad)', () => {
      const missing = service.validate(empty);
      expect(missing.pdDd.status).toBe('UNKNOWN');

      const bad: FinancialData = { ...empty, priceToBook: 5.0 };
      const available = service.validate(bad);
      expect(available.pdDd.availability).toBe('AVAILABLE');
      expect(available.pdDd.status).toBe('FAIL');
    });

    it('overallStatus is UNKNOWN only when all data is missing', () => {
      expect(service.validate(empty).overallStatus).toBe('UNKNOWN');
    });

    it('score is 0 when no data available', () => {
      expect(service.validate(empty).score).toBe(0);
    });

    it('does not gate the stock when data is unavailable', () => {
      const report = service.validate(empty);
      expect(report.overallStatus).not.toBe('FAIL');
    });
  });

  describe('validate - mixed availability', () => {
    it('computes overallStatus from only the available filters', () => {
      const data: FinancialData = {
        symbol: 'X',
        priceToBook: 1.2,
        enterpriseValueToEBITDA: null,
        netProfit: 110,
        netProfitPrevious: 100,
        equity: 110,
        equityPrevious: 100,
        totalDebt: 10,
        totalAssets: 100,
        sector: 'S',
        sectorAverages: { priceToBook: 1.2, enterpriseValueToEBITDA: 10, debtRatio: 0.1 },
      };
      const report = service.validate(data);
      expect(report.pdDd.availability).toBe('AVAILABLE');
      expect(report.fdFavok.availability).toBe('UNAVAILABLE');
      expect(report.fdFavok.status).toBe('UNKNOWN');
      expect(report.overallStatus).toBe('PASS');
      expect(report.pdDd.status).toBe('PASS');
    });

    it('FAILs overall when any available filter fails', () => {
      const data: FinancialData = {
        symbol: 'X',
        priceToBook: 1.2,
        enterpriseValueToEBITDA: 25,
        netProfit: 110,
        netProfitPrevious: 100,
        equity: 110,
        equityPrevious: 100,
        totalDebt: 10,
        totalAssets: 100,
        sector: 'S',
        sectorAverages: { priceToBook: 1.2, enterpriseValueToEBITDA: 10, debtRatio: 0.1 },
      };
      const report = service.validate(data);
      expect(report.fdFavok.status).toBe('FAIL');
      expect(report.overallStatus).toBe('FAIL');
    });
  });

  describe('fromProviderInputs', () => {
    it('builds a report from provider-shaped inputs with full data', () => {
      const inputs: FundamentalProviderInputs = {
        profile: THYAO_PROFILE,
        ratios: THYAO_RATIOS,
        balance: THYAO_BALANCE,
        income: THYAO_INCOME,
        sector: { symbol: 'THYAO', sector: 'Ulaştırma', lastUpdated: '2025-01-01', source: 'fintables' },
      };
      const report = service.fromProviderInputs('THYAO', inputs);
      expect(report.symbol).toBe('THYAO');
      expect(report.pdDd).toBeDefined();
      expect(report.fdFavok).toBeDefined();
      expect(report.netProfitGrowth.availability).toBe('UNAVAILABLE');
      expect(report.netProfitGrowth.status).toBe('UNKNOWN');
    });

    it('returns UNKNOWN across the board when provider returns null fields', () => {
      const inputs: FundamentalProviderInputs = {
        profile: { symbol: 'X', companyName: 'X', sector: 'Unknown', marketCap: 0, lastUpdated: '', source: 'none' },
        ratios: { symbol: 'X', priceToBook: null, enterpriseValueToEBITDA: null, lastUpdated: '', source: 'none' },
        balance: { symbol: 'X', equity: null, totalDebt: null, totalAssets: null, sharesOutstanding: null, lastUpdated: '', source: 'none' },
        income: { symbol: 'X', netProfit: null, lastUpdated: '', source: 'none' },
        sector: null,
      };
      const report = service.fromProviderInputs('X', inputs);
      expect(report.pdDd.status).toBe('UNKNOWN');
      expect(report.fdFavok.status).toBe('UNKNOWN');
      expect(report.netProfitGrowth.status).toBe('UNKNOWN');
      expect(report.overallStatus).toBe('UNKNOWN');
      expect(report.score).toBe(0);
    });
  });

  describe('reasons', () => {
    it('produces Turkish reasons with UNKNOWN for missing, PASS/WATCH/FAIL otherwise', () => {
      const data: FinancialData = {
        symbol: 'THYAO',
        priceToBook: 1.2,
        enterpriseValueToEBITDA: 20,
        netProfit: null,
        netProfitPrevious: null,
        equity: 100,
        equityPrevious: 100,
        totalDebt: 10,
        totalAssets: 100,
        sector: 'S',
        sectorAverages: { priceToBook: 1.2, enterpriseValueToEBITDA: 10, debtRatio: 0.1 },
      };
      const report = service.validate(data);
      expect(report.reasons).toEqual(expect.arrayContaining([expect.stringContaining('PD/DD: geçti')]));
      expect(report.reasons).toEqual(expect.arrayContaining([expect.stringContaining('FD/FAVÖK: başarısız')]));
      expect(report.reasons.some((r) => r.includes('veri yok (UNKNOWN)') && r.includes('Net Kar'))).toBe(true);
      expect(report.reasons).toEqual(expect.arrayContaining([expect.stringContaining('Sermaye Büyüme')]));
      expect(report.reasons).toEqual(expect.arrayContaining([expect.stringContaining('Borç Oranı')]));
      expect(report.reasons).toEqual(expect.arrayContaining([expect.stringContaining('Sektöre Göre')]));
    });
  });
});
