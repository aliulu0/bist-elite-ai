import { Injectable, Logger } from '@nestjs/common';
import { MarketDataOrchestrator } from '../../market-data/orchestrator/market-data-orchestrator';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import {
  MTFDataCoverageEntry,
  MTFCoverageReport,
  DataProviderName,
} from '../interfaces';

const SUPPORTED_TIMEFRAMES_LIST = ['1h', '2h', '4h', '1d', '1w', '1m', '3m', '6m'];

@Injectable()
export class MTFCoverageService {
  private readonly logger = new Logger(MTFCoverageService.name);

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  async getMTFCoverageForTicker(ticker: string): Promise<MTFCoverageReport> {
    const coverage: MTFDataCoverageEntry[] = [];
    const timeframes = SUPPORTED_TIMEFRAMES_LIST;

    for (const timeframe of timeframes) {
      const entry = await this.checkTimeframeAvailability(ticker, timeframe);
      coverage.push(entry);
    }

    const available = coverage.filter(c => c.available).length;
    const derived = coverage.filter(c => c.derived).length;
    const unavailable = coverage.filter(c => !c.available).length;

    return {
      coverage,
      summary: {
        totalChecked: coverage.length,
        available,
        derived,
        unavailable,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getMTFCoverageForTickers(tickers: string[]): Promise<MTFCoverageReport[]> {
    const reports = await Promise.all(
      tickers.map(ticker => this.getMTFCoverageForTicker(ticker))
    );
    return reports;
  }

  async getOverallMTFCoverage(): Promise<MTFCoverageReport> {
    const symbols = this.symbolRegistry.getActiveSymbols().slice(0, 100);
    const allCoverage: MTFDataCoverageEntry[] = [];

    for (const symbol of symbols) {
      const report = await this.getMTFCoverageForTicker(symbol.canonicalTicker);
      allCoverage.push(...report.coverage);
    }

    const available = allCoverage.filter(c => c.available).length;
    const derived = allCoverage.filter(c => c.derived).length;
    const unavailable = allCoverage.filter(c => !c.available).length;

    return {
      coverage: allCoverage,
      summary: {
        totalChecked: allCoverage.length,
        available,
        derived,
        unavailable,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private async checkTimeframeAvailability(ticker: string, timeframe: string): Promise<MTFDataCoverageEntry> {
    try {
      const result = await this.orchestrator.fetchHistoricalData(ticker, timeframe);
      
      if (result && result.data && result.data.length > 0) {
        return {
          ticker: ticker.toUpperCase(),
          timeframe,
          available: true,
          derived: false,
          sourceTimeframe: timeframe,
          dataAge: this.estimateDataAge(result.data),
          sourceProvider: (result.provider as DataProviderName) ?? null,
        };
      }
    } catch (error) {
      this.logger.debug(`Failed to fetch ${timeframe} for ${ticker}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      ticker: ticker.toUpperCase(),
      timeframe,
      available: false,
      derived: false,
      sourceTimeframe: null,
      dataAge: null,
      sourceProvider: null,
    };
  }

  private estimateDataAge(points: any[]): number | null {
    if (!points.length) return null;
    const latest = points[points.length - 1];
    const timestamp = latest.timestamp ?? latest.date;
    if (!timestamp) return null;
    return Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  }
}