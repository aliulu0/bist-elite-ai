import { render, screen } from '@testing-library/react';
import { useBacktestStore } from './backtest-store';
import { DEFAULT_BACKTEST_CONFIG } from '@/components/backtest/backtest-types';

describe('useBacktestStore', () => {
  beforeEach(() => {
    useBacktestStore.setState({
      symbol: '',
      timeframe: '1d',
      activeTab: 'ozet',
      config: { ...DEFAULT_BACKTEST_CONFIG, entryRules: [...DEFAULT_BACKTEST_CONFIG.entryRules], exitRules: [...DEFAULT_BACKTEST_CONFIG.exitRules] },
      loading: false,
      error: '',
      result: null,
      benchmark: null,
      ruleAnalytics: null,
      weightOptimization: null,
      workflows: [],
      historicalData: null,
      workflowLoading: false,
      sortKey: 'returnPercent',
      sortDir: 'desc',
      tradePage: 0,
      tradesPerPage: 20,
    });
  });

  it('has default state', () => {
    const state = useBacktestStore.getState();
    expect(state.symbol).toBe('');
    expect(state.timeframe).toBe('1d');
    expect(state.activeTab).toBe('ozet');
    expect(state.loading).toBe(false);
    expect(state.result).toBeNull();
  });

  it('sets symbol', () => {
    useBacktestStore.getState().setSymbol('GARAN');
    expect(useBacktestStore.getState().symbol).toBe('GARAN');
  });

  it('sets timeframe', () => {
    useBacktestStore.getState().setTimeframe('1w');
    expect(useBacktestStore.getState().timeframe).toBe('1w');
  });

  it('sets activeTab', () => {
    useBacktestStore.getState().setActiveTab('grafik');
    expect(useBacktestStore.getState().activeTab).toBe('grafik');
  });

  it('sets loading', () => {
    useBacktestStore.getState().setLoading(true);
    expect(useBacktestStore.getState().loading).toBe(true);
  });

  it('sets error', () => {
    useBacktestStore.getState().setError('test error');
    expect(useBacktestStore.getState().error).toBe('test error');
  });

  it('sets result', () => {
    const result = { performance: {}, risk: {} } as any;
    useBacktestStore.getState().setResult(result);
    expect(useBacktestStore.getState().result).toBe(result);
  });

  it('sets config partial', () => {
    useBacktestStore.getState().setConfig({ initialCapital: 200000 });
    expect(useBacktestStore.getState().config.initialCapital).toBe(200000);
    expect(useBacktestStore.getState().config.positionSizePercent).toBe(100);
  });

  it('adds entry rule', () => {
    const rule = { signal: 'RSI_OVERSOLD', threshold: 30, lookback: 14 };
    useBacktestStore.getState().addEntryRule(rule);
    expect(useBacktestStore.getState().config.entryRules).toHaveLength(2);
    expect(useBacktestStore.getState().config.entryRules[1].signal).toBe('RSI_OVERSOLD');
  });

  it('removes entry rule', () => {
    useBacktestStore.getState().addEntryRule({ signal: 'RSI_OVERSOLD', threshold: 30, lookback: 14 });
    useBacktestStore.getState().removeEntryRule(0);
    expect(useBacktestStore.getState().config.entryRules).toHaveLength(1);
    expect(useBacktestStore.getState().config.entryRules[0].signal).toBe('RSI_OVERSOLD');
  });

  it('updates entry rule', () => {
    useBacktestStore.getState().addEntryRule({ signal: 'RSI_OVERSOLD', threshold: 30, lookback: 14 });
    useBacktestStore.getState().updateEntryRule(1, { signal: 'VOLUME_SPIKE', threshold: 50, lookback: 10 });
    expect(useBacktestStore.getState().config.entryRules[1].signal).toBe('VOLUME_SPIKE');
  });

  it('adds exit rule', () => {
    const rule = { signal: 'STOP_LOSS', stopLossPercent: 5, takeProfitPercent: 15, trailingStopPercent: 10, maxHoldingDays: 30, lookback: 20, threshold: 70 };
    useBacktestStore.getState().addExitRule(rule);
    expect(useBacktestStore.getState().config.exitRules).toHaveLength(2);
  });

  it('removes exit rule', () => {
    useBacktestStore.getState().addExitRule({ signal: 'STOP_LOSS', stopLossPercent: 5, takeProfitPercent: 15, trailingStopPercent: 10, maxHoldingDays: 30, lookback: 20, threshold: 70 });
    useBacktestStore.getState().removeExitRule(0);
    expect(useBacktestStore.getState().config.exitRules).toHaveLength(1);
  });

  it('updates exit rule', () => {
    useBacktestStore.getState().addExitRule({ signal: 'STOP_LOSS', stopLossPercent: 5, takeProfitPercent: 15, trailingStopPercent: 10, maxHoldingDays: 30, lookback: 20, threshold: 70 });
    useBacktestStore.getState().updateExitRule(1, { signal: 'TAKE_PROFIT', stopLossPercent: 10, takeProfitPercent: 20, trailingStopPercent: 15, maxHoldingDays: 60, lookback: 14, threshold: 80 });
    expect(useBacktestStore.getState().config.exitRules[1].signal).toBe('TAKE_PROFIT');
  });

  it('resets config to defaults', () => {
    useBacktestStore.getState().setConfig({ initialCapital: 999 });
    useBacktestStore.getState().addEntryRule({ signal: 'RSI_OVERSOLD', threshold: 30, lookback: 14 });
    useBacktestStore.getState().resetConfig();
    expect(useBacktestStore.getState().config.initialCapital).toBe(100000);
    expect(useBacktestStore.getState().config.entryRules).toHaveLength(1);
  });

  it('sets sort', () => {
    useBacktestStore.getState().setSort('holdingDays', 'asc');
    expect(useBacktestStore.getState().sortKey).toBe('holdingDays');
    expect(useBacktestStore.getState().sortDir).toBe('asc');
  });

  it('sets tradePage', () => {
    useBacktestStore.getState().setTradePage(3);
    expect(useBacktestStore.getState().tradePage).toBe(3);
  });

  it('sets workflows', () => {
    const wfs = [{ id: '1', type: 'backtest' }] as any;
    useBacktestStore.getState().setWorkflows(wfs);
    expect(useBacktestStore.getState().workflows).toBe(wfs);
  });

  it('sets benchmark', () => {
    const b = { alpha: 0.05 } as any;
    useBacktestStore.getState().setBenchmark(b);
    expect(useBacktestStore.getState().benchmark).toBe(b);
  });

  it('sets ruleAnalytics', () => {
    const a = { ruleStatistics: [] } as any;
    useBacktestStore.getState().setRuleAnalytics(a);
    expect(useBacktestStore.getState().ruleAnalytics).toBe(a);
  });

  it('sets weightOptimization', () => {
    const o = { recommendedWeights: {} } as any;
    useBacktestStore.getState().setWeightOptimization(o);
    expect(useBacktestStore.getState().weightOptimization).toBe(o);
  });

  it('sets historicalData', () => {
    const d = { candles: [] } as any;
    useBacktestStore.getState().setHistoricalData(d);
    expect(useBacktestStore.getState().historicalData).toBe(d);
  });

  it('sets workflowLoading', () => {
    useBacktestStore.getState().setWorkflowLoading(true);
    expect(useBacktestStore.getState().workflowLoading).toBe(true);
  });
});
