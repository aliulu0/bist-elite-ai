import { Test, TestingModule } from '@nestjs/testing';
import { SymbolRegistryService } from './symbol-registry.service';

describe('SymbolRegistryService', () => {
  let service: SymbolRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SymbolRegistryService],
    }).compile();

    service = module.get<SymbolRegistryService>(SymbolRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should contain every BIST pipeline symbol', () => {
    const symbols = service.getSymbols();
    for (const ticker of ['THYAO', 'GARAN', 'ASELS', 'BIMAS', 'KCHOL', 'EREGL', 'AKBNK']) {
      expect(symbols.map((s) => s.canonicalTicker)).toContain(ticker);
    }
  });

  it('should map every active symbol to yahoo and fintables tickers', () => {
    for (const entry of service.getActiveSymbols()) {
      expect(entry.providers.yahoo).toBe(`${entry.canonicalTicker}.IS`);
      expect(entry.providers.fintables).toBe(entry.canonicalTicker);
    }
  });

  it('should resolve canonical ticker from provider ticker', () => {
    expect(service.getCanonicalTicker('yahoo', 'ASELS.IS')).toBe('ASELS');
    expect(service.getCanonicalTicker('fintables', 'ASELS')).toBe('ASELS');
    expect(service.getCanonicalTicker('yahoo', 'BIMAS.IS')).toBe('BIMAS');
  });

  it('should return known ISINs', () => {
    expect(service.getIsin('GARAN')).toBe('TRAGARAN91N1');
    expect(service.getIsin('THYAO')).toBe('TRATHYAO91M5');
  });

  it('should group symbols by sector', () => {
    const banks = service.getSymbolsBySector('financials');
    expect(banks.map((s) => s.canonicalTicker)).toEqual(
      expect.arrayContaining(['AKBNK', 'GARAN', 'ISCTR']),
    );
  });

  it('should treat TRAK as inactive', () => {
    expect(service.isActive('TRAK')).toBe(false);
    expect(service.getActiveSymbols().map((s) => s.canonicalTicker)).not.toContain('TRAK');
  });

  it('should compute provider coverage', () => {
    expect(service.getCoverageForProvider('yahoo')).toBe(service.getActiveSymbols().length);
  });

  it('should expose the master registry with canonical fields', () => {
    const registry = service.getMasterRegistry();
    expect(registry.length).toBeGreaterThan(service.getSymbols().length);
    const thyao = service.getMasterRegistryEntry('THYAO');
    expect(thyao).toMatchObject({
      ticker: 'THYAO',
      yahooTicker: 'THYAO.IS',
      exchange: 'BIST',
      currency: 'TRY',
    });
    expect(['active', 'inactive']).toContain(thyao!.status);
    expect(thyao!.dataSources).toContain('kap');
  });

  it('should report master registry stats', () => {
    const stats = service.getMasterRegistryStats();
    expect(stats.totalInstruments).toBe(service.getMasterRegistry().length);
    expect(stats.totalActive + stats.totalInactive).toBe(stats.totalInstruments);
    expect(stats.byAssetType.Equity).toBeGreaterThan(0);
    expect(stats.yahooCoveragePct).toBeGreaterThan(0);
  });
});
