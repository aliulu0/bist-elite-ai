import { Injectable, Optional } from '@nestjs/common';
import { DataStatus } from './market-scanner.types';
import {
  SymbolAnalysis,
  RankedSymbol,
  MarketScannerResult,
  ScannerStatistics,
  ExtendedScannerResult,
  EarlyOpportunityClassification,
  ScannerSignalQuality,
  TimeframeData,
  MultiTimeframeAnalysis,
} from './market-scanner.types';
import { MarketScannerConfig, DEFAULT_MARKET_SCANNER_CONFIG } from './market-scanner.config';
import {
  determineMultiTimeframeConfluence,
  determineEarlyOpportunityClassification,
  determineScannerSignalQuality,
  computeReturn1D,
  computeSMA,
  computeRSI,
  computeMACD,
  computeStochasticRSI,
  computeVolumeFeatures,
  computeBreakoutFeatures,
  determineMarketRegime,
} from '../market-data/services/scanner-features.service';
import { Timeframe } from '../market-data/interfaces';

export type FilterStatus = 'PASS' | 'FAIL' | 'UNAVAILABLE';

export interface FilterResult {
  symbol: string;
  status: FilterStatus;
  reason?: string;
}

export interface ScannerFilters {
  minPrice?: number;
  maxPrice?: number;
  minRelativeVolume?: number;
  volumeSpike?: boolean;
  rsiRange?: [number, number];
  macdBullish?: boolean;
  smaOrder?: boolean;
  breakout?: boolean;
  momentum5D?: number;
  relativeStrength?: number;
  marketRegime?: 'BULL' | 'BEAR' | 'SIDEWAYS' | 'UNKNOWN';
  minEliteScore?: number;
  minTechnicalScore?: number;
  minFinancialScore?: number;
  minDataAvailability?: DataStatus;
  minSourceConfidence?: number;
  /** Multi-timeframe filters */
  minAvailableTimeframeCount?: number;
  minBullishTimeframeCount?: number;
  minConfluenceScore?: number;
  require4hBullish?: boolean;
  require1dBullish?: boolean;
  require1wBullish?: boolean;
  require1mBullish?: boolean;
  minVolumeConfirmation?: 'STRONG' | 'MODERATE' | 'WEAK';
  minMomentumState?: 'ACCELERATING' | 'POSITIVE' | 'NEUTRAL' | 'WEAKENING' | 'NEGATIVE';
  minTechAlignment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

/** Filter result per timeframe */
export interface TimeframeFilterResult {
  timeframe: Timeframe;
  status: FilterStatus;
  reason?: string;
}

/** Result of multi-timeframe filter application */
export interface MultiTimeframeFilterResult {
  symbol: string;
  passCount: number;
  failCount: number;
  unavailableCount: number;
  totalCount: number;
  confluence: 'STRONG' | 'MODERATE' | 'PARTIAL' | 'CONFLICTED' | 'UNKNOWN';
  multiTimeframeAnalysis?: MultiTimeframeAnalysis;
  earlyOpportunityClassification?: EarlyOpportunityClassification;
  scannerSignalQuality?: ScannerSignalQuality;
}

/** Extended filtered scanner result */
export interface ExtendedFilteredScannerResult {
  topCandidates: RankedSymbol[];
  watchlist: RankedSymbol[];
  rejected: RankedSymbol[];
  statistics: ScannerStatistics;
  metadata: Record<string, unknown>;
  appliedFilters: ScannerFilters;
  filterResults: FilterResult[];
  timeframeFilterResults: TimeframeFilterResult[];
  multiTimeframeFilterResult?: MultiTimeframeFilterResult;
}

export interface FilteredScannerResult {
  topCandidates: RankedSymbol[];
  watchlist: RankedSymbol[];
  rejected: RankedSymbol[];
  statistics: ScannerStatistics;
  metadata: Record<string, unknown>;
  appliedFilters: ScannerFilters;
  filterResults: FilterResult[];
}

@Injectable()
export class MarketScannerEngine {
  private readonly config: MarketScannerConfig;

  constructor(@Optional() config?: Partial<MarketScannerConfig>) {
    this.config = { ...DEFAULT_MARKET_SCANNER_CONFIG, ...config };
  }

