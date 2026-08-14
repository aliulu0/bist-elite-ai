import { sdkClient } from './sdk';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve(JSON.stringify({ status: 'ok' })) });
});

function setupFetch(data: unknown) {
  mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve(JSON.stringify(data)) });
}

describe('sdkClient', () => {
  it('health calls correct endpoint', async () => {
    setupFetch({ status: 'healthy', timestamp: new Date().toISOString() });
    const res = await sdkClient.health();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/health'), expect.any(Object));
    expect(res).toHaveProperty('status', 'healthy');
  });

  it('technicalAnalysis calls correct endpoint', async () => {
    setupFetch({ symbol: 'GARAN', score: 75 });
    const res = await sdkClient.technicalAnalysis('GARAN');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/technical-analysis/GARAN'), expect.any(Object));
    expect(res).toHaveProperty('symbol', 'GARAN');
  });

  it('scanner calls correct endpoint', async () => {
    setupFetch({ success: true, topCandidates: [{ symbol: 'GARAN', score: 80 }], timestamp: '' });
    const res = await sdkClient.scanner();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/scanner'), expect.any(Object));
    expect(res).toHaveProperty('topCandidates');
  });

  it('financialRules calls correct endpoint', async () => {
    setupFetch({ symbol: 'AKBNK', rules: [], score: 75, grade: 'A', confidence: 0.8, strengths: [], weaknesses: [], risks: [], summary: '', overallOpinion: '', timestamp: '' });
    const res = await sdkClient.financialRules('AKBNK');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/financial-analysis/AKBNK'), expect.any(Object));
    expect(res).toHaveProperty('symbol', 'AKBNK');
  });

  it('configuration calls correct endpoint', async () => {
    setupFetch({ success: true, data: { totalDomains: 0, domains: {}, version: 1 }, timestamp: '' });
    const res = await sdkClient.configuration();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/configuration'), expect.any(Object));
    expect(res).toHaveProperty('data');
  });

  it('performanceMonitor calls correct endpoint', async () => {
    setupFetch({ success: true, data: { metrics: [], system: {}, cache: {}, health: {}, totalRecorded: 0 }, timestamp: '' });
    const res = await sdkClient.performanceMonitor();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/performance'), expect.any(Object));
    expect(res).toHaveProperty('data');
  });

  it('providerHealth calls correct endpoint', async () => {
    setupFetch({ success: true, data: { providers: [], overallStatus: 'healthy', totalProviders: 0 }, timestamp: '' });
    const res = await sdkClient.providerHealth();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/providers/health'), expect.any(Object));
    expect(res).toHaveProperty('data');
  });

  it('eventBus calls correct endpoint', async () => {
    setupFetch({ success: true, data: { events: [], total: 0 }, timestamp: '' });
    const res = await sdkClient.eventBus();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/v1/events'), expect.any(Object));
    expect(res).toHaveProperty('data');
  });

  it('workflowQueue calls correct endpoint', async () => {
    setupFetch({ success: true, data: { jobs: [], total: 0 }, timestamp: '' });
    const res = await sdkClient.workflowQueue();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/v1/queue/jobs'), expect.any(Object));
    expect(res).toHaveProperty('data');
  });

  it('diagnostics calls correct endpoint', async () => {
    setupFetch({ status: 'healthy', version: '1', uptime: 0, timestamp: '', components: [] });
    const res = await sdkClient.diagnostics();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/health'), expect.any(Object));
    expect(res).toHaveProperty('components');
  });

  it('auditLog rejects since no backend controller exists', async () => {
    await expect(sdkClient.auditLog()).rejects.toThrow(/not available on the backend/);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve('Not Found') });
    await expect(sdkClient.health()).rejects.toThrow();
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    await expect(sdkClient.health()).rejects.toThrow('Network error');
  });

  it('handles empty response body', async () => {
    mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('') });
    const res = await sdkClient.health();
    expect(res).toBeDefined();
  });

  it('schedulerStatus calls correct endpoint', async () => {
    setupFetch({ success: true, running: false, jobs: [], uptime: 0, totalExecutions: 0, timestamp: '' });
    const res = await sdkClient.schedulerStatus();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/scheduler'), expect.any(Object));
    expect(res).toHaveProperty('jobs');
  });

  it('schedulerJobs calls correct endpoint', async () => {
    setupFetch({ success: true, running: false, jobs: [], uptime: 0, totalExecutions: 0, timestamp: '' });
    const res = await sdkClient.schedulerJobs();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/scheduler'), expect.any(Object));
    expect(res).toHaveProperty('jobs');
  });

  it('portfolio calls correct endpoint', async () => {
    setupFetch({ success: true, data: [], timestamp: '' });
    const res = await sdkClient.portfolio();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/portfolio'), expect.any(Object));
    expect(res).toHaveProperty('data');
  });

  it('portfolioReport calls correct endpoint', async () => {
    setupFetch({ success: true, data: { summary: {} }, timestamp: '' });
    const res = await sdkClient.portfolioReport('pf-1');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/portfolio/pf-1/report'), expect.any(Object));
    expect(res).toHaveProperty('data');
  });

  it('portfolioPositions calls correct endpoint', async () => {
    setupFetch({ success: true, data: [], timestamp: '' });
    const res = await sdkClient.portfolioPositions('pf-1');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/portfolio/pf-1/positions'), expect.any(Object));
    expect(res).toHaveProperty('data');
  });

  it('portfolioCreate posts to correct endpoint', async () => {
    setupFetch({ success: true, data: { id: 'pf-1' }, timestamp: '' });
    const res = await sdkClient.portfolioCreate({ name: 'Test', initialCash: 100000 });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/portfolio'), expect.objectContaining({ method: 'POST' }));
    expect(res).toHaveProperty('data');
  });

  it('portfolioExecuteTransaction posts to correct endpoint', async () => {
    setupFetch({ success: true, data: {}, timestamp: '' });
    const res = await sdkClient.portfolioExecuteTransaction('pf-1', { symbol: 'THYAO', type: 'BUY', quantity: 10, price: 300 });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/portfolio/pf-1/transactions'), expect.objectContaining({ method: 'POST' }));
    expect(res).toHaveProperty('data');
  });

  it('watchlist calls correct endpoint', async () => {
    setupFetch({ success: true, data: { lists: [] }, timestamp: '' });
    const res = await sdkClient.watchlist();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/watchlist'), expect.any(Object));
    expect(res).toHaveProperty('data');
  });

  it('watchlistAdd posts to correct endpoint', async () => {
    setupFetch({ success: true, message: 'Added THYAO to FAVORITES', timestamp: '' });
    const res = await sdkClient.watchlistAdd('FAVORITES', 'THYAO');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/watchlist/FAVORITES/THYAO'), expect.objectContaining({ method: 'POST' }));
    expect(res).toHaveProperty('message');
  });

  it('watchlistRemove deletes from correct endpoint', async () => {
    setupFetch({ success: true, message: 'Removed THYAO from FAVORITES', timestamp: '' });
    const res = await sdkClient.watchlistRemove('FAVORITES', 'THYAO');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/watchlist/FAVORITES/THYAO'), expect.objectContaining({ method: 'DELETE' }));
    expect(res).toHaveProperty('message');
  });

  it('alerts calls correct endpoint', async () => {
    setupFetch({ success: true, data: { alerts: [], total: 0, limit: 50, offset: 0 }, timestamp: '' });
    const res = await sdkClient.alerts();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/alerts?limit=50&offset=0'), expect.any(Object));
    expect(res).toHaveProperty('data');
  });

  it('alertsAcknowledge posts to correct endpoint', async () => {
    setupFetch({ success: true, message: 'Alert acknowledged', timestamp: '' });
    const res = await sdkClient.alertsAcknowledge('alert-1');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/alerts/alert-1/acknowledge'), expect.objectContaining({ method: 'POST' }));
    expect(res).toHaveProperty('message');
  });

  it('alertsDismiss posts to correct endpoint', async () => {
    setupFetch({ success: true, message: 'Alert dismissed', timestamp: '' });
    const res = await sdkClient.alertsDismiss('alert-1');
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/alerts/alert-1/dismiss'), expect.objectContaining({ method: 'POST' }));
    expect(res).toHaveProperty('message');
  });

  it('telegram status calls correct endpoint', async () => {
    setupFetch({ configured: true, enabled: false, status: 'NOT_CONFIGURED', sentCount: 0 });
    const res = await sdkClient.telegram.status();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/telegram/status'), expect.any(Object));
    expect(res).toHaveProperty('configured');
  });

  it('telegram preview calls correct endpoint', async () => {
    setupFetch({ opportunityCount: 0, formattedMessage: '', snapshot: {} });
    const res = await sdkClient.telegram.preview();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/telegram/preview'), expect.any(Object));
    expect(res).toHaveProperty('opportunityCount');
  });

  it('telegram send posts to correct endpoint', async () => {
    setupFetch({ status: 'SENT', opportunities: 2 });
    const res = await sdkClient.telegram.send({ dryRun: false });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/telegram/radar/send?dryRun=false'), expect.objectContaining({ method: 'POST' }));
    expect(res).toHaveProperty('status');
  });

  it('telegram deliveries calls correct endpoint', async () => {
    setupFetch({ deliveries: [], total: 0 });
    const res = await sdkClient.telegram.deliveries({ limit: 50 });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/telegram/deliveries?limit=50'), expect.any(Object));
    expect(res).toHaveProperty('deliveries');
  });
});
