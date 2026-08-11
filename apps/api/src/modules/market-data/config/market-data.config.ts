export interface ProviderConfig {
  enabled: boolean;
  priority: number;
  timeout: number;
  retries: number;
  apiKey: string;
  baseUrl: string;
}

export interface MarketDataConfig {
  providers: {
    fintables: ProviderConfig;
    alpha_vantage: ProviderConfig;
    finnhub: ProviderConfig;
    yahoo: ProviderConfig;
    kap: ProviderConfig;
    tcmb: ProviderConfig;
    mkk: ProviderConfig;
    serpapi: ProviderConfig;
  };
  cache: {
    companyTtlMs: number;
    financialTtlMs: number;
    sectorTtlMs: number;
    disclosureTtlMs: number;
    macroIndicatorsTtlMs: number;
    tcmbTtlMs: number;
    mkkTtlMs: number;
    historicalTtlMs: number;
  };
}

export function getMarketDataConfig(): MarketDataConfig {
  return {
    providers: {
      fintables: {
        enabled: process.env.FINTABLES_ENABLED !== 'false',
        priority: parseInt(process.env.FINTABLES_PRIORITY || '1', 10),
        timeout: parseInt(process.env.FINTABLES_TIMEOUT_MS || '15000', 10),
        retries: parseInt(process.env.FINTABLES_RETRY_COUNT || '3', 10),
        apiKey: process.env.FINTABLES_API_KEY || '',
        baseUrl: process.env.FINTABLES_BASE_URL || 'https://fintables.com/api/v1',
      },
      finnhub: {
        enabled: process.env.FINNHUB_ENABLED !== 'false',
        priority: parseInt(process.env.FINNHUB_PRIORITY || '3', 10),
        timeout: parseInt(process.env.FINNHUB_TIMEOUT_MS || '15000', 10),
        retries: parseInt(process.env.FINNHUB_RETRY_COUNT || '3', 10),
        apiKey: process.env.FINNHUB_API_KEY || '',
        baseUrl: process.env.FINNHUB_BASE_URL || 'https://finnhub.io/api/v1',
      },
      alpha_vantage: {
        enabled: process.env.ALPHA_VANTAGE_ENABLED !== 'false',
        priority: parseInt(process.env.ALPHA_VANTAGE_PRIORITY || '2', 10),
        timeout: parseInt(process.env.ALPHA_VANTAGE_TIMEOUT_MS || '20000', 10),
        retries: parseInt(process.env.ALPHA_VANTAGE_RETRY_COUNT || '3', 10),
        apiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
        baseUrl: process.env.ALPHA_VANTAGE_BASE_URL || 'https://www.alphavantage.co/query',
      },
      yahoo: {
        enabled: process.env.YAHOO_ENABLED !== 'false',
        priority: parseInt(process.env.YAHOO_PRIORITY || '4', 10),
        timeout: parseInt(process.env.YAHOO_TIMEOUT_MS || '15000', 10),
        retries: parseInt(process.env.YAHOO_RETRY_COUNT || '2', 10),
        apiKey: process.env.YAHOO_API_KEY || '',
        baseUrl: process.env.YAHOO_BASE_URL || 'https://query1.finance.yahoo.com',
      },
      kap: {
        enabled: process.env.KAP_ENABLED !== 'false',
        priority: parseInt(process.env.KAP_PRIORITY || '5', 10),
        timeout: parseInt(process.env.KAP_TIMEOUT_MS || '15000', 10),
        retries: parseInt(process.env.KAP_RETRY_COUNT || '3', 10),
        apiKey: process.env.KAP_API_KEY || '',
        baseUrl: process.env.KAP_BASE_URL || 'https://www.kap.org.tr/tr/api',
      },
      mkk: {
        enabled: process.env.MKK_ENABLED !== 'false',
        priority: parseInt(process.env.MKK_PRIORITY || '7', 10),
        timeout: parseInt(process.env.MKK_TIMEOUT_MS || '15000', 10),
        retries: parseInt(process.env.MKK_RETRY_COUNT || '3', 10),
        apiKey: process.env.MKK_API_KEY || '',
        baseUrl: process.env.MKK_BASE_URL || 'https://api.mkk.com.tr',
      },
      tcmb: {
        enabled: process.env.TCMB_ENABLED !== 'false',
        priority: parseInt(process.env.TCMB_PRIORITY || '6', 10),
        timeout: parseInt(process.env.TCMB_TIMEOUT_MS || '15000', 10),
        retries: parseInt(process.env.TCMB_RETRY_COUNT || '3', 10),
        apiKey: process.env.TCMB_API_KEY || '',
        baseUrl: process.env.TCMB_BASE_URL || 'https://evds2.tcmb.gov.tr/service/evds',
      },
      serpapi: {
        enabled: process.env.SERPAPI_ENABLED !== 'false',
        priority: parseInt(process.env.SERPAPI_PRIORITY || '8', 10),
        timeout: parseInt(process.env.SERPAPI_TIMEOUT_MS || '15000', 10),
        retries: parseInt(process.env.SERPAPI_RETRY_COUNT || '2', 10),
        apiKey: process.env.SERPAPI_API_KEY || '',
        baseUrl: process.env.SERPAPI_BASE_URL || 'https://serpapi.com/search.json',
      },
    },
    cache: {
      companyTtlMs: 12 * 60 * 60 * 1000,
      financialTtlMs: 24 * 60 * 60 * 1000,
      sectorTtlMs: 24 * 60 * 60 * 1000,
      disclosureTtlMs: 15 * 60 * 1000,
      macroIndicatorsTtlMs: 30 * 60 * 1000,
      tcmbTtlMs: 6 * 60 * 60 * 1000,
      mkkTtlMs: 12 * 60 * 60 * 1000,
      historicalTtlMs: 24 * 60 * 60 * 1000,
    },
  };
}
