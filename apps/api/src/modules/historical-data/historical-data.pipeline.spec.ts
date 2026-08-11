import { HistoricalDataPipeline, PipelineInput } from './historical-data.pipeline';
import { HistoricalDataset, CorporateAction } from './historical-data.types';
import { DEFAULT_PIPELINE_CONFIG } from './historical-data.config';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';

function makeMarketDataPoint(overrides?: Partial<MarketDataPoint>): MarketDataPoint {
  return {
    symbol: 'TEST',
    timeframe: '1d',
    open: 100,
    high: 105,
    low: 98,
    close: 103,
    volume: 1000000,
    timestamp: '2025-01-01',
    validationStatus: 'valid',
    ...overrides,
  };
}

function makeDataset(count: number, startPrice = 100): MarketDataPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    symbol: 'TEST',
    timeframe: '1d' as const,
    open: startPrice + i * 0.5,
    high: startPrice + i * 0.5 + 3,
    low: startPrice + i * 0.5 - 2,
    close: startPrice + i * 0.5 + 1,
    volume: 1000000 + i * 10000,
    timestamp: new Date(Date.parse('2025-01-01') + i * 86400000).toISOString().split('T')[0],
    validationStatus: 'valid' as const,
  }));
}

function makeInput(overrides?: Partial<PipelineInput>): PipelineInput {
  return {
    symbol: 'THYAO',
    timeframe: '1d',
    priceData: makeDataset(50),
    ...overrides,
  };
}

