import { Injectable, Optional } from '@nestjs/common';
import { SymbolAnalysis, RankedSymbol, MarketScannerResult, ScannerStatistics } from './market-scanner.types';
import { MarketScannerConfig, DEFAULT_MARKET_SCANNER_CONFIG } from './market-scanner.config';

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
    const avgOpportunityScore = total > 0 ? all.reduce((s, x) => s + x.opportunityScore, 0) / total : 0;
    const avgCandidateScore = total > 0 ? all.reduce((s, x) => s + x.candidateScore, 0) / total : 0;

    const scoreDistribution: Record<string, number> = {
      AAA: 0, AA: 0, A: 0, BBB: 0, BB: 0, B: 0, C: 0, D: 0,
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
