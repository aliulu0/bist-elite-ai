const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

async function request<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

export const apiClient = {
  get: request,

  getMarketSummary: () => request<any>('/api/v1/market/summary'),

  getMarketRegime: () => request<any>('/api/v1/market/regime'),

  getSignals: (timeframe = 'D1') =>
    request<any[]>(`/api/v1/signals?timeframe=${timeframe}`),

  getSignalSummary: () => request<any>('/api/v1/signals/summary'),

  getOpportunities: (params?: { timeframe?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.timeframe) qs.set('timeframe', params.timeframe);
    if (params?.limit) qs.set('limit', String(params.limit));
    return request<any[]>(`/api/v1/opportunities?${qs.toString()}`);
  },

  getStockDetail: (symbol: string) =>
    request<any>(`/api/v1/stocks/${symbol}`),

  getStockScore: (symbol: string, timeframe = 'D1') =>
    request<any>(`/api/v1/stocks/${symbol}/score?timeframe=${timeframe}`),

  getRankedStocks: (params?: { timeframe?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.timeframe) qs.set('timeframe', params.timeframe);
    if (params?.limit) qs.set('limit', String(params.limit));
    return request<any[]>(`/api/v1/stocks/ranked?${qs.toString()}`);
  },

  getPortfolio: () => request<any>('/api/v1/portfolio'),

  getPortfolioSummary: () => request<any>('/api/v1/portfolio/summary'),

  getWatchlists: () => request<any[]>('/api/v1/watchlists'),

  createWatchlist: (name: string) =>
    fetch(`${API_BASE_URL}/api/v1/watchlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then((r) => r.json()),

  addToWatchlist: (watchlistId: string, symbol: string) =>
    fetch(`${API_BASE_URL}/api/v1/watchlists/${watchlistId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    }).then((r) => r.json()),

  removeFromWatchlist: (watchlistId: string, symbol: string) =>
    fetch(`${API_BASE_URL}/api/v1/watchlists/${watchlistId}/items/${symbol}`, {
      method: 'DELETE',
    }).then((r) => r.json()),

  getBacktestResults: (params?: { limit?: number }) => {
    const qs = params?.limit ? `?limit=${params.limit}` : '';
    return request<any[]>(`/api/v1/backtest/results${qs}`);
  },

  getRiskIndicator: () => request<any>('/api/v1/risk/indicator'),

  getNotifications: (params?: { limit?: number }) => {
    const qs = params?.limit ? `?limit=${params.limit}` : '';
    return request<any[]>(`/api/v1/notifications${qs}`);
  },

  getSystemStatus: () => request<any>('/api/v1/system/status'),
};
