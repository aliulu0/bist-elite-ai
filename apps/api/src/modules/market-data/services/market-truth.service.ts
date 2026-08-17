import { Injectable, Logger } from '@nestjs/common';
import { MarketDataOrchestrator } from '../orchestrator/market-data-orchestrator';
import { MarketDataPoint, MarketDataResult } from '../interfaces';
import { DataQuality } from '../interfaces/unified-domain.types';
import { SerpApiAdapter } from '../providers/unified/serpapi.adapter';
import { YahooFinanceProvider } from '../providers/yahoo-finance.provider';
import { AgentReachProvider } from '../../research/providers/agent-reach.provider';
import { SymbolRegistryService } from '../../market-data/symbol-registry/symbol-registry.service';
import { FintablesProvider } from '../providers/fintables.provider';
import { TrendDirection } from '../../market-structure/market-structure.types';

export interface ProviderPriceSnapshot {
  provider: string;
  providerSymbol: string;
  price: number | null;
  currency: string | null;
  timestamp: string | null;
  freshnessSeconds: number | null;
  validationStatus: 'VALID' | 'INVALID' | 'UNAVAILABLE' | 'RESEARCH_EVIDENCE';
  source: string | null;
  rawResponse: unknown | null;
}

export interface ConsensusResult {
  consensusPrice: number | null;
  consensusCurrency: string | null;
  status:
    | 'SINGLE_SOURCE_VERIFIED'
    | 'MULTI_SOURCE_CONFIRMED'
    | 'MULTI_SOURCE_CONFIRMED_RESEARCH_SUPPORTED'
    | 'PRICE_CONFLICT'
    | 'UNAVAILABLE'
    | 'SINGLE_SOURCE_UNAVAILABLE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  sources: ProviderPriceSnapshot[];
  conflict?: {
    detected: boolean;
    maxDifference: number | null;
    maxDifferencePercent: number | null;
    contributingSources: string[];
  };
  freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  generatedAt: string;
}