  scan(symbols: SymbolAnalysis[]): MarketScannerResult {
    if (!symbols || symbols.length === 0) {
      return this.emptyResult();
    }

    const scored = symbols.map((s) => this.rankSymbol(s));
    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    const ranked = this.assignRanks(scored);
    const topCandidates: RankedSymbol[] = [];
    const watchlist: RankedSymbol[] = [];
    const rejected: RankedSymbol[] = [];
    const symbolMap = new Map(symbols.map((s) => [s.symbol, s]));

    for (const item of ranked) {
      const original = symbolMap.get(item.symbol);
      if (this.isTopCandidate(item, original)) {
        item.status = 'TOP_CANDIDATE';
        if (topCandidates.length < this.config.maxTopCandidates) {
          topCandidates.push(item);
        } else {
          item.status = 'WATCHLIST';
          if (watchlist.length < this.config.maxWatchlist) {
            watchlist.push(item);
          } else {
            item.status = 'REJECTED';
            rejected.push(item);
          }
        }
      } else if (this.isWatchlist(item)) {
        item.status = 'WATCHLIST';
        if (watchlist.length < this.config.maxWatchlist) {
          watchlist.push(item);
        } else {
          item.status = 'REJECTED';
          rejected.push(item);
        }
      } else {
        item.status = 'REJECTED';
        rejected.push(item);
      }
    }

    const statistics = this.computeStatistics(symbols, topCandidates, watchlist, rejected);

    return {
      topCandidates,
      watchlist,
      rejected,
      statistics,
      metadata: {
        scannedAt: new Date().toISOString(),
        config: this.config,
        totalProcessed: symbols.length,
      },
    };
  }

  filterSymbols(symbols: SymbolAnalysis[], filters: ScannerFilters): ExtendedFilteredScannerResult {
    const filterResults: FilterResult[] = [];
    const timeframeFilterResults: TimeframeFilterResult[] = [];

    for (const symbol of symbols) {
      const result = this.applyFilters(symbol, filters);
      filterResults.push(result);

      // Compute per-timeframe filter results
      const tfResults = this.applyTimeframeFilters(symbol, filters);
      timeframeFilterResults.push(...tfResults);
    }

    const filteredSymbols = symbols.filter((s) => {
      const fr = this.applyFilters(s, filters);
      return fr.status === 'PASS';
    });

    const scanned = this.scan(filteredSymbols);

    // Build multi-timeframe filter result for each symbol
    const multiTimeframeFilterResults: MultiTimeframeFilterResult[] = [];
    for (const symbol of symbols) {
      const tfResult = this.buildMultiTimeframeFilterResult(symbol, filters);
      if (tfResult) {
        multiTimeframeFilterResults.push(tfResult);
      }
    }

    return {
      topCandidates: scanned.topCandidates,
      watchlist: scanned.watchlist,
      rejected: scanned.rejected,
      statistics: scanned.statistics,
      metadata: {
        scannedAt: new Date().toISOString(),
        config: this.config,
        totalProcessed: symbols.length,
      },
      appliedFilters: filters,
      filterResults,
      timeframeFilterResults,
      multiTimeframeFilterResult:
        multiTimeframeFilterResults.length > 0 ? multiTimeframeFilterResults[0] : undefined,
    };
  }

  /**
   * Apply all filters to a symbol, returning a FilterResult.
   * Supports PASS, FAIL, UNAVAILABLE statuses.
   * UNAVAILABLE means missing data - never fabricated as 0/50/neutral.
   */
  private applyFilters(symbol: SymbolAnalysis, filters: ScannerFilters): FilterResult {
    const scanner = symbol.scanner;
    if (!scanner) {
      return { symbol: symbol.symbol, status: 'UNAVAILABLE', reason: 'No scanner data available' };
    }

    const {
      currentPrice,
      rsi14,
      macd,
      sma9,
      sma20,
      sma50,
      volume20Average,
      volumeSpike,
      distanceTo20DHigh,
      isBreakout,
      momentum5D,
      relativeStrength,
      marketRegime,
      eliteScore,
      financialScore,
      technicalScore,
    } = scanner;

    // Price filters
    if (filters.minPrice !== undefined && currentPrice !== null) {
      if (currentPrice < filters.minPrice) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason: 'Price ' + currentPrice + ' below minimum ' + filters.minPrice,
        };
      }
    }

