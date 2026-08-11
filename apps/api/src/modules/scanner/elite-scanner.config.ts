import { EliteScannerConfig } from './elite-scanner.types';

export const DEFAULT_ELITE_SCANNER_CONFIG: EliteScannerConfig = {
  concurrency: 20,
  timeoutMs: 15000,
  maxResults: 100,
  cacheLatestTtlMs: 5 * 60 * 1000,
  filters: {
    sector: null,
    assetType: null,
    limit: 795,
    activeOnly: true,
  },
};