describe('HistoricalDataPipeline', () => {
  let pipeline: HistoricalDataPipeline;

  beforeEach(() => {
    pipeline = new HistoricalDataPipeline();
  });

  it('should be defined', () => {
    expect(pipeline).toBeDefined();
  });

  describe('empty data', () => {
    it('should return empty dataset for null price data', () => {
      const result = pipeline.process(makeInput({ priceData: [] }));
      expect(result.bars.length).toBe(0);
      expect(result.metadata.warnings.length).toBeGreaterThan(0);
    });

    it('should return empty dataset for undefined price data', () => {
      const result = pipeline.process(makeInput({ priceData: undefined as any }));
      expect(result.bars.length).toBe(0);
    });
  });

  describe('valid data', () => {
    it('should produce correct number of bars', () => {
      const result = pipeline.process(makeInput());
      expect(result.bars.length).toBe(50);
    });

    it('should preserve symbol and timeframe', () => {
      const result = pipeline.process(makeInput({ symbol: 'GARAN', timeframe: '1w' }));
      expect(result.symbol).toBe('GARAN');
      expect(result.timeframe).toBe('1w');
    });

    it('should have valid metadata', () => {
      const result = pipeline.process(makeInput());
      expect(result.metadata.totalBars).toBe(50);
      expect(result.metadata.dateRange.start).toBeDefined();
      expect(result.metadata.dateRange.end).toBeDefined();
      expect(result.metadata.processedAt).toBeDefined();
    });
  });

  describe('timestamp normalization', () => {
    it('should sort timestamps ascending', () => {
      const data = makeDataset(10);
      const reversed = [...data].reverse();
      const result = pipeline.process(makeInput({ priceData: reversed }));
      const timestamps = result.bars.map((b) => b.timestamp);
      for (let i = 1; i < timestamps.length; i++) {
        expect(new Date(timestamps[i]).getTime()).toBeGreaterThanOrEqual(new Date(timestamps[i - 1]).getTime());
      }
    });

    it('should remove duplicate timestamps', () => {
      const data = makeDataset(10);
      data[5] = makeMarketDataPoint({ timestamp: data[4].timestamp });
      const result = pipeline.process(makeInput({ priceData: data }));
      const timestamps = result.bars.map((b) => b.timestamp);
      const unique = new Set(timestamps);
      expect(unique.size).toBe(timestamps.length);
    });

    it('should report timestamp normalization', () => {
      const data = makeDataset(10);
      data[5] = makeMarketDataPoint({ timestamp: data[4].timestamp });
      const result = pipeline.process(makeInput({ priceData: data }));
      expect(result.metadata.normalizedFields).toContain('timestamps');
    });
  });

  describe('OHLC normalization', () => {
    it('should swap high and low when inverted', () => {
      const data = makeDataset(10);
      data[3] = makeMarketDataPoint({ timestamp: data[3].timestamp, high: 95, low: 100 });
      const result = pipeline.process(makeInput({ priceData: data }));
      expect(result.bars[3].high).toBeGreaterThanOrEqual(result.bars[3].low);
    });

    it('should fix high below open', () => {
      const data = makeDataset(10);
      data[3] = makeMarketDataPoint({ timestamp: data[3].timestamp, open: 110, high: 105 });
      const result = pipeline.process(makeInput({ priceData: data }));
      expect(result.bars[3].high).toBeGreaterThanOrEqual(result.bars[3].open);
    });

    it('should fix low above close', () => {
      const data = makeDataset(10);
      data[3] = makeMarketDataPoint({ timestamp: data[3].timestamp, close: 95, low: 100 });
      const result = pipeline.process(makeInput({ priceData: data }));
      expect(result.bars[3].low).toBeLessThanOrEqual(result.bars[3].close);
    });

    it('should round prices to configured decimals', () => {
      const data = makeDataset(5);
      data[0] = makeMarketDataPoint({ timestamp: data[0].timestamp, open: 100.12345, close: 103.98765 });
      const pipeline2 = new HistoricalDataPipeline({ ohlc: { ...DEFAULT_PIPELINE_CONFIG.ohlc, roundDecimals: 2 } });
      const result = pipeline2.process(makeInput({ priceData: data }));
      const openStr = result.bars[0].open.toString();
      expect(openStr.split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
    });
  });

  describe('volume normalization', () => {
    it('should keep zero volume by default', () => {
      const data = makeDataset(10);
      data[5] = makeMarketDataPoint({ timestamp: data[5].timestamp, volume: 0 });
      const result = pipeline.process(makeInput({ priceData: data }));
      expect(result.bars.some((b) => b.volume === 0)).toBe(true);
    });

    it('should replace zero volume when configured', () => {
      const data = makeDataset(10);
      data[5] = makeMarketDataPoint({ timestamp: data[5].timestamp, volume: 0 });
      const pipeline2 = new HistoricalDataPipeline({
        volume: { ...DEFAULT_PIPELINE_CONFIG.volume, zeroVolumeHandling: 'replace_zero', zeroReplacementValue: 100 },
      });
      const result = pipeline2.process(makeInput({ priceData: data }));
      expect(result.bars[5].volume).toBe(100);
    });

    it('should remove zero volume bars when configured', () => {
      const data = makeDataset(10);
      data[5] = makeMarketDataPoint({ timestamp: data[5].timestamp, volume: 0 });
      const pipeline2 = new HistoricalDataPipeline({
        volume: { ...DEFAULT_PIPELINE_CONFIG.volume, zeroVolumeHandling: 'remove' },
      });
      const result = pipeline2.process(makeInput({ priceData: data }));
      expect(result.bars.length).toBe(9);
    });

    it('should fix negative volume', () => {
      const data = makeDataset(10);
      data[5] = makeMarketDataPoint({ timestamp: data[5].timestamp, volume: -100 });
      const result = pipeline.process(makeInput({ priceData: data }));
      expect(result.bars[5].volume).toBeGreaterThanOrEqual(0);
    });
  });

  describe('currency normalization', () => {
    it('should convert USD to TRY', () => {
      const data = makeDataset(5);
      const pipeline2 = new HistoricalDataPipeline({
        currency: { ...DEFAULT_PIPELINE_CONFIG.currency, targetCurrency: 'TRY' },
      });
      const result = pipeline2.process(makeInput({ priceData: data, providerCurrency: 'USD' }));
      expect(result.bars[0].close).toBeGreaterThan(data[0].close);
    });

    it('should not convert when same currency', () => {
      const data = makeDataset(5);
      const result = pipeline.process(makeInput({ priceData: data, providerCurrency: 'TRY' }));
      expect(result.bars[0].close).toBe(data[0].close);
    });

    it('should report currency normalization', () => {
      const data = makeDataset(5);
      const result = pipeline.process(makeInput({ priceData: data, providerCurrency: 'USD' }));
      expect(result.metadata.normalizedFields).toContain('currency');
    });
  });

  describe('corporate actions', () => {
    it('should include provided corporate actions', () => {
      const actions: CorporateAction[] = [
        { type: 'dividend', date: '2025-03-01', value: 1.5, description: 'Q1 dividend' },
        { type: 'split', date: '2025-06-01', value: 2, ratio: '2:1', description: 'Stock split' },
      ];
      const result = pipeline.process(makeInput({ corporateActions: actions }));
      expect(result.corporateActions.length).toBe(2);
      expect(result.corporateActions[0].type).toBe('dividend');
    });

    it('should default to empty corporate actions', () => {
      const result = pipeline.process(makeInput());
      expect(result.corporateActions.length).toBe(0);
    });
  });

  describe('fundamentals', () => {
    it('should merge all fundamental data', () => {
      const result = pipeline.process(makeInput({
        companyProfile: { symbol: 'THYAO', companyName: 'Türk Hava Yolları', sector: 'Transportation', marketCap: 500000000, lastUpdated: '2025-01-01', source: 'fintables' },
        financialRatios: { symbol: 'THYAO', priceToBook: 1.5, enterpriseValueToEBITDA: 8.2, lastUpdated: '2025-01-01', source: 'fintables' },
        balanceSheet: { symbol: 'THYAO', equity: 100000000, totalDebt: 50000000, totalAssets: 200000000, sharesOutstanding: 1000000, lastUpdated: '2025-01-01', source: 'fintables' },
        incomeStatement: { symbol: 'THYAO', netProfit: 25000000, lastUpdated: '2025-01-01', source: 'fintables' },
        sector: { symbol: 'THYAO', sector: 'Transportation', lastUpdated: '2025-01-01', source: 'fintables' },
      }));
      expect(result.fundamentals.companyName).toBe('Türk Hava Yolları');
      expect(result.fundamentals.priceToBook).toBe(1.5);
      expect(result.fundamentals.netProfit).toBe(25000000);
      expect(result.fundamentals.totalAssets).toBe(200000000);
      expect(result.fundamentals.sector).toBe('Transportation');
    });

    it('should handle missing fundamentals gracefully', () => {
      const result = pipeline.process(makeInput());
      expect(result.fundamentals.priceToBook).toBeNull();
      expect(result.fundamentals.totalAssets).toBeNull();
      expect(result.fundamentals.companyName).toBeNull();
    });
  });

  describe('provider metadata', () => {
    it('should include provider info', () => {
      const result = pipeline.process(makeInput());
      expect(result.provider.name).toBe('pipeline');
      expect(result.provider.currency).toBe('TRY');
      expect(result.provider.exchange).toBe('BIST');
    });

    it('should use provided provider info', () => {
      const result = pipeline.process(makeInput({
        providerCurrency: 'USD',
        providerExchange: 'NASDAQ',
        providerTimezone: 'America/New_York',
      }));
      expect(result.provider.currency).toBe('USD');
      expect(result.provider.exchange).toBe('NASDAQ');
      expect(result.provider.timezone).toBe('America/New_York');
    });
  });

  describe('metadata', () => {
    it('should track normalized fields', () => {
      const data = makeDataset(10);
      data[5] = makeMarketDataPoint({ timestamp: data[4].timestamp });
      const result = pipeline.process(makeInput({ priceData: data }));
      expect(result.metadata.normalizedFields.length).toBeGreaterThan(0);
    });

    it('should track warnings', () => {
      const data = makeDataset(10);
      data[3] = makeMarketDataPoint({ timestamp: data[3].timestamp, high: 95, low: 100 });
      const result = pipeline.process(makeInput({ priceData: data }));
      expect(result.metadata.warnings.length).toBeGreaterThan(0);
    });

    it('should include source providers', () => {
      const result = pipeline.process(makeInput());
      expect(result.metadata.sourceProviders.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle single bar', () => {
      const result = pipeline.process(makeInput({ priceData: [makeMarketDataPoint()] }));
      expect(result.bars.length).toBe(1);
    });

    it('should handle large dataset', () => {
      const result = pipeline.process(makeInput({ priceData: makeDataset(500) }));
      expect(result.bars.length).toBe(500);
    });

    it('should handle all bars with same timestamp', () => {
      const data = makeDataset(10);
      data.forEach((d, i) => { d.timestamp = '2025-01-01'; });
      const result = pipeline.process(makeInput({ priceData: data }));
      expect(result.bars.length).toBe(1);
    });

    it('should produce deterministic results', () => {
      const input = makeInput();
      const r1 = pipeline.process(input);
      const r2 = pipeline.process(input);
      expect(r1.bars.length).toBe(r2.bars.length);
      expect(r1.bars[0].close).toBe(r2.bars[0].close);
    });
  });
});
