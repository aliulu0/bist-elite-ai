import { Injectable, Logger } from '@nestjs/common';
import { MacroDataPoint, MacroDataSnapshot, MacroDataSource, MacroConfig } from './macro.types';
import { DEFAULT_MACRO_CONFIG } from './macro.config';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';

const SOURCE_LABELS: Record<MacroDataSource, { label: string; unit: string }> = {
  tcmb_policy_rate: { label: 'TCMB Policy Rate', unit: '%' },
  tcmb_decision_text: { label: 'TCMB Decision', unit: '' },
  fed_rate: { label: 'FED Funds Rate', unit: '%' },
  fomc_statement: { label: 'FOMC Statement', unit: '' },
  ecb_rate: { label: 'ECB Rate', unit: '%' },
  us10y: { label: 'US 10Y Yield', unit: '%' },
  us2y: { label: 'US 2Y Yield', unit: '%' },
  dxy: { label: 'DXY Index', unit: 'pts' },
  vix: { label: 'VIX Volatility', unit: 'pts' },
  brent: { label: 'Brent Oil', unit: 'USD' },
  gold: { label: 'Gold', unit: 'USD' },
  usdtry: { label: 'USD/TRY', unit: 'rate' },
  eurusd: { label: 'EUR/USD', unit: 'rate' },
  turkey_cds: { label: 'Turkey CDS', unit: 'bps' },
  pmi: { label: 'PMI', unit: 'idx' },
  inflation: { label: 'Inflation', unit: '%' },
  bist_sector_indices: { label: 'BIST Sector Indices', unit: 'pts' },
};

const INDICATOR_SOURCE_MAP: Partial<Record<MacroDataSource, string>> = {
  tcmb_policy_rate: 'tcmb_policy_rate',
  us10y: 'us10y',
  us2y: 'us2y',
  dxy: 'dxy',
  vix: 'vix',
  brent: 'brent',
  gold: 'gold',
  usdtry: 'usdtry',
  eurusd: 'eurusd',
  inflation: 'inflation',
};

@Injectable()
export class MacroDataService {
  private readonly logger = new Logger(MacroDataService.name);
  private readonly config: MacroConfig;
  private cache = new Map<MacroDataSource, MacroDataPoint>();

  constructor(private readonly orchestrator: MarketDataOrchestrator) {
    this.config = { ...DEFAULT_MACRO_CONFIG };
  }

  async fetchAll(): Promise<MacroDataSnapshot> {
    const macroIndicators = await this.orchestrator.fetchMacroIndicators();
    const indicatorMap = new Map(macroIndicators.map((i) => [i.symbol, i]));

    const sources = Object.keys(SOURCE_LABELS) as MacroDataSource[];
    const points: MacroDataPoint[] = sources.map((source) => this.buildPoint(source, indicatorMap));

    const healthyCount = points.filter((p) => p.status === 'fetched').length;
    const staleCount = points.filter((p) => p.status === 'stale').length;
    const errorCount = points.filter((p) => p.status === 'error').length;

    for (const p of points) {
      if (p.status === 'fetched') {
        this.cache.set(p.source, p);
      }
    }

    return {
      points,
      fetchedAt: new Date().toISOString(),
      sourceCount: sources.length,
      healthyCount,
      staleCount,
      errorCount,
    };
  }

  private buildPoint(
    source: MacroDataSource,
    indicatorMap: Map<string, { value: number; change?: number; changePercent?: number; timestamp: string }>,
  ): MacroDataPoint {
    const indicatorSymbol = INDICATOR_SOURCE_MAP[source];
    const cached = this.cache.get(source);

    if (indicatorSymbol) {
      const indicator = indicatorMap.get(indicatorSymbol);
      if (indicator) {
        return {
          source,
          value: indicator.value,
          previousValue: cached?.value,
          change: indicator.change,
          changePercent: indicator.changePercent,
          timestamp: indicator.timestamp,
          status: 'fetched',
          label: SOURCE_LABELS[source].label,
          unit: SOURCE_LABELS[source].unit,
        };
      }
    }

    if (cached) {
      return { ...cached, status: 'stale' };
    }

    return {
      source,
      value: 0,
      timestamp: new Date().toISOString(),
      status: 'pending',
      label: SOURCE_LABELS[source].label,
      unit: SOURCE_LABELS[source].unit,
    };
  }
}
