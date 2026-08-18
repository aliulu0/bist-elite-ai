import { SymbolRegistryController } from './symbol-registry.controller';

describe('SymbolRegistryController', () => {
  const activeEntries = [
    {
      canonicalTicker: 'THYAO',
      companyName: 'Türk Hava Yolları',
      sector: 'Ulaştırma',
      isin: null,
      active: true,
    },
    {
      canonicalTicker: 'AKBNK',
      companyName: 'Akbank',
      sector: 'Bankacılık',
      isin: 'TR0000001001',
      active: true,
    },
    {
      canonicalTicker: 'ASELS',
      companyName: 'Aselsan',
      sector: 'Savunma',
      isin: null,
      active: true,
    },
  ];
  const allEntries = [
    ...activeEntries,
    {
      canonicalTicker: 'ZZZZ',
      companyName: 'Delisted Kayıt',
      sector: 'Diğer',
      isin: null,
      active: false,
    },
  ];
  const registry = {
    getSymbols: jest.fn(() => allEntries),
    getActiveSymbols: jest.fn(() => activeEntries),
  };
  const controller = new SymbolRegistryController(registry as any);

  it('returns only active symbols by default', async () => {
    const res = await controller.list(undefined, undefined, undefined, undefined);
    expect(res.success).toBe(true);
    expect(res.total).toBe(3);
    expect(res.data.map((d) => d.ticker)).toEqual(['AKBNK', 'ASELS', 'THYAO']);
    expect(res.sectors).toContain('Bankacılık');
  });

  it('filters by query on ticker and company name', async () => {
    const tickerRes = await controller.list('THY', undefined, undefined, undefined);
    expect(tickerRes.data.map((d) => d.ticker)).toEqual(['THYAO']);

    const companyRes = await controller.list('akbank', undefined, undefined, undefined);
    expect(companyRes.data.map((d) => d.ticker)).toEqual(['AKBNK']);
  });

  it('filters by sector and includes inactive when active=all', async () => {
    const sectorRes = await controller.list(undefined, 'Bankacılık', undefined, undefined);
    expect(sectorRes.data.map((d) => d.ticker)).toEqual(['AKBNK']);

    const allRes = await controller.list(undefined, undefined, 'all', undefined);
    expect(allRes.total).toBe(4);
  });

  it('applies limit', async () => {
    const res = await controller.list(undefined, undefined, undefined, '1');
    expect(res.data).toHaveLength(1);
  });
});