    if (filters.maxPrice !== undefined && currentPrice !== null) {
      if (currentPrice > filters.maxPrice) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason: 'Price ' + currentPrice + ' above maximum ' + filters.maxPrice,
        };
      }
    }

    // Relative volume filter
    if (filters.minRelativeVolume !== undefined && volume20Average !== null) {
      if (volume20Average < filters.minRelativeVolume) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason:
            'Relative volume ' + volume20Average + ' below minimum ' + filters.minRelativeVolume,
        };
      }
    }

    // Volume spike filter
    if (filters.volumeSpike !== undefined && volumeSpike !== null) {
      if (volumeSpike !== filters.volumeSpike) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason:
            'Volume spike mismatch: detected=' + volumeSpike + ', expected=' + filters.volumeSpike,
        };
      }
    }

    // RSI range filter
    if (filters.rsiRange !== undefined && rsi14 !== null) {
      const [minRsi, maxRsi] = filters.rsiRange;
      if (rsi14 < minRsi || rsi14 > maxRsi) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason: 'RSI ' + rsi14 + ' outside range [' + minRsi + ', ' + maxRsi + ']',
        };
      }
    }

    // MACD bullish filter
    if (filters.macdBullish !== undefined && macd !== null && macd.macd !== null) {
      const isBullish = macd.macd > 0;
      if (isBullish !== filters.macdBullish) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason: 'MACD state ' + (isBullish ? 'bullish' : 'bearish') + ' does not match expected',
        };
      }
    }

    // SMA order filter
    if (filters.smaOrder !== undefined && sma9 !== null && sma20 !== null && sma50 !== null) {
      const sma9AboveSMA20 = sma9 > sma20;
      const sma20AboveSMA50 = sma20 > sma50;
      const smaOrderMet = sma9AboveSMA20 && sma20AboveSMA50;
      if (smaOrderMet !== filters.smaOrder) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason:
            'SMA order not met: SMA9>SMA20=' + sma9AboveSMA20 + ', SMA20>SMA50=' + sma20AboveSMA50,
        };
      }
    }

    // Breakout filter
    if (filters.breakout !== undefined && isBreakout !== null) {
      if (isBreakout !== filters.breakout) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason: 'Breakout mismatch: detected=' + isBreakout + ', expected=' + filters.breakout,
        };
      }
    }

    // Momentum5D filter
    if (filters.momentum5D != null && momentum5D != null) {
      if (Math.abs(momentum5D - filters.momentum5D) > 0.05) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason: 'Momentum5D ' + momentum5D + ' does not match expected ' + filters.momentum5D,
        };
      }
    }

    // Relative strength filter
    if (filters.relativeStrength != null && relativeStrength != null) {
      if (Math.abs(relativeStrength - filters.relativeStrength) > 0.05) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason:
            'Relative strength ' +
            relativeStrength +
            ' does not match expected ' +
            filters.relativeStrength,
        };
      }
    }

    // Market regime filter
    if (filters.marketRegime !== undefined && marketRegime !== null) {
      if (marketRegime !== marketRegime) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason: 'Market regime ' + marketRegime + ' does not match expected ' + marketRegime,
        };
      }
    }

    // Elite score minimum
    if (filters.minEliteScore !== undefined && eliteScore !== null) {
      if (eliteScore < filters.minEliteScore) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason: 'Elite score ' + eliteScore + ' below minimum ' + filters.minEliteScore,
        };
      }
    }

    // Technical score minimum
    if (filters.minTechnicalScore !== undefined && technicalScore !== null) {
      if (technicalScore < filters.minTechnicalScore) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason:
            'Technical score ' + technicalScore + ' below minimum ' + filters.minTechnicalScore,
        };
      }
    }

    // Financial score minimum
    if (filters.minFinancialScore !== undefined && financialScore !== null) {
      if (financialScore < filters.minFinancialScore) {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason:
            'Financial score ' + financialScore + ' below minimum ' + filters.minFinancialScore,
        };
      }
    }

    // Data availability filter
    if (filters.minDataAvailability !== undefined) {
      const dataStatus = scanner.dataStatus;
      if (dataStatus !== undefined && dataStatus !== 'AVAILABLE') {
        const availabilityOrder = ['UNAVAILABLE', 'PARTIALLY_AVAILABLE', 'AVAILABLE'];
        const minIdx = availabilityOrder.indexOf(filters.minDataAvailability);
        const statusIdx = availabilityOrder.indexOf(dataStatus);
        if (minIdx !== -1 && statusIdx !== -1 && statusIdx > minIdx) {
          return {
            symbol: symbol.symbol,
            status: 'FAIL',
            reason:
              'Data availability ' + dataStatus + ' below required ' + filters.minDataAvailability,
          };
        }
      }
    }

    // Source confidence filter
    if (filters.minSourceConfidence !== undefined && scanner.sourceProvenance?.source === 'REAL') {
      if (scanner.dataStatus === 'UNAVAILABLE') {
        return {
          symbol: symbol.symbol,
          status: 'FAIL',
          reason: 'Data unavailable; cannot meet confidence requirement',
        };
      }
    }

    return { symbol: symbol.symbol, status: 'PASS' };
  }

  /**
   * Apply per-timeframe filters and build multi-timeframe analysis.
   * Returns per-timeframe filter results.
   */
  private applyTimeframeFilters(
    symbol: SymbolAnalysis,
    filters: ScannerFilters,
  ): TimeframeFilterResult[] {
    const scanner = symbol.scanner;
    if (!scanner) {
      return [{ timeframe: '1d', status: 'UNAVAILABLE', reason: 'No scanner data available' }];
    }

    // The scanner has data for one timeframe; we need to build analysis
    // for all 8 timeframes using available data and UNAVAILABLE for unsupported ones
    const results: TimeframeFilterResult[] = [];

    // For each timeframe, determine availability and apply filters
    const allTimeframes: Timeframe[] = ['1H', '2H', '4h', '1d', '1w', '1m', '3m', '6m'];

    for (const tf of allTimeframes) {
      let status: FilterStatus = 'PASS';
      let reason: string | undefined;

      // Check if this timeframe has data
      if (tf === '1H' || tf === '2H') {
        // 1H and 2H are UNAVAILABLE from Yahoo natively
        status = 'UNAVAILABLE';
        reason = 'Timeframe ' + tf + ' not natively supported by Yahoo Finance';
        results.push({ timeframe: tf, status, reason });
        continue;
      }

      // For available timeframes, check if scanner data exists for this timeframe
      // If scanner.timeframe matches or if we have data for this symbol
      const hasData =
        scanner.timeframe === tf ||
        (scanner.currentPrice !== null && scanner.dataStatus !== 'UNAVAILABLE');

      if (!hasData) {
        status = 'UNAVAILABLE';
        reason = 'No data for timeframe ' + tf;
        results.push({ timeframe: tf, status, reason });
        continue;
      }

      // Apply filters for this timeframe's data
      const {
        currentPrice,
        rsi14,
        macd,
        sma9,
        sma20,
        sma50,
        volume20Average,
        volumeSpike,
        distanceTo20DHigh,
        isBreakout,
        momentum5D,
        relativeStrength,
        marketRegime,
        eliteScore,
        financialScore,
        technicalScore,
      } = scanner;

      // minPrice
      if (filters.minPrice !== undefined && currentPrice !== null) {
        if (currentPrice < filters.minPrice) {
          status = 'FAIL';
          reason = 'Price ' + currentPrice + ' below minimum ' + filters.minPrice;
        }
      }

      // maxPrice
      if (filters.maxPrice !== undefined && currentPrice !== null && status !== 'FAIL') {
        if (currentPrice > filters.maxPrice) {
          status = 'FAIL';
          reason = 'Price ' + currentPrice + ' above maximum ' + filters.maxPrice;
        }
      }

      // minRelativeVolume
      if (
        filters.minRelativeVolume !== undefined &&
        volume20Average !== null &&
        status !== 'FAIL'
      ) {
        if (volume20Average < filters.minRelativeVolume) {
          status = 'FAIL';
          reason =
            'Relative volume ' + volume20Average + ' below minimum ' + filters.minRelativeVolume;
        }
      }

      // volumeSpike
      if (filters.volumeSpike !== undefined && volumeSpike !== null && status !== 'FAIL') {
        if (volumeSpike !== filters.volumeSpike) {
          status = 'FAIL';
          reason =
            'Volume spike mismatch: detected=' + volumeSpike + ', expected=' + filters.volumeSpike;
        }
      }

      // rsiRange
      if (filters.rsiRange !== undefined && rsi14 !== null && status !== 'FAIL') {
        const [minRsi, maxRsi] = filters.rsiRange;
        if (rsi14 < minRsi || rsi14 > maxRsi) {
          status = 'FAIL';
          reason = 'RSI ' + rsi14 + ' outside range [' + minRsi + ', ' + maxRsi + ']';
        }
      }

      // macdBullish
      if (
        filters.macdBullish !== undefined &&
        macd !== null &&
        macd.macd !== null &&
        status !== 'FAIL'
      ) {
        const isBullish = macd.macd > 0;
        if (isBullish !== filters.macdBullish) {
          status = 'FAIL';
          reason = 'MACD state ' + (isBullish ? 'bullish' : 'bearish') + ' does not match expected';
        }
      }

      // smaOrder
      if (
        filters.smaOrder !== undefined &&
        sma9 !== null &&
        sma20 !== null &&
        sma50 !== null &&
        status !== 'FAIL'
      ) {
        const sma9AboveSMA20 = sma9 > sma20;
        const sma20AboveSMA50 = sma20 > sma50;
        const smaOrderMet = sma9AboveSMA20 && sma20AboveSMA50;
        if (smaOrderMet !== filters.smaOrder) {
          status = 'FAIL';
          reason =
            'SMA order not met: SMA9>SMA20=' + sma9AboveSMA20 + ', SMA20>SMA50=' + sma20AboveSMA50;
        }
      }

      // breakout
      if (filters.breakout !== undefined && isBreakout !== null && status !== 'FAIL') {
        if (isBreakout !== filters.breakout) {
          status = 'FAIL';
          reason = 'Breakout mismatch: detected=' + isBreakout + ', expected=' + filters.breakout;
        }
      }

      // momentum5D
      if (filters.momentum5D != null && momentum5D != null && status !== 'FAIL') {
        if (Math.abs(momentum5D - filters.momentum5D) > 0.05) {
          status = 'FAIL';
          reason = 'Momentum5D ' + momentum5D + ' does not match expected ' + filters.momentum5D;
        }
      }

      // relativeStrength
      if (filters.relativeStrength != null && relativeStrength != null && status !== 'FAIL') {
        if (Math.abs(relativeStrength - filters.relativeStrength) > 0.05) {
          status = 'FAIL';
          reason =
            'Relative strength ' +
            relativeStrength +
            ' does not match expected ' +
            filters.relativeStrength;
        }
      }

      // marketRegime
      if (filters.marketRegime !== undefined && marketRegime !== null && status !== 'FAIL') {
        if (marketRegime !== marketRegime) {
          status = 'FAIL';
          reason = 'Market regime ' + marketRegime + ' does not match expected ' + marketRegime;
        }
      }

      results.push({ timeframe: tf, status, reason });
    }

    return results;
  }

  /**
   * Build multi-timeframe filter result with confluence analysis.
   */
  private buildMultiTimeframeFilterResult(
    symbol: SymbolAnalysis,
    filters: ScannerFilters,
  ): MultiTimeframeFilterResult | null {
    const scanner = symbol.scanner;
    if (!scanner || scanner.dataStatus === 'UNAVAILABLE') return null;

    // Build per-timeframe data structures
    const allTimeframes: Timeframe[] = ['1H', '2H', '4h', '1d', '1w', '1m', '3m', '6m'];
    const timeframeData: Record<Timeframe, TimeframeData> = allTimeframes.reduce(
      (acc, tf) => {
        acc[tf] = this.buildTimeframeData(tf, scanner);
        return acc;
      },
      {} as Record<Timeframe, TimeframeData>,
    );

    // Determine confluence
    const confluenceResult = determineMultiTimeframeConfluence(timeframeData);

    // Build MultiTimeframeAnalysis
    const multiTimeframeAnalysis: MultiTimeframeAnalysis = {
      symbol: symbol.symbol,
      timeframes: timeframeData,
      confluence: confluenceResult.confluence,
      availableTimeframeCount: confluenceResult.availableTimeframeCount,
      bullishTimeframeCount: confluenceResult.bullishTimeframeCount,
      bearishTimeframeCount: confluenceResult.bearishTimeframeCount,
      conflictedTimeframeCount: confluenceResult.conflictedTimeframeCount,
      confluenceScore: confluenceResult.confluenceScore,
      technicalAlignment: confluenceResult.technicalAlignment,
      volumeConfirmation: confluenceResult.volumeConfirmation,
      momentumState: confluenceResult.momentumState,
    };

    // Determine early opportunity classification
    const earlyClass = determineEarlyOpportunityClassification(multiTimeframeAnalysis);
    const signalQuality = determineScannerSignalQuality(multiTimeframeAnalysis);

    return {
      symbol: symbol.symbol,
      passCount: 0, // Will be computed by caller
      failCount: 0,
      unavailableCount: 0,
      totalCount: allTimeframes.length,
      confluence: confluenceResult.confluence,
      multiTimeframeAnalysis,
      earlyOpportunityClassification: earlyClass,
      scannerSignalQuality: signalQuality,
    };
  }

  /**
   * Build per-timeframe data from scanner features.
   */
  private buildTimeframeData(tf: Timeframe, scanner: any): TimeframeData {
    // For 1H and 2H, mark as UNAVAILABLE
    if (tf === '1H' || tf === '2H') {
      return {
        timeframe: tf,
        available: false,
        dataStatus: 'UNAVAILABLE',
        source: 'UNAVAILABLE',
        retrievedAt: new Date().toISOString(),
        marketTimestamp: new Date().toISOString(),
        currentPrice: null,
        priceChange1D: null,
        priceChange5D: null,
        priceChange20D: null,
        priceChange60D: null,
        volume20Average: null,
        volume50Average: null,
        relativeVolume20: null,
        relativeVolume50: null,
        volumeSpike: null,
        sma9: null,
        sma20: null,
        sma50: null,
        rsi14: null,
        macd: null,
        stochasticRsiK: null,
        stochasticRsiD: null,
        distanceTo20DHigh: null,
        distanceTo50DHigh: null,
        isBreakout: null,
        momentum5D: null,
        momentum20D: null,
        momentum60D: null,
        marketRegime: 'UNKNOWN',
        relativeStrength: null,
        relativeStrengthBenchmark: null,
      };
    }

    // For available timeframes, use scanner data
    const currentPrice = scanner.currentPrice ?? null;
    const rsi14 = scanner.rsi14 ?? null;
    const macd = scanner.macd ?? null;
    const sma9 = scanner.sma9 ?? null;
    const sma20 = scanner.sma20 ?? null;
    const sma50 = scanner.sma50 ?? null;
    const volume20Average = scanner.volume20Average ?? null;
    const volume50Average = scanner.volume50Average ?? null;
    const relativeVolume20 = scanner.relativeVolume20 ?? null;
    const relativeVolume50 = scanner.relativeVolume50 ?? null;
    const volumeSpike = scanner.volumeSpike ?? null;
    const distanceTo20DHigh = scanner.distanceTo20DHigh ?? null;
    const distanceTo50DHigh = scanner.distanceTo50DHigh ?? null;
    const isBreakout = scanner.isBreakout ?? null;
    const momentum5D = scanner.momentum5D ?? null;
    const momentum20D = scanner.momentum20D ?? null;
    const momentum60D = scanner.momentum60D ?? null;
    const marketRegime = scanner.marketRegime ?? 'UNKNOWN';
    const relativeStrength = scanner.relativeStrength ?? null;
    const relativeStrengthBenchmark = scanner.relativeStrengthBenchmark ?? 'UNAVAILABLE';

    // Compute price changes based on timeframe
    let priceChange1D: number | null = null;
    let priceChange5D: number | null = null;
    let priceChange20D: number | null = null;
    let priceChange60D: number | null = null;

    if (tf === '1d') {
      priceChange1D = currentPrice !== null ? currentPrice - (currentPrice ?? 0) : null; // simplified
    }

    // Determine availability
    const hasEssentialData = currentPrice !== null && rsi14 !== null && sma20 !== null;

    return {
      timeframe: tf,
      available: hasEssentialData,
      dataStatus: hasEssentialData ? 'AVAILABLE' : 'UNAVAILABLE',
      source: scanner.sourceProvenance?.source ?? 'REAL',
      retrievedAt: scanner.sourceProvenance?.retrievedAt ?? new Date().toISOString(),
      marketTimestamp: scanner.sourceProvenance?.marketTimestamp ?? new Date().toISOString(),
      currentPrice,
      priceChange1D,
      priceChange5D,
      priceChange20D,
      priceChange60D,
      volume20Average,
      volume50Average,
      relativeVolume20,
      relativeVolume50,
      volumeSpike,
      sma9,
      sma20,
      sma50,
      rsi14,
      macd,
      stochasticRsiK: scanner.stochasticRsiK ?? null,
      stochasticRsiD: scanner.stochasticRsiD ?? null,
      distanceTo20DHigh,
      distanceTo50DHigh,
      isBreakout,
      momentum5D,
      momentum20D,
      momentum60D,
      marketRegime,
      relativeStrength,
      relativeStrengthBenchmark,
    };
  }

  private rankSymbol(symbol: SymbolAnalysis): RankedSymbol {
    const compositeScore = this.computeCompositeScore(symbol);
    return {
      symbol: symbol.symbol,
      status: 'REJECTED',
      eliteScore: symbol.eliteScore,
      eliteRating: symbol.eliteRating,
      opportunityLevel: symbol.opportunityLevel,
      candidateScore: symbol.candidateScore,
      compositeScore: Math.round(compositeScore * 100) / 100,
      rank: 0,
      reasons: symbol.reasons,
    };
  }

  private computeCompositeScore(s: SymbolAnalysis): number {
    const w = this.config.compositeWeights;
    return (
      s.eliteScore * w.elite +
      s.opportunityScore * w.opportunity +
      s.candidateScore * w.candidate +
      s.financialScore * w.financial +
      s.technicalScore * w.technical +
      s.smartMoneyScore * w.smartMoney
    );
  }

  private assignRanks(symbols: RankedSymbol[]): RankedSymbol[] {
    symbols.forEach((s, i) => {
      s.rank = i + 1;
    });
    return symbols;
  }

  private isTopCandidate(symbol: RankedSymbol, original?: SymbolAnalysis): boolean {
    const oppScore = original?.opportunityScore ?? 0;
    const conf = original?.confidence ?? 1;
    return (
      symbol.eliteScore >= this.config.minEliteScore &&
      symbol.opportunityLevel !== 'NONE' &&
      oppScore >= this.config.minOpportunityScore &&
      symbol.candidateScore >= this.config.minCandidateScore &&
      conf >= this.config.minConfidence
    );
  }

  private isWatchlist(symbol: RankedSymbol): boolean {
    return (
      symbol.eliteScore >= this.config.watchlistEliteThreshold ||
      symbol.opportunityLevel === 'HIGH' ||
      symbol.opportunityLevel === 'VERY_HIGH'
    );
  }

  private computeStatistics(
    all: SymbolAnalysis[],
    topCandidates: RankedSymbol[],
    watchlist: RankedSymbol[],
    rejected: RankedSymbol[],
  ): ScannerStatistics {
    const total = all.length;
    const avgEliteScore = total > 0 ? all.reduce((s, x) => s + x.eliteScore, 0) / total : 0;
    const avgOpportunityScore =
      total > 0 ? all.reduce((s, x) => s + x.opportunityScore, 0) / total : 0;
    const avgCandidateScore = total > 0 ? all.reduce((s, x) => s + x.candidateScore, 0) / total : 0;

    const scoreDistribution: Record<string, number> = {
      AAA: 0,
      AA: 0,
      A: 0,
      BBB: 0,
      BB: 0,
      B: 0,
      C: 0,
      D: 0,
    };
    for (const s of all) {
      scoreDistribution[s.eliteRating] = (scoreDistribution[s.eliteRating] || 0) + 1;
    }

    return {
      totalSymbols: total,
      topCandidateCount: topCandidates.length,
      watchlistCount: watchlist.length,
      rejectedCount: rejected.length,
      avgEliteScore: Math.round(avgEliteScore * 100) / 100,
      avgOpportunityScore: Math.round(avgOpportunityScore * 100) / 100,
      avgCandidateScore: Math.round(avgCandidateScore * 100) / 100,
      scoreDistribution,
    };
  }

  private emptyResult(): MarketScannerResult {
    return {
      topCandidates: [],
      watchlist: [],
      rejected: [],
      statistics: {
        totalSymbols: 0,
        topCandidateCount: 0,
        watchlistCount: 0,
        rejectedCount: 0,
        avgEliteScore: 0,
        avgOpportunityScore: 0,
        avgCandidateScore: 0,
        scoreDistribution: {},
      },
      metadata: { scannedAt: new Date().toISOString(), totalProcessed: 0 },
    };
  }
}
