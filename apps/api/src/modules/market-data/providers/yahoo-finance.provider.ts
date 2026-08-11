import { Injectable, Logger } from '@nestjs/common';
import { IDataProvider, MarketDataPoint, FetchOptions, Timeframe } from '../interfaces';

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        currency: string;
        exchangeTimezoneName: string;
        regularMarketPrice: number;
        regularMarketTime: number;
        longName?: string;
        shortName?: string;
        exchangeName?: string;
        fullExchangeName?: string;
        instrumentType?: string;
        regularMarketVolume?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }>;
    error: {
      code: string;
      description: string;
    } | null;
  };
}

interface YahooTimeframeConfig {
  interval: string;
  range: string;
}

export interface YahooChartMeta {
  symbol?: string;
  longName?: string;
  shortName?: string;
  currency?: string;
  exchangeName?: string;
  fullExchangeName?: string;
  instrumentType?: string;
  regularMarketPrice?: number;
  regularMarketVolume?: number;
  regularMarketTime?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

export interface YahooCorporateAction {
  symbol: string;
  date: string;
  type: 'dividend' | 'split';
  value: number;
  split?: { numerator: number; denominator: number };
}

const TIMEFRAME_MAP: Record<string, YahooTimeframeConfig> = {
  '4h': { interval: '60m', range: '60d' },
  '1d': { interval: '1d', range: '1y' },
  '1w': { interval: '1wk', range: '2y' },
  '1m': { interval: '1mo', range: '5y' },
  '3m': { interval: '1mo', range: '10y' },
  '6m': { interval: '1mo', range: 'max' },
};

const YAHOO_TO_INTERNAL: Record<string, string> = {
  '1d': '1d',
  '1wk': '1w',
  '1mo': '1m',
  '60m': '4h',
};

@Injectable()
export class YahooFinanceProvider implements IDataProvider {
  readonly name = 'yahoo-finance';
  private readonly logger = new Logger(YahooFinanceProvider.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.baseUrl = process.env.YAHOO_FINANCE_BASE_URL || 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.timeoutMs = parseInt(process.env.YAHOO_FINANCE_TIMEOUT_MS || '15000', 10);
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/AAPL?interval=1d&range=1d`, {
        method: 'GET',
        headers: { 'User-Agent': 'BIST-Elite-AI/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      this.logger.warn(
        `Yahoo Finance connection check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  async getHistoricalData(
    symbol: string,
    timeframe: string,
    options?: FetchOptions,
  ): Promise<MarketDataPoint[]> {
    const config = TIMEFRAME_MAP[timeframe];
    if (!config) {
      this.logger.warn(`Unsupported timeframe: ${timeframe}`);
      return [];
    }

    const yahooSymbol = this.toYahooSymbol(symbol);

    try {
      const params = new URLSearchParams({
        interval: config.interval,
        range: config.range,
      });

      if (options?.startDate) {
        const start = Math.floor(new Date(options.startDate).getTime() / 1000);
        params.set('period1', String(start));
        params.delete('range');
      }

      if (options?.endDate) {
        const end = Math.floor(new Date(options.endDate).getTime() / 1000);
        params.set('period2', String(end));
      }

      const url = `${this.baseUrl}/${encodeURIComponent(yahooSymbol)}?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'BIST-Elite-AI/1.0' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        this.logger.warn(`Yahoo Finance returned ${response.status} for ${symbol}`);
        return [];
      }

      const data = (await response.json()) as YahooChartResponse;

      if (data.chart.error) {
        this.logger.warn(`Yahoo Finance error for ${symbol}: ${data.chart.error.description}`);
        return [];
      }

      if (!data.chart.result || data.chart.result.length === 0) {
        this.logger.warn(`No data returned for ${symbol}`);
        return [];
      }

      const result = data.chart.result[0];
      const internalTimeframe = YAHOO_TO_INTERNAL[config.interval] ?? (timeframe as Timeframe);

      return this.normalizeResponse(symbol, internalTimeframe as Timeframe, result);
    } catch (error) {
      this.logger.error(
        `Failed to fetch historical data for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  async getLatestPrice(symbol: string): Promise<MarketDataPoint | null> {
    const yahooSymbol = this.toYahooSymbol(symbol);

    try {
      const url = `${this.baseUrl}/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'BIST-Elite-AI/1.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        this.logger.warn(`Yahoo Finance returned ${response.status} for ${symbol}`);
        return null;
      }

      const data = (await response.json()) as YahooChartResponse;

      if (data.chart.error || !data.chart.result || data.chart.result.length === 0) {
        return null;
      }

      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];

      if (!timestamps || timestamps.length === 0 || !quote) {
        return null;
      }

      const lastIndex = timestamps.length - 1;
      const open = quote.open[lastIndex];
      const high = quote.high[lastIndex];
      const low = quote.low[lastIndex];
      const close = quote.close[lastIndex];
      const volume = quote.volume[lastIndex];

      if (open == null || high == null || low == null || close == null || volume == null) {
        return null;
      }

      return {
        symbol,
        timeframe: '1d',
        open,
        high,
        low,
        close,
        volume,
        timestamp: new Date(timestamps[lastIndex] * 1000).toISOString(),
        validationStatus: 'valid',
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch latest price for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  getAvailableTimeframes(): string[] {
    return Object.keys(TIMEFRAME_MAP);
  }

  async getQuoteMeta(symbol: string): Promise<YahooChartMeta | null> {
    const yahooSymbol = this.toYahooSymbol(symbol);

    try {
      const url = `${this.baseUrl}/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1y`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'BIST-Elite-AI/1.0' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as YahooChartResponse;
      const meta = data.chart?.result?.[0]?.meta;
      if (!meta || !meta.symbol) return null;

      return {
        symbol: meta.symbol,
        longName: meta.longName,
        shortName: meta.shortName,
        currency: meta.currency,
        exchangeName: meta.exchangeName,
        fullExchangeName: meta.fullExchangeName,
        instrumentType: meta.instrumentType,
        regularMarketPrice: meta.regularMarketPrice,
        regularMarketVolume: meta.regularMarketVolume,
        regularMarketTime: meta.regularMarketTime,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch quote meta for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async getCorporateActions(symbol: string): Promise<YahooCorporateAction[]> {
    const yahooSymbol = this.toYahooSymbol(symbol);

    try {
      const url = `${this.baseUrl}/${encodeURIComponent(yahooSymbol)}?interval=1d&range=10y&events=div,splits`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'BIST-Elite-AI/1.0' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        this.logger.warn(`Yahoo Finance returned ${response.status} for corporate actions on ${symbol}`);
        return [];
      }

      const data = (await response.json()) as YahooChartResponse & {
        chart: { result?: Array<{ events?: { dividends?: Record<string, { amount: number }>; splits?: Record<string, { numerator: number; denominator: number; splitRatio?: string }> } }> };
      };

      const events = data.chart?.result?.[0]?.events;
      if (!events) return [];

      const actions: YahooCorporateAction[] = [];

      for (const [ts, dividend] of Object.entries(events.dividends ?? {})) {
        actions.push({
          symbol,
          type: 'dividend',
          date: new Date(Number(ts) * 1000).toISOString(),
          value: dividend.amount ?? 0,
        });
      }

      for (const [ts, split] of Object.entries(events.splits ?? {})) {
        const numerator = split.numerator ?? 0;
        const denominator = split.denominator ?? 1;
        actions.push({
          symbol,
          type: 'split',
          date: new Date(Number(ts) * 1000).toISOString(),
          value: denominator > 0 ? numerator / denominator : 0,
          split: { numerator, denominator },
        });
      }

      actions.sort((a, b) => a.date.localeCompare(b.date));
      return actions;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch corporate actions for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  private toYahooSymbol(symbol: string): string {
    const trimmed = symbol.trim();
    if (!trimmed || trimmed.includes('.')) {
      return trimmed;
    }
    return `${trimmed}.IS`;
  }

  private normalizeResponse(
    symbol: string,
    timeframe: Timeframe,
    result: YahooChartResponse['chart']['result'][0],
  ): MarketDataPoint[] {
    const { timestamp, indicators } = result;
    const quote = indicators.quote[0];

    if (!timestamp || !quote) {
      return [];
    }

    const points: MarketDataPoint[] = [];

    for (let i = 0; i < timestamp.length; i++) {
      const open = quote.open[i];
      const high = quote.high[i];
      const low = quote.low[i];
      const close = quote.close[i];
      const volume = quote.volume[i];

      if (open == null || high == null || low == null || close == null || volume == null) {
        continue;
      }

      if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
        continue;
      }

      if (high < low) {
        continue;
      }

      points.push({
        symbol,
        timeframe,
        open,
        high,
        low,
        close,
        volume,
        timestamp: new Date(timestamp[i] * 1000).toISOString(),
        validationStatus: 'valid',
      });
    }

    return points;
  }
}
