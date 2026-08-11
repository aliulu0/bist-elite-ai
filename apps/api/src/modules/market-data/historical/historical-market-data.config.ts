export interface HistoricalMarketDataConfig {
  /** Default start of the target backfill window (YYYY-MM-DD). */
  defaultStartDate: string;
  /** Minimum bar count required for a series to be usable in backtests, per timeframe. */
  minBarsForBacktest: Record<string, number>;
  /** Minimum coverage percentage (0-100) required for a series to be usable in backtests. */
  minCoveragePctForBacktest: number;
  /** Default number of concurrent range fetches during a single backfill. */
  defaultConcurrency: number;
  /** Hard cap on concurrent range fetches. */
  maxConcurrency: number;
  /** Maximum number of range requests issued in a single backfill run. */
  maxRangesPerBackfill: number;
}

export function getHistoricalMarketDataConfig(): HistoricalMarketDataConfig {
  return {
    defaultStartDate: process.env.HISTORICAL_DEFAULT_START_DATE || '2020-01-01',
    minBarsForBacktest: {
      '4h': parseInt(process.env.HISTORICAL_MIN_BARS_4H || '750', 10),
      '1d': parseInt(process.env.HISTORICAL_MIN_BARS_1D || '250', 10),
      '1w': parseInt(process.env.HISTORICAL_MIN_BARS_1W || '100', 10),
      '1m': parseInt(process.env.HISTORICAL_MIN_BARS_1M || '36', 10),
      '3m': parseInt(process.env.HISTORICAL_MIN_BARS_3M || '12', 10),
      '6m': parseInt(process.env.HISTORICAL_MIN_BARS_6M || '6', 10),
    },
    minCoveragePctForBacktest: parseFloat(process.env.HISTORICAL_MIN_COVERAGE_PCT || '90'),
    defaultConcurrency: 1,
    maxConcurrency: 4,
    maxRangesPerBackfill: 50,
  };
}
