import { Injectable, Logger } from '@nestjs/common';
import { MarketDataOrchestrator } from '../orchestrator/market-data-orchestrator';
import { MarketDataPoint, MarketDataResult } from '../interfaces';
import { BISTIndex, MarketIntelligenceSummary } from '../interfaces/market-intelligence.types';
import { SymbolRegistryService } from '../symbol-registry/symbol-registry.service';
import { PLATFORM_TIMEFRAMES } from '../coverage/coverage-report.types';

@Injectable()
export class BistIndexService {
  private readonly logger = new Logger(BistIndexService.name);

  constructor(
    @Optional() orchestrator: MarketDataOrchestrator,
    @Optional() symbolRegistry: SymbolRegistryService,
  ) {}

  /**
   * Compute BIST100 index value from constituents with valid price data.
   * Equal-weighted index: average of (close / previousClose) for constituents with data.
   * Coverage = (% of 100 constituents with valid price data).
   * Rule: if coverage < 50%, return UNAVAILABLE (not enough data for meaningful index).
   */
  async computeBIST100(): Promise<BISTIndex | null> {
    try {
      if (!this.symbolRegistry || !this.orchestrator) {
        this.logger.warn(
          'SymbolRegistryService or Orchestrator not available for BIST100 computation',
        );
        return null;
      }

      const activeSymbols = this.symbolRegistry.getActiveSymbols();

      // Use first 10 active symbols as BIST100 proxy constituents
      const bist100Constituents = activeSymbols
        .slice(0, 10)
        .map((s) => s.canonicalTicker)
        .filter((ticker): ticker is string => ticker !== undefined && ticker !== null);

      if (bist100Constituents.length === 0) {
        this.logger.warn('No BIST100 constituents found in symbol registry');
        return null;
      }

      // Fetch latest price for each constituent
      const priceData: {
        symbol: string;
        close: number;
        previousClose: number;
        changePercent: number;
      }[] = [];
      let validCount = 0;

      for (const symbol of bist100Constituents) {
        try {
          const result = await this.orchestrator.fetchLatestPrice(symbol);
          if (result?.data && result.data.close !== null && result.data.previousClose !== null) {
            const close = result.data.close;
            const previousClose = result.data.previousClose;
            const changePercent = result.data.changePercent ?? 0;

            if (previousClose > 0) {
              priceData.push({ symbol, close, previousClose, changePercent });
              validCount++;
            }
          }
        } catch (error) {
          this.logger.debug(
            `Failed to fetch price for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const totalConstituents = bist100Constituents.length;
      const coverage =
        totalConstituents > 0 ? Math.round((validCount / totalConstituents) * 100) : 0;

      // Rule: if coverage < 50%, report UNAVAILABLE
      if (coverage < 50) {
        this.logger.log(`BIST100 coverage ${coverage}% < 50%, returning UNAVAILABLE`);
        return {
          symbol: 'BIST100',
          indexName: 'BIST100',
          value: null,
          previousClose: null,
          change: null,
          changePercent: null,
          timestamp: new Date().toISOString(),
          source: 'BIST_INDEX_DERIVED',
          coverage: 0,
        };
      }

      // Compute equal-weighted index
      // Index value: normalize based on average price/previousClose ratio
      let totalPriceSum = 0;
      let totalPreviousCloseSum = 0;

      for (const p of priceData) {
        totalPriceSum += p.close;
        totalPreviousCloseSum += p.previousClose;
      }

      const avgPrice = totalPriceSum / priceData.length;
      const avgPreviousClose = totalPreviousCloseSum / priceData.length;

      // Index value: ratio of avg price to avg previousClose, scaled to ~10000 base
      const indexValue =
        avgPreviousClose > 0 ? Math.round((avgPrice / avgPreviousClose) * 10000) : null;

      // Index change percent = average of individual symbol change percentages
      const totalChangePercent = priceData.reduce((sum, p) => sum + p.changePercent, 0);
      const avgChangePercent = totalChangePercent / priceData.length;

      // Index change value based on the normalized scale
      const indexChange =
        indexValue !== null
          ? Math.round((indexValue / 10000 - 1) * avgPreviousClose * 10000)
          : null;
      const indexChangePercent = avgPreviousClose > 0 ? avgChangePercent : null;

      const timestamp = priceData.length > 0 ? priceData[0].symbol : new Date().toISOString();

      this.logger.log(
        `BIST100 computed: value=${indexValue}, coverage=${coverage}%, valid=${validCount}/${totalConstituents}`,
      );

      return {
        symbol: 'BIST100',
        indexName: 'BIST100',
        value: indexValue,
        previousClose: avgPreviousClose,
        change: indexChange,
        changePercent: indexChangePercent,
        timestamp,
        source: 'BIST_INDEX_YAHOO_DERIVED',
        coverage,
      };
    } catch (error) {
      this.logger.error(
        `BIST100 computation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Compute BIST30 index value from constituents with valid price data.
   * Same methodology as BIST100 but with constituents at indices 10-40.
   */
  async computeBIST30(): Promise<BISTIndex | null> {
    try {
      if (!this.symbolRegistry || !this.orchestrator) {
        this.logger.warn(
          'SymbolRegistryService or Orchestrator not available for BIST30 computation',
        );
        return null;
      }

      const activeSymbols = this.symbolRegistry.getActiveSymbols();

      // Use symbols at indices 10-39 as BIST30 proxy (first 30 minus BIST100 overlap)
      const bist30Constituents = activeSymbols
        .slice(10, 40)
        .map((s) => s.canonicalTicker)
        .filter(
          (ticker): ticker is string =>
            ticker !== undefined && ticker !== null && ticker !== 'THYAO' && ticker !== 'AKBNK',
        );

      if (bist30Constituents.length === 0) {
        this.logger.warn('No BIST30 constituents found in symbol registry');
        return null;
      }

      // Fetch latest price for each constituent
      const priceData: {
        symbol: string;
        close: number;
        previousClose: number;
        changePercent: number;
      }[] = [];
      let validCount = 0;

      for (const symbol of bist30Constituents) {
        try {
          const result = await this.orchestrator.fetchLatestPrice(symbol);
          if (result?.data && result.data.close !== null && result.data.previousClose !== null) {
            const close = result.data.close;
            const previousClose = result.data.previousClose;
            const changePercent = result.data.changePercent ?? 0;

            if (previousClose > 0) {
              priceData.push({ symbol, close, previousClose, changePercent });
              validCount++;
            }
          }
        } catch (error) {
          this.logger.debug(
            `Failed to fetch price for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const totalConstituents = bist30Constituents.length;
      const coverage =
        totalConstituents > 0 ? Math.round((validCount / totalConstituents) * 100) : 0;

      // Rule: if coverage < 50%, return UNAVAILABLE
      if (coverage < 50) {
        this.logger.log(`BIST30 coverage ${coverage}% < 50%, returning UNAVAILABLE`);
        return {
          symbol: 'BIST30',
          indexName: 'BIST30',
          value: null,
          previousClose: null,
          change: null,
          changePercent: null,
          timestamp: new Date().toISOString(),
          source: 'BIST_INDEX_DERIVED',
          coverage: 0,
        };
      }

      // Compute equal-weighted index
      let totalPriceSum = 0;
      let totalPreviousCloseSum = 0;

      for (const p of priceData) {
        totalPriceSum += p.close;
        totalPreviousCloseSum += p.previousClose;
      }

      const avgPrice = totalPriceSum / priceData.length;
      const avgPreviousClose = totalPreviousCloseSum / priceData.length;

      const indexValue =
        avgPreviousClose > 0 ? Math.round((avgPrice / avgPreviousClose) * 10000) : null;

      // Index change percent = average of individual symbol change percentages
      const totalChangePercent = priceData.reduce((sum, p) => sum + p.changePercent, 0);
      const avgChangePercent = totalChangePercent / priceData.length;

      const indexChange =
        indexValue !== null
          ? Math.round((indexValue / 10000 - 1) * avgPreviousClose * 10000)
          : null;
      const indexChangePercent = avgPreviousClose > 0 ? avgChangePercent : null;

      const timestamp = priceData.length > 0 ? priceData[0].symbol : new Date().toISOString();

      this.logger.log(
        `BIST30 computed: value=${indexValue}, coverage=${coverage}%, valid=${validCount}/${totalConstituents}`,
      );

      return {
        symbol: 'BIST30',
        indexName: 'BIST30',
        value: indexValue,
        previousClose: avgPreviousClose,
        change: indexChange,
        changePercent: indexChangePercent,
        timestamp,
        source: 'BIST_INDEX_YAHOO_DERIVED',
        coverage,
      };
    } catch (error) {
      this.logger.error(
        `BIST30 computation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Compute full market intelligence summary aggregating all features.
   */
  async computeMarketIntelligenceSummary(): Promise<MarketIntelligenceSummary> {
    try {
      const [bist100, bist30] = await Promise.all([this.computeBIST100(), this.computeBIST30()]);

      // Compute market breadth from available price data
      const breadth = await this.computeMarketBreadth();
      const advanceDecline = this.computeAdvanceDeclineRatio(breadth);

      // Compute relative strength for each test symbol vs BIST100
      const testSymbols = ['THYAO', 'AKBNK', 'ASELS', 'BIMAS', 'TUPRS', 'GARAN'];
      const relativeStrength: Record<string, RelativeStrength | null> = {};

      for (const symbol of testSymbols) {
        const rs = await this.computeRelativeStrength(symbol);
        relativeStrength[symbol] = rs;
      }

      // Compute volume intelligence for each test symbol
      const volume: Record<string, VolumeIntelligence | null> = {};

      for (const symbol of testSymbols) {
        const vi = await this.computeVolumeIntelligence(symbol);
        volume[symbol] = vi;
      }

      // Turnover currently UNAVAILABLE - no BIST programmatic API
      const turnover: TurnoverData | null = null;

      // Compute market regime
      const regime = await this.computeMarketRegime();

      // Data quality metadata
      const freshness = 'UNAVAILABLE'; // will be REALTIME when real-time data flows
      const coverage = '0%'; // will update based on actual coverage computation
      const lastRefreshed = new Date().toISOString();
      const sourcesVerified = ['Yahoo Finance'];

      return {
        bist100,
        bist30,
        breadth: breadth
          ? {
              ...breadth,
              status: breadth.status as MarketBreadthStatus,
            }
          : null,
        advanceDecline,
        relativeStrength,
        volume,
        turnover,
        regime,
        dataQuality: {
          freshness,
          coverage: coverage as DataCoverage,
          lastRefreshed,
          sourcesVerified,
        },
      };
    } catch (error) {
      this.logger.error(
        `Market intelligence summary computation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.getEmptySummary();
    }
  }

  private getEmptySummary(): MarketIntelligenceSummary {
    return {
      bist100: null,
      bist30: null,
      breadth: null,
      advanceDecline: {
        ratio: null,
        advancers: 0,
        decliners: 0,
        zeroDecliners: true,
        status: 'UNAVAILABLE',
        confidence: 'NONE',
      },
      relativeStrength: {},
      volume: {},
      turnover: null,
      regime: null,
      dataQuality: {
        freshness: 'UNAVAILABLE',
        coverage: 'NONE',
        lastRefreshed: new Date().toISOString(),
        sourcesVerified: [],
      },
    };
  }

  /**
   * Compute market breadth (advancers / decliners / unchanged)
   * from symbols with valid price data in the symbol registry.
   */
  private async computeMarketBreadth(): Promise<MarketBreadth | null> {
    try {
      if (!this.symbolRegistry || !this.orchestrator) {
        return null;
      }

      const activeSymbols = this.symbolRegistry.getActiveSymbols();
      const priceData: {
        symbol: string;
        changePercent: number;
        close: number;
        previousClose: number;
      }[] = [];

      for (const symbolInfo of activeSymbols) {
        const symbol = symbolInfo.canonicalTicker;
        if (!symbol) continue;

        try {
          const result = await this.orchestrator.fetchLatestPrice(symbol);
          if (result?.data && result.data.close !== null && result.data.previousClose !== null) {
            priceData.push({
              symbol,
              changePercent: result.data.changePercent ?? 0,
              close: result.data.close,
              previousClose: result.data.previousClose,
            });
          }
        } catch (error) {
          this.logger.debug(`Failed to fetch breadth data for ${symbol}`);
        }
      }

      if (priceData.length === 0) {
        return null;
      }

      // Classify each symbol
      let advancers = 0;
      let decliners = 0;
      let unchanged = 0;

      // Threshold: |changePercent| < 0.5% considered unchanged
      const unchangedThreshold = 0.5;

      for (const p of priceData) {
        if (Math.abs(p.changePercent) < unchangedThreshold) {
          unchanged++;
        } else if (p.changePercent > 0) {
          advancers++;
        } else {
          decliners++;
        }
      }

      const totalUniverse = priceData.length;
      const totalSymbolsInRegistry = activeSymbols.length;
      const coverage =
        totalSymbolsInRegistry > 0 ? Math.round((totalUniverse / totalSymbolsInRegistry) * 100) : 0;

      let status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
      if (coverage >= 70) status = 'AVAILABLE';
      else if (coverage >= 30) status = 'PARTIAL';
      else status = 'UNAVAILABLE';

      return {
        advancers,
        decliners,
        unchanged,
        totalUniverse,
        coverage: coverage as DataCoverage,
        status,
        timestamp: new Date().toISOString(),
        source: 'BIST_BREADTH_DERIVED',
      };
    } catch (error) {
      this.logger.error(
        `Market breadth computation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Compute advance/decline ratio from breadth data.
   * Rule: if decliners = 0, return null ratio (avoid division by zero).
   */
  private computeAdvanceDeclineRatio(breadth: MarketBreadth | null): AdvanceDeclineRatio {
    if (!breadth || breadth.decliners === 0) {
      return {
        ratio: null,
        advancers: breadth?.advancers ?? 0,
        decliners: breadth?.decliners ?? 0,
        zeroDecliners: true,
        status: 'UNAVAILABLE',
        confidence: 'NONE',
      };
    }

    const ratio = Math.round((breadth.advancers / breadth.decliners) * 100) / 100; // 2 decimal places

    return {
      ratio,
      advancers: breadth.advancers,
      decliners: breadth.decliners,
      zeroDecliners: false,
      status: breadth.status === 'AVAILABLE' ? 'CALCULATED' : 'PARTIAL',
      confidence: breadth.confidence !== undefined ? breadth.confidence : 'MEDIUM',
    };
  }

  /**
   * Compute relative strength for a symbol vs BIST100.
   * Relative Strength = Symbol Return - BIST100 Return
   * Symbol Return = (currentClose / previousClose - 1) * 100
   * BIST100 Return = (indexValue / (previousClose * 10000) - 1) * 10000 (normalized)
   */
  private async computeRelativeStrength(symbol: string): Promise<RelativeStrength | null> {
    try {
      // Fetch symbol latest price
      const symbolResult = await this.orchestrator.fetchLatestPrice(symbol);
      if (
        !symbolResult?.data ||
        symbolResult.data.close === null ||
        symbolResult.data.previousClose === null
      ) {
        return {
          symbol,
          vsMarket: null,
          vsSector: null,
          market: 'BIST100',
          timeframe: '1D',
          status: 'UNAVAILABLE',
          confidence: 'NONE',
          calculationTimestamp: new Date().toISOString(),
        };
      }

      const symbolClose = symbolResult.data.close;
      const symbolPreviousClose = symbolResult.data.previousClose;
      const symbolChangePercent = symbolResult.data.changePercent;

      // Fetch BIST100 index
      const bist100Result = await this.computeBIST100();
      if (!bist100Result || bist100Result.value === null) {
        return {
          symbol,
          vsMarket: null,
          vsSector: null,
          market: 'BIST100',
          timeframe: '1D',
          status: 'UNAVAILABLE',
          confidence: 'NONE',
          calculationTimestamp: new Date().toISOString(),
        };
      }

      // Compute symbol return percentage
      const symbolReturnPct =
        symbolPreviousClose > 0 ? (symbolClose / symbolPreviousClose - 1) * 100 : 0;

      // Compute BIST100 return percentage
      // indexValue is normalized to ~10000 base, previousClose is the avg previous close
      const marketReturnPct =
        bist100Result.previousClose > 0
          ? ((bist100Result.value! / (bist100Result.previousClose! * 10000)) * 10000 - 1) * 100
          : 0;

      // Actually, simpler: use the index changePercent if available, or compute from value/previousClose
      // The indexValue is normalized, so: return = (value / (previousClose * 10000) - 1) * 100 * 10000 / 10000
      // Let's just use changePercent from the index computation if we have it, otherwise derive

      // More direct: compute from the raw data we have
      // The BIST100 previousClose is avgPreviousClose, value is the normalized index
      // Return = (value / (previousClose * 10000) - 1) * 100 gives us the percentage change from the base

      // Actually, let's just compute the difference in change percentages
      // Symbol has changePercent from Yahoo, index has changePercent from its computation
      const rsDifference =
        symbolChangePercent !== undefined
          ? symbolChangePercent - bist100Result.changePercent!
          : symbolReturnPct - marketReturnPct;

      return {
        symbol,
        vsMarket: rsDifference,
        vsSector: null, // sector index not available yet
        market: 'BIST100',
        timeframe: '1D',
        status: 'CALCULATED',
        confidence: 'MEDIUM',
        calculationTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Relative strength computation failed for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        symbol,
        vsMarket: null,
        vsSector: null,
        market: 'BIST100',
        timeframe: '1D',
        status: 'UNAVAILABLE',
        confidence: 'NONE',
        calculationTimestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Compute volume intelligence for a symbol.
   * Relative volume = current volume / N-day average volume.
   * Volume spike: current > threshold * average (default threshold = 2.0).
   */
  private async computeVolumeIntelligence(symbol: string): Promise<VolumeIntelligence | null> {
    try {
      // Fetch latest price with volume
      const latestResult = await this.orchestrator.fetchLatestPrice(symbol);
      if (!latestResult?.data) {
        return {
          symbol,
          currentVolume: null,
          averageVolume: null,
          relativeVolume: null,
          volumeChangePercent: null,
          volumeSpike: null,
          spikeThreshold: 2.0,
          status: 'UNAVAILABLE',
          confidence: 'NONE',
        };
      }

      const currentVolume = latestResult.data.volume ?? null;

      // Try to fetch historical data for 20-day average volume
      let averageVolume: number | null = null;
      let relativeVolume: number | null = null;
      let volumeSpike: boolean | null = null;
      let volumeChangePercent: number | null = null;

      try {
        const historicalResult = await this.orchestrator.fetchHistoricalData(symbol, '1d', {
          limit: 20,
        });
        if (historicalResult?.data && historicalResult.data.length > 0) {
          // Compute 20-day average volume (only positive volumes)
          const volumes = historicalResult.data.map((p: any) => p.volume ?? 0);
          const validVolumes = volumes.filter((v: number) => v > 0);

          if (validVolumes.length > 0) {
            const avg =
              validVolumes.reduce((sum: number, v: number) => sum + v, 0) / validVolumes.length;
            averageVolume = Math.round(avg);

            if (currentVolume !== null && currentVolume > 0 && averageVolume > 0) {
              relativeVolume = Math.round((currentVolume / averageVolume) * 100) / 100; // 2 decimal places

              // Volume spike: current >= 2x average (configurable threshold)
              const spikeThreshold = 2.0;
              volumeSpike = relativeVolume! >= spikeThreshold;

              // Volume change from previous period (compare current avg to prior period avg)
              if (historicalResult.data.length >= 2) {
                const prevVolumes = historicalResult.data
                  .slice(0, -1)
                  .map((p: any) => p.volume ?? 0);
                const prevValidVolumes = prevVolumes.filter((v: number) => v > 0);
                if (prevValidVolumes.length > 0) {
                  const prevAvg =
                    prevValidVolumes.reduce((sum: number, v: number) => sum + v, 0) /
                    prevValidVolumes.length;
                  if (averageVolume > 0 && prevAvg > 0) {
                    volumeChangePercent =
                      Math.round((averageVolume / prevAvg - 1) * 100 * 100) / 100;
                  }
                }
              }
            }
          }
        }
      } catch (historicalError) {
        this.logger.debug(
          `Historical data not available for ${symbol} volume: ${historicalError instanceof Error ? historicalError.message : String(historicalError)}`,
        );
        // Continue with current volume only; average will remain null
      }

      return {
        symbol,
        currentVolume,
        averageVolume,
        relativeVolume,
        volumeChangePercent,
        volumeSpike,
        spikeThreshold: 2.0,
        status: averageVolume !== null ? 'CALCULATED' : 'UNAVAILABLE',
        confidence: averageVolume !== null ? 'MEDIUM' : 'NONE',
      };
    } catch (error) {
      this.logger.error(
        `Volume intelligence computation failed for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        symbol,
        currentVolume: null,
        averageVolume: null,
        relativeVolume: null,
        volumeChangePercent: null,
        volumeSpike: null,
        spikeThreshold: 2.0,
        status: 'UNAVAILABLE',
        confidence: 'NONE',
      };
    }
  }

  /**
   * Compute market regime based on breadth and index trend.
   * Deterministic rules documented in R2-061:
   * - BULL: breadth > 50% advancers AND index in uptrend
   * - BEAR: breadth > 50% decliners AND index in downtrend
   * - SIDEWAYS: neither BULL nor BEAR criteria met
   * - UNKNOWN: insufficient data for classification
   */
  private async computeMarketRegime(): Promise<MarketRegimeData | null> {
    try {
      // Get market breadth
      const breadth = await this.computeMarketBreadth();
      if (!breadth) {
        return {
          regime: 'UNKNOWN',
          confidence: 'NONE' as RegimeConfidence,
          supportingIndicators: {
            breadth: null,
            momentum: null as 'UP' | 'DOWN' | 'SIDEWAYS' | null,
            trend: null as 'UP' | 'DOWN' | 'SIDEWAYS' | null,
          },
          timestamp: new Date().toISOString(),
          source: 'BIST_REGIME_DERIVED',
          explanation: 'Insufficient data for regime classification: market breadth unavailable',
        };
      }

      // Get BIST100 index for trend analysis
      const bist100 = await this.computeBIST100();

      // If we have breadth but no index data, classify based on breadth alone
      if (!bist100) {
        if (breadth.advancers > breadth.decliners) {
          return {
            regime: 'BULL',
            confidence:
              breadth.coverage >= 70
                ? 'HIGH'
                : breadth.coverage >= 30
                  ? 'MEDIUM'
                  : ('LOW' as RegimeConfidence),
            supportingIndicators: {
              breadth: breadth.advancers - breadth.decliners,
              momentum: 'UP' as 'UP' | 'DOWN' | 'SIDEWAYS',
              trend: 'UP' as 'UP' | 'DOWN' | 'SIDEWAYS',
            },
            timestamp: new Date().toISOString(),
            source: 'BIST_REGIME_BREADTH_ONLY',
            explanation: `BULL regime: ${breadth.advancers} advancers vs ${breadth.decliners} decliners (coverage: ${breadth.coverage}%), index data unavailable but breadth positive`,
          };
        } else if (breadth.decliners > breadth.advancers) {
          return {
            regime: 'BEAR',
            confidence:
              breadth.coverage >= 70
                ? 'HIGH'
                : breadth.coverage >= 30
                  ? 'MEDIUM'
                  : ('LOW' as RegimeConfidence),
            supportingIndicators: {
              breadth: breadth.advancers - breadth.decliners,
              momentum: 'DOWN' as 'UP' | 'DOWN' | 'SIDEWAYS',
              trend: 'DOWN' as 'UP' | 'DOWN' | 'SIDEWAYS',
            },
            timestamp: new Date().toISOString(),
            source: 'BIST_REGIME_BREADTH_ONLY',
            explanation: `BEAR regime: ${breadth.decliners} decliners vs ${breadth.advancers} advancers (coverage: ${breadth.coverage}%), index data unavailable but breadth negative`,
          };
        } else {
          return {
            regime: 'SIDEWAYS',
            confidence:
              breadth.coverage >= 70
                ? 'HIGH'
                : breadth.coverage >= 30
                  ? 'MEDIUM'
                  : ('LOW' as RegimeConfidence),
            supportingIndicators: {
              breadth: breadth.advancers - breadth.decliners,
              momentum: 'SIDEWAYS' as 'UP' | 'DOWN' | 'SIDEWAYS',
              trend: 'SIDEWAYS' as 'UP' | 'DOWN' | 'SIDEWAYS',
            },
            timestamp: new Date().toISOString(),
            source: 'BIST_REGIME_BREADTH_ONLY',
            explanation: `SIDEWAYS regime: approximately equal advancers (${breadth.advancers}) and decliners (${breadth.decliners}) (coverage: ${breadth.coverage}%), index data unavailable`,
          };
        }
      }

      // We have both breadth and index data - use full classification
      const indexChange = bist100.change ?? 0;
      const indexUptrend = indexChange > 0;
      const indexDowntrend = indexChange < 0;
      const positiveBreadth = breadth.advancers > breadth.decliners;
      const negativeBreadth = breadth.decliners > breadth.advancers;

      if (positiveBreadth && indexUptrend) {
        return {
          regime: 'BULL',
          confidence:
            breadth.coverage >= 70
              ? 'HIGH'
              : breadth.coverage >= 30
                ? 'MEDIUM'
                : ('LOW' as RegimeConfidence),
          supportingIndicators: {
            breadth: breadth.advancers - breadth.decliners,
            momentum: 'UP' as 'UP' | 'DOWN' | 'SIDEWAYS',
            trend: 'UP' as 'UP' | 'DOWN' | 'SIDEWAYS',
          },
          timestamp: new Date().toISOString(),
          source: 'BIST_REGIME_FULL',
          explanation: `BULL regime: ${breadth.advancers} advancers vs ${breadth.decliners} decliners, BIST100 ${indexChange > 0 ? 'up' : 'down'} (change: ${indexChange}%), coverage ${breadth.coverage}%`,
        };
      }

      if (negativeBreadth && indexDowntrend) {
        return {
          regime: 'BEAR',
          confidence:
            breadth.coverage >= 70
              ? 'HIGH'
              : breadth.coverage >= 30
                ? 'MEDIUM'
                : ('LOW' as RegimeConfidence),
          supportingIndicators: {
            breadth: breadth.advancers - breadth.decliners,
            momentum: 'DOWN' as 'UP' | 'DOWN' | 'SIDEWAYS',
            trend: 'DOWN' as 'UP' | 'DOWN' | 'SIDEWAYS',
          },
          timestamp: new Date().toISOString(),
          source: 'BIST_REGIME_FULL',
          explanation: `BEAR regime: ${breadth.decliners} decliners vs ${breadth.advancers} advancers, BIST100 ${indexChange < 0 ? 'down' : 'up'} (change: ${indexChange}%), coverage ${breadth.coverage}%`,
        };
      }

      // Not enough criteria for BULL or BEAR - check for SIDEWAYS
      if (positiveBreadth && !indexUptrend && !indexDowntrend) {
        return {
          regime: 'SIDEWAYS',
          confidence:
            breadth.coverage >= 70
              ? 'HIGH'
              : breadth.coverage >= 30
                ? 'MEDIUM'
                : ('LOW' as RegimeConfidence),
          supportingIndicators: {
            breadth: breadth.advancers - breadth.decliners,
            momentum: 'SIDEWAYS' as 'UP' | 'DOWN' | 'SIDEWAYS',
            trend: 'SIDEWAYS' as 'UP' | 'DOWN' | 'SIDEWAYS',
          },
          timestamp: new Date().toISOString(),
          source: 'BIST_REGIME_FULL',
          explanation: `SIDEWAYS regime: ${breadth.advancers} advancers vs ${breadth.decliners} decliners, BIST100 flat (change: ${indexChange}%), coverage ${breadth.coverage}%`,
        };
      }

      if (negativeBreadth && !indexUptrend && !indexDowntrend) {
        return {
          regime: 'SIDEWAYS',
          confidence:
            breadth.coverage >= 70
              ? 'HIGH'
              : breadth.coverage >= 30
                ? 'MEDIUM'
                : ('LOW' as RegimeConfidence),
          supportingIndicators: {
            breadth: breadth.advancers - breadth.decliners,
            momentum: 'SIDEWAYS' as 'UP' | 'DOWN' | 'SIDEWAYS',
            trend: 'SIDEWAYS' as 'UP' | 'DOWN' | 'SIDEWAYS',
          },
          timestamp: new Date().toISOString(),
          source: 'BIST_REGIME_FULL',
          explanation: `SIDEWAYS regime: ${breadth.decliners} decliners vs ${breadth.advancers} advancers, BIST100 flat (change: ${indexChange}%), coverage ${breadth.coverage}%`,
        };
      }

      // Fallback: uncertain case
      return {
        regime: 'UNKNOWN',
        confidence: 'NONE' as RegimeConfidence,
        supportingIndicators: {
          breadth: breadth.advancers - breadth.decliners,
          momentum: 'UNKNOWN' as 'UP' | 'DOWN' | 'SIDEWAYS',
          trend: 'UNKNOWN' as 'UP' | 'DOWN' | 'SIDEWAYS',
        },
        timestamp: new Date().toISOString(),
        source: 'BIST_REGIME_FULL',
        explanation: `UNKNOWN regime: insufficient criteria to classify (advancers: ${breadth.advancers}, decliners: ${breadth.decliners}, coverage: ${breadth.coverage}%)`,
      };
    } catch (error) {
      this.logger.error(
        `Market regime computation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        regime: 'UNKNOWN',
        confidence: 'NONE' as RegimeConfidence,
        supportingIndicators: {
          breadth: null,
          momentum: null as 'UP' | 'DOWN' | 'SIDEWAYS' | null,
          trend: null as 'UP' | 'DOWN' | 'SIDEWAYS' | null,
        },
        timestamp: new Date().toISOString(),
        source: 'BIST_REGIME_ERROR',
        explanation: `Regime computation error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
