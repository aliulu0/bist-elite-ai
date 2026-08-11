export interface MarketScannerConfig {
  maxTopCandidates: number;
  maxWatchlist: number;
  minEliteScore: number;
  minOpportunityScore: number;
  minCandidateScore: number;
  minConfidence: number;
  watchlistEliteThreshold: number;
  watchlistOpportunityThreshold: number;
  compositeWeights: {
    elite: number;
    opportunity: number;
    candidate: number;
    financial: number;
    technical: number;
    smartMoney: number;
  };
}

export const DEFAULT_MARKET_SCANNER_CONFIG: MarketScannerConfig = {
  maxTopCandidates: 10,
  maxWatchlist: 20,
  minEliteScore: 60,
  minOpportunityScore: 40,
  minCandidateScore: 50,
  minConfidence: 0.5,
  watchlistEliteThreshold: 45,
  watchlistOpportunityThreshold: 25,
  compositeWeights: {
    elite: 0.35,
    opportunity: 0.25,
    candidate: 0.15,
    financial: 0.1,
    technical: 0.08,
    smartMoney: 0.07,
  },
};
