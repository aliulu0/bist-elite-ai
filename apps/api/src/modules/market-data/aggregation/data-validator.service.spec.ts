import { DataValidator } from './data-validator.service';

describe('DataValidator', () => {
  let validator: DataValidator;

  beforeEach(() => {
    validator = new DataValidator();
  });

  describe('validateCompany', () => {
    it('should return no warnings for valid data', () => {
      const warnings = validator.validateCompany(
        { symbol: 'THYAO', name: 'Turkish Airlines', marketCap: 100000000, sector: 'Aviation' },
        'fintables',
      );
      expect(warnings).toHaveLength(0);
    });

    it('should warn on missing symbol', () => {
      const warnings = validator.validateCompany({ name: 'Turkish Airlines' }, 'fintables');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].field).toBe('symbol');
      expect(warnings[0].severity).toBe('error');
    });

    it('should warn on missing name', () => {
      const warnings = validator.validateCompany({ symbol: 'THYAO' }, 'fintables');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].field).toBe('name');
      expect(warnings[0].severity).toBe('warning');
    });

    it('should warn on negative market cap', () => {
      const warnings = validator.validateCompany(
        { symbol: 'THYAO', name: 'THY', marketCap: -100 },
        'fintables',
      );
      expect(warnings.some((w) => w.field === 'marketCap')).toBe(true);
    });

    it('should warn on Unknown sector', () => {
      const warnings = validator.validateCompany(
        { symbol: 'THYAO', name: 'THY', sector: 'Unknown' },
        'fintables',
      );
      expect(warnings.some((w) => w.field === 'sector' && w.severity === 'info')).toBe(true);
    });

    it('should warn on future timestamp', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const warnings = validator.validateCompany(
        { symbol: 'THYAO', name: 'THY', lastUpdated: futureDate },
        'fintables',
      );
      expect(warnings.some((w) => w.field === 'lastUpdated' && w.severity === 'warning')).toBe(true);
    });

    it('should warn on invalid timestamp', () => {
      const warnings = validator.validateCompany(
        { symbol: 'THYAO', name: 'THY', lastUpdated: 'not-a-date' },
        'fintables',
      );
      expect(warnings.some((w) => w.field === 'lastUpdated' && w.severity === 'error')).toBe(true);
    });
  });

  describe('validateFinancialStatement', () => {
    it('should return no warnings for valid data', () => {
      const warnings = validator.validateFinancialStatement(
        { symbol: 'THYAO', period: '2025Q4', revenue: 1000000, netIncome: 50000 },
        'fintables',
      );
      expect(warnings).toHaveLength(0);
    });

    it('should warn on missing symbol', () => {
      const warnings = validator.validateFinancialStatement({ revenue: 1000 }, 'fintables');
      expect(warnings.some((w) => w.field === 'symbol')).toBe(true);
    });

    it('should warn on negative revenue', () => {
      const warnings = validator.validateFinancialStatement(
        { symbol: 'THYAO', revenue: -1000 },
        'fintables',
      );
      expect(warnings.some((w) => w.field === 'revenue' && w.severity === 'error')).toBe(true);
    });

    it('should warn on net income exceeding 2x revenue', () => {
      const warnings = validator.validateFinancialStatement(
        { symbol: 'THYAO', revenue: 100, netIncome: 300 },
        'fintables',
      );
      expect(warnings.some((w) => w.field === 'netIncome')).toBe(true);
    });
  });

  describe('validateBalanceSheet', () => {
    it('should return no warnings for valid data', () => {
      const warnings = validator.validateBalanceSheet(
        { symbol: 'THYAO', totalAssets: 500000, equity: 200000 },
        'fintables',
      );
      expect(warnings).toHaveLength(0);
    });

    it('should warn on negative total assets', () => {
      const warnings = validator.validateBalanceSheet(
        { symbol: 'THYAO', totalAssets: -1000 },
        'fintables',
      );
      expect(warnings.some((w) => w.field === 'totalAssets' && w.severity === 'error')).toBe(true);
    });

    it('should warn on equity exceeding 2x total assets', () => {
      const warnings = validator.validateBalanceSheet(
        { symbol: 'THYAO', totalAssets: 100, equity: 300 },
        'fintables',
      );
      expect(warnings.some((w) => w.field === 'equity')).toBe(true);
    });
  });

  describe('validateIncomeStatement', () => {
    it('should return no warnings for valid data', () => {
      const warnings = validator.validateIncomeStatement(
        { symbol: 'THYAO', revenue: 500000, netProfit: 25000 },
        'fintables',
      );
      expect(warnings).toHaveLength(0);
    });

    it('should warn on negative revenue', () => {
      const warnings = validator.validateIncomeStatement(
        { symbol: 'THYAO', revenue: -1000 },
        'fintables',
      );
      expect(warnings.some((w) => w.field === 'revenue' && w.severity === 'error')).toBe(true);
    });

    it('should warn on net profit exceeding 2x revenue', () => {
      const warnings = validator.validateIncomeStatement(
        { symbol: 'THYAO', revenue: 100, netProfit: 300 },
        'fintables',
      );
      expect(warnings.some((w) => w.field === 'netProfit')).toBe(true);
    });
  });

  describe('validateCashFlow', () => {
    it('should return no warnings for valid data', () => {
      const warnings = validator.validateCashFlow(
        { symbol: 'THYAO', operatingCashFlow: 50000 },
        'fintables',
      );
      expect(warnings).toHaveLength(0);
    });

    it('should warn on missing symbol', () => {
      const warnings = validator.validateCashFlow({}, 'fintables');
      expect(warnings.some((w) => w.field === 'symbol')).toBe(true);
    });
  });

  describe('validateSector', () => {
    it('should return no warnings for valid data', () => {
      const warnings = validator.validateSector(
        { symbol: 'THYAO', sector: 'Aviation' },
        'fintables',
      );
      expect(warnings).toHaveLength(0);
    });

    it('should warn on missing sector', () => {
      const warnings = validator.validateSector({ symbol: 'THYAO' }, 'fintables');
      expect(warnings.some((w) => w.field === 'sector' && w.severity === 'error')).toBe(true);
    });

    it('should warn on Unknown sector', () => {
      const warnings = validator.validateSector(
        { symbol: 'THYAO', sector: 'Unknown' },
        'fintables',
      );
      expect(warnings.some((w) => w.field === 'sector' && w.severity === 'info')).toBe(true);
    });
  });

  describe('deduplicateDisclosures', () => {
    it('should remove duplicate disclosures by title+date', () => {
      const disclosures = [
        { title: 'Important Notice', date: '2026-01-01', source: 'kap' },
        { title: 'Important Notice', date: '2026-01-01', source: 'fintables' },
        { title: 'Different Notice', date: '2026-01-02', source: 'kap' },
      ];
      const result = validator.deduplicateDisclosures(disclosures);
      expect(result).toHaveLength(2);
    });

    it('should keep same title with different dates', () => {
      const disclosures = [
        { title: 'Notice', date: '2026-01-01', source: 'kap' },
        { title: 'Notice', date: '2026-01-02', source: 'kap' },
      ];
      const result = validator.deduplicateDisclosures(disclosures);
      expect(result).toHaveLength(2);
    });

    it('should handle empty input', () => {
      expect(validator.deduplicateDisclosures([])).toEqual([]);
    });
  });

  describe('deduplicateFinancialStatements', () => {
    it('should remove duplicate statements by symbol+period', () => {
      const statements = [
        { symbol: 'THYAO', period: '2025Q4', source: 'kap' },
        { symbol: 'THYAO', period: '2025Q4', source: 'fintables' },
        { symbol: 'THYAO', period: '2025Q3', source: 'kap' },
      ];
      const result = validator.deduplicateFinancialStatements(statements);
      expect(result).toHaveLength(2);
    });

    it('should handle empty input', () => {
      expect(validator.deduplicateFinancialStatements([])).toEqual([]);
    });
  });
});