@Injectable()
@Injectable()
export class MarketTruthService {
  private readonly logger = new Logger(MarketTruthService.name);
  private readonly TOLERANCE_PERCENT = 5; // 5% price difference tolerance for consensus
  private readonly MAX_PRICE_DIFFERENCE_TRY = 10; // 10 TRY absolute difference for BIST prices

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly symbolRegistry: SymbolRegistryService,
  ) {}

  /**
   * Get price snapshots from all available providers for a ticker.
   */
  async getProviderPrices(ticker: string): Promise<ProviderPriceSnapshot[]> {
    const snapshots: ProviderPriceSnapshot[] = [];
    // Normalize symbol inline (the orchestrator also normalizes internally)
    const normalized = ticker.trim().toUpperCase();

    // 1. Yahoo Finance (PRIMARY_MARKET_DATA)
    try {
      const yahooResult = await this.orchestrator.fetchLatestPrice(normalized);
      if (yahooResult?.data) {
        const point = yahooResult.data;
        snapshots.push({
          provider: 'yahoo-finance',
          providerSymbol: point.symbol,
          price: point.close,
          currency: point.symbol.includes('.IS') ? 'TRY' : point.symbol.split('.')[1] || 'TRY',
          timestamp: point.timestamp,
          freshnessSeconds: this.computeFreshness(point.timestamp),
          validationStatus: 'VALID',
          source: 'yahoo_finance',
          rawResponse: yahooResult,
        });
      } else {
        snapshots.push({
          provider: 'yahoo-finance',
          providerSymbol: normalized,
          price: null,
          currency: null,
          timestamp: null,
          freshnessSeconds: null,
          validationStatus: 'UNAVAILABLE',
          source: 'yahoo_finance',
          rawResponse: yahooResult,
        });
      }
    } catch (error) {
      this.logger.warn(
        `Yahoo Finance failed for ${ticker}: ${error instanceof Error ? error.message : String(error)}`,
      );
      snapshots.push({
        provider: 'yahoo-finance',
        providerSymbol: normalized,
        price: null,
        currency: null,
        timestamp: null,
        freshnessSeconds: null,
        validationStatus: 'UNAVAILABLE',
        source: 'yahoo_finance',
        rawResponse: null,
      });
    }

    // 2. Google Finance via SerpAPI (SECONDARY_MARKET_DATA)
    try {
      const serpapiAdapter = new SerpApiAdapter(this.orchestrator['circuitBreaker'] as any, {
        apiKey: process.env.SERPAPI_API_KEY,
      });
      const googleFinance = await serpapiAdapter.fetchGoogleFinance(normalized);
      if (googleFinance && googleFinance.price !== null) {
        snapshots.push({
          provider: 'serpapi',
          providerSymbol: normalized,
          price: googleFinance.price,
          currency: googleFinance.currency,
          timestamp: googleFinance.timestamp,
          freshnessSeconds: this.computeFreshness(googleFinance.timestamp),
          validationStatus: 'VALID',
          source: 'google_finance',
          rawResponse: googleFinance,
        });
      } else {
        snapshots.push({
          provider: 'serpapi',
          providerSymbol: normalized,
          price: null,
          currency: null,
          timestamp: null,
          freshnessSeconds: null,
          validationStatus: 'UNAVAILABLE',
          source: 'google_finance',
          rawResponse: null,
        });
      }
    } catch (error) {
      this.logger.warn(
        `SerpAPI Google Finance failed for ${ticker}: ${error instanceof Error ? error.message : String(error)}`,
      );
      snapshots.push({
        provider: 'serpapi',
        providerSymbol: normalized,
        price: null,
        currency: null,
        timestamp: null,
        freshnessSeconds: null,
        validationStatus: 'UNAVAILABLE',
        source: 'google_finance',
        rawResponse: null,
      });
    }

    // 3. Agent-Reach (RESEARCH_PRICE_EVIDENCE)
    try {
      const agentReach = new AgentReachProvider(
        this.orchestrator['circuitBreaker'] as any,
        this.symbolRegistry,
        { apiKey: process.env.SERPAPI_API_KEY },
      );
      const researchResult = await agentReach.searchCompany(normalized, {
        keywords: ['fiyat', 'price'],
      });
      // Extract price from research results if available
      let researchPrice: number | null = null;
      let researchSource: string | null = null;

      if (researchResult.results.length > 0) {
        for (const source of researchResult.results) {
          // Try to parse price from title/snippet
          const priceMatch =
            source.title?.match(/(\d+[.,]?\d*)\s*TRY/i) || source.title?.match(/(\d+[.,]?\d*)/);
          if (priceMatch) {
            const parsed = parseFloat(priceMatch[1].replace(',', '.'));
            if (!isNaN(parsed) && parsed > 0) {
              researchPrice = parsed;
              researchSource = source.url ?? 'agent-reach';
              break;
            }
          }
        }
      }

      if (researchPrice !== null) {
        snapshots.push({
          provider: 'agent-reach',
          providerSymbol: normalized,
          price: researchPrice,
          currency: 'TRY',
          timestamp: new Date().toISOString(),
          freshnessSeconds: 0,
          validationStatus: 'RESEARCH_EVIDENCE',
          source: researchSource,
          rawResponse: researchResult,
        });
      } else {
        // Still add a snapshot to indicate Agent-Reach was queried but no price found
        snapshots.push({
          provider: 'agent-reach',
          providerSymbol: normalized,
          price: null,
          currency: null,
          timestamp: new Date().toISOString(),
          freshnessSeconds: null,
          validationStatus: 'RESEARCH_EVIDENCE',
          source: 'agent-reach-search',
          rawResponse: researchResult,
        });
      }
    } catch (error) {
      this.logger.warn(
        `Agent-Reach failed for ${ticker}: ${error instanceof Error ? error.message : String(error)}`,
      );
      snapshots.push({
        provider: 'agent-reach',
        providerSymbol: normalized,
        price: null,
        currency: null,
        timestamp: new Date().toISOString(),
        freshnessSeconds: null,
        validationStatus: 'RESEARCH_EVIDENCE',
        source: 'agent-reach-error',
        rawResponse: null,
      });
    }

    // 4. Fintables (SECONDARY_FUNDAMENTAL_DATA)
    try {
      const fintables = new FintablesProvider();
      const profile = await fintables.getCompanyProfile(normalized);
      if (profile && profile.lastUpdated) {
        // Fintables may not have current price, but we include the snapshot
        snapshots.push({
          provider: 'fintables',
          providerSymbol: normalized,
          price: null, // Fintables fundamentals don't directly give current price
          currency: profile.marketCap > 0 ? 'TRY' : null,
          timestamp: profile.lastUpdated,
          freshnessSeconds: this.computeFreshness(profile.lastUpdated),
          validationStatus: 'UNAVAILABLE',
          source: 'fintables',
          rawResponse: profile,
        });
      } else {
        snapshots.push({
          provider: 'fintables',
          providerSymbol: normalized,
          price: null,
          currency: null,
          timestamp: null,
          freshnessSeconds: null,
          validationStatus: 'UNAVAILABLE',
          source: 'fintables',
          rawResponse: null,
        });
      }
    } catch (error) {
      this.logger.warn(
        `Fintables failed for ${ticker}: ${error instanceof Error ? error.message : String(error)}`,
      );
      snapshots.push({
        provider: 'fintables',
        providerSymbol: normalized,
        price: null,
        currency: null,
        timestamp: null,
        freshnessSeconds: null,
        validationStatus: 'UNAVAILABLE',
        source: 'fintables',
        rawResponse: null,
      });
    }

    return snapshots;
  }

  /**
   * Compute consensus from provider price snapshots.
   */
  computeConsensus(snapshots: ProviderPriceSnapshot[]): ConsensusResult {
    this.logger.debug(`Computing consensus for ${snapshots.length} provider snapshots`);

    // Separate validated prices from research evidence
    const validatedSnapshots = snapshots.filter((s) => s.validationStatus === 'VALID');
    const researchSnapshots = snapshots.filter((s) => s.validationStatus === 'RESEARCH_EVIDENCE');
    const unavailableSnapshots = snapshots.filter((s) => s.validationStatus === 'UNAVAILABLE');

    // If no validated prices at all
    if (validatedSnapshots.length === 0 && researchSnapshots.length === 0) {
      return {
        consensusPrice: null,
        consensusCurrency: null,
        status: 'UNAVAILABLE',
        confidence: 'NONE',
        sources: snapshots,
        freshness: 'UNKNOWN',
        generatedAt: new Date().toISOString(),
      };
    }

    // If only one validated source -> SINGLE_SOURCE_VERIFIED
    if (validatedSnapshots.length === 1) {
      const single = validatedSnapshots[0];
      return {
        consensusPrice: single.price,
        consensusCurrency: single.currency,
        status: 'SINGLE_SOURCE_VERIFIED' as const,
        confidence: 'HIGH' as const,
        sources: snapshots,
        freshness:
          single.freshnessSeconds !== null && single.freshnessSeconds < 300
            ? 'FRESH'
            : single.freshnessSeconds !== null && single.freshnessSeconds < 3600
              ? 'STALE'
              : 'UNKNOWN',
        generatedAt: new Date().toISOString(),
      };
    }

    // If multiple validated sources -> check for agreement
    if (validatedSnapshots.length >= 2) {
      const prices = validatedSnapshots
        .map((s) => s.price!)
        .filter((p): p is number => p !== null && !isNaN(p));

      if (prices.length >= 2) {
        // Compute max difference
        let maxDiff = 0;
        let maxDiffPercent = 0;
        const priceSet = new Set<number>();
        for (const p of prices) priceSet.add(p);

        const priceArray = Array.from(priceSet);
        if (priceArray.length >= 2) {
          priceArray.sort((a, b) => a - b);
          const minPrice = priceArray[0];
          const maxPrice = priceArray[priceArray.length - 1];
          maxDiff = maxPrice - minPrice;
          maxDiffPercent = (maxDiff / minPrice) * 100;
        }

        // Check agreement within tolerance
        const agreementThresholdPercent = this.TOLERANCE_PERCENT;
        const agreementThresholdTry = this.MAX_PRICE_DIFFERENCE_TRY;

        const allAgree = validatedSnapshots.every((s, i, arr) =>
          arr.every((sj) => {
            if (s.price === null || sj.price === null) return true;
            const absDiff = Math.abs(s.price - sj.price);
            const percentDiff = (absDiff / Math.max(s.price, sj.price, 1)) * 100;
            return absDiff <= agreementThresholdTry && percentDiff <= agreementThresholdPercent;
          }),
        );

        if (allAgree) {
          // Compute consensus price as weighted average (equal weights)
          const validPrices = validatedSnapshots
            .filter((s) => s.price !== null && !isNaN(s.price))
            .map((s) => s.price!);

          const consensusPrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length;

          const primaryCurrency = validatedSnapshots[0].currency || 'TRY';

          return {
            consensusPrice: Number(consensusPrice.toFixed(2)),
            consensusCurrency: primaryCurrency,
            status: 'MULTI_SOURCE_CONFIRMED' as const,
            confidence: 'HIGH' as const,
            sources: snapshots,
            freshness: validatedSnapshots.some(
              (s) => s.freshnessSeconds !== null && s.freshnessSeconds < 300,
            )
              ? 'FRESH'
              : validatedSnapshots.some(
                    (s) => s.freshnessSeconds !== null && s.freshnessSeconds < 3600,
                  )
                ? 'STALE'
                : 'UNKNOWN',
            generatedAt: new Date().toISOString(),
            conflict:
              maxDiff > 0
                ? {
                    detected: true,
                    maxDifference: maxDiff,
                    maxDifferencePercent: Number(maxDiffPercent.toFixed(2)),
                    contributingSources: validatedSnapshots
                      .filter((s) => s.price !== null && !isNaN(s.price))
                      .map((s) => s.provider),
                  }
                : undefined,
          };
        }

        // Providers disagree -> PRICE_CONFLICT
        const primaryPrice = validatedSnapshots[0].price;
        const contributingSources = validatedSnapshots.map((s) => s.provider);

        return {
          consensusPrice: primaryPrice,
          consensusCurrency: validatedSnapshots[0].currency,
          status: 'PRICE_CONFLICT' as const,
          confidence: 'LOW' as const,
          sources: snapshots,
          conflict: {
            detected: true,
            maxDifference: maxDiff,
            maxDifferencePercent: Number(maxDiffPercent.toFixed(2)),
            contributingSources,
          },
          freshness: validatedSnapshots.some(
            (s) => s.freshnessSeconds !== null && s.freshnessSeconds < 300,
          )
            ? 'FRESH'
            : validatedSnapshots.some(
                  (s) => s.freshnessSeconds !== null && s.freshnessSeconds < 3600,
                )
              ? 'STALE'
              : 'UNKNOWN',
          generatedAt: new Date().toISOString(),
        };
      }
    }

    // Mix of validated + research evidence
    if (validatedSnapshots.length > 0 && researchSnapshots.length > 0) {
      // Check if research evidence agrees with validated
      const validatedPrice = validatedSnapshots[0].price;
      const researchPrice = researchSnapshots[0].price;

      if (validatedPrice !== null && researchPrice !== null) {
        const absDiff = Math.abs(validatedPrice - researchPrice);
        const percentDiff = (absDiff / Math.max(validatedPrice, researchPrice, 1)) * 100;

        if (absDiff <= this.MAX_PRICE_DIFFERENCE_TRY && percentDiff <= this.TOLERANCE_PERCENT) {
          // Agree - research supported
          const consensusPrice = (validatedPrice + researchPrice) / 2;
          return {
            consensusPrice: Number(consensusPrice.toFixed(2)),
            consensusCurrency: validatedSnapshots[0].currency,
            status: 'MULTI_SOURCE_CONFIRMED_RESEARCH_SUPPORTED' as const,
            confidence: 'MEDIUM' as const,
            sources: snapshots,
            freshness: validatedSnapshots.some(
              (s) => s.freshnessSeconds !== null && s.freshnessSeconds < 300,
            )
              ? 'FRESH'
              : 'UNKNOWN',
            generatedAt: new Date().toISOString(),
          };
        }
      }

      // Disagree - but only if we have actual price values
      if (validatedPrice !== null && researchPrice !== null) {
        const absDiff = Math.abs(validatedPrice - researchPrice);
        const percentDiff = (absDiff / Math.max(validatedPrice, researchPrice, 1)) * 100;

        return {
          consensusPrice: validatedPrice,
          consensusCurrency: validatedSnapshots[0].currency,
          status: 'PRICE_CONFLICT' as const,
          confidence: 'LOW' as const,
          sources: snapshots,
          conflict: {
            detected: true,
            maxDifference: absDiff,
            maxDifferencePercent: Number(percentDiff.toFixed(2)),
            contributingSources: [
              ...validatedSnapshots.map((s) => s.provider),
              ...researchSnapshots.map((s) => s.provider),
            ],
          },
          freshness: validatedSnapshots.some(
            (s) => s.freshnessSeconds !== null && s.freshnessSeconds < 300,
          )
            ? 'FRESH'
            : 'UNKNOWN',
          generatedAt: new Date().toISOString(),
        };
      }
    }

    // Only research evidence
    if (validatedSnapshots.length === 0 && researchSnapshots.length >= 2) {
      const researchPrices = researchSnapshots
        .filter((s) => s.price !== null && !isNaN(s.price))
        .map((s) => s.price!);

      if (researchPrices.length >= 2) {
        const priceSet = new Set<number>();
        for (const p of researchPrices) priceSet.add(p);
        const priceArray = Array.from(priceSet);
        if (priceArray.length >= 2) {
          priceArray.sort((a, b) => a - b);
          const maxDiff = priceArray[priceArray.length - 1] - priceArray[0];
          const maxDiffPercent = (maxDiff / priceArray[0]) * 100;

          const allAgree = researchSnapshots.every((s, i, arr) =>
            arr.every((sr) => {
              if (s.price === null || sr.price === null) return true;
              const absDiff = Math.abs(s.price - sr.price);
              const percentDiff = (absDiff / Math.max(s.price, sr.price, 1)) * 100;
              return (
                absDiff <= this.MAX_PRICE_DIFFERENCE_TRY && percentDiff <= this.TOLERANCE_PERCENT
              );
            }),
          );

          if (allAgree) {
            const consensusPrice =
              researchPrices.reduce((sum, p) => sum + p, 0) / researchPrices.length;
            return {
              consensusPrice: Number(consensusPrice.toFixed(2)),
              consensusCurrency: 'TRY',
              status: 'MULTI_SOURCE_CONFIRMED_RESEARCH_SUPPORTED' as const,
              confidence: 'MEDIUM' as const,
              sources: snapshots,
              freshness: 'UNKNOWN',
              generatedAt: new Date().toISOString(),
            };
          }
        }
      }

      return {
        consensusPrice: researchPrices[0] || null,
        consensusCurrency: 'TRY',
        status: 'PRICE_CONFLICT' as const,
        confidence: 'LOW' as const,
        sources: snapshots,
        conflict: {
          detected: true,
          maxDifference: null,
          maxDifferencePercent: null,
          contributingSources: researchSnapshots.map((s) => s.provider),
        },
        freshness: 'UNKNOWN',
        generatedAt: new Date().toISOString(),
      };
    }

    // Fallback
    return {
      consensusPrice: null,
      consensusCurrency: null,
      status: 'SINGLE_SOURCE_UNAVAILABLE' as const,
      confidence: 'NONE' as const,
      sources: snapshots,
      freshness: 'UNKNOWN',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Compute freshness in seconds from timestamp string.
   */
  private computeFreshness(timestamp: string | null): number | null {
    if (!timestamp) return null;
    const ts = new Date(timestamp).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - ts) / 1000));
  }

  /**
   * Get market truth for a ticker - public API method.
   */
  async getMarketTruth(ticker: string): Promise<ConsensusResult> {
    const snapshots = await this.getProviderPrices(ticker);
    return this.computeConsensus(snapshots);
  }
}
