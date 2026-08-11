import { Injectable, Logger, Optional } from '@nestjs/common';
import { IndicatorEngine } from '../indicators/indicator-engine.service';
import { IndicatorResult, OHLCV, Timeframe } from '../indicators/indicator.types';
import {
  BacktestResult,
  DrawdownPoint,
  EquityPoint,
  EntryRule,
  ExitRule,
  BacktestStrategy,
  PeriodReturn,
  PerformanceMetrics,
  RiskMetrics,
  RuleContribution,
  Trade,
  AiExplanation,
  BenchmarkComparison,
  BacktestMetadata,
} from './backtest.types';

interface SeriesSource {
  ema: Map<number, number[]>;
  sma: Map<number, number[]>;
  rsi: number[] | null;
  macdLine: number[] | null;
  macdSignal: number[] | null;
  volumeSma: number[] | null;
  volumeSpike: number[] | null;
}

@Injectable()
export class CoreBacktestEngine {
  private readonly logger = new Logger(CoreBacktestEngine.name);

  constructor(@Optional() private readonly indicatorEngine?: IndicatorEngine) {}

  run(data: OHLCV[], timeframe: Timeframe, strategy: BacktestStrategy): BacktestResult {
    if (!data || data.length === 0) {
      return this.emptyResult(strategy, 'No data provided');
    }
    if (data.length < 2) {
      return this.emptyResult(strategy, 'Insufficient data: need at least 2 bars');
    }

    const cfg = strategy;
    const indicators = this.buildSeries(data, timeframe);
    const trades = this.executeTrades(data, indicators, cfg);

    if (trades.length < (cfg.minTradesRequired ?? 1)) {
      return this.emptyResult(strategy, `Insufficient trades: ${trades.length} (minimum ${cfg.minTradesRequired ?? 1})`, data);
    }

    const equityCurve = this.buildEquityCurve(trades, cfg.initialCapital, cfg.positionSizePercent);
    const risk = this.calculateRisk(trades, equityCurve, cfg);
    const performance = this.calculatePerformance(trades, data, equityCurve, cfg, risk.maxDrawdown);
    const drawdownCurve = this.buildDrawdownCurve(equityCurve, data);
    const equityCurvePoints = this.buildEquityPoints(equityCurve, data, trades);
    const monthlyReturns = this.buildPeriodReturns(trades, (t) => this.monthOf(t.entryTimestamp));
    const yearlyReturns = this.buildPeriodReturns(trades, (t) => this.yearOf(t.entryTimestamp));
    const benchmarkComparison = this.emptyBenchmark();
    const aiExplanation = this.buildAiExplanation(performance, risk, trades, strategy);
    const ruleContribution = this.buildRuleContribution(trades, cfg);

    return {
      performance,
      risk,
      equityCurve,
      equityCurvePoints,
      drawdownCurve,
      trades,
      monthlyReturns,
      yearlyReturns,
      benchmarkComparison,
      aiExplanation,
      ruleContribution,
      metadata: {
        totalBars: data.length,
        dateRange: { start: data[0].timestamp, end: data[data.length - 1].timestamp },
        initialCapital: cfg.initialCapital,
        timeframe,
        symbol: cfg.symbol,
        backtestType: cfg.backtestType,
        timeRange: cfg.timeRange,
        entryRule: cfg.entryRules[0]?.signal ?? 'UNKNOWN',
        exitRule: cfg.exitRules[0]?.signal ?? 'UNKNOWN',
      },
      isValid: true,
    };
  }

  private buildSeries(data: OHLCV[], timeframe: Timeframe): SeriesSource {
    if (!this.indicatorEngine) {
      return { ema: new Map(), sma: new Map(), rsi: null, macdLine: null, macdSignal: null, volumeSma: null, volumeSpike: null };
    }
    const results = this.indicatorEngine.calculateAll(data, timeframe);
    const byName = new Map<string, IndicatorResult>();
    for (const r of results) byName.set(r.indicator, r);

    const ema = new Map<number, number[]>();
    const sma = new Map<number, number[]>();
    let rsi: number[] | null = null;
    let macdLine: number[] | null = null;
    let macdSignal: number[] | null = null;
    let volumeSma: number[] | null = null;
    let volumeSpike: number[] | null = null;

    for (const r of results) {
      const name = r.indicator;
      const values = this.toNumberArray(r.metadata?.values);
      if (name.startsWith('EMA_')) {
        const p = Number(name.split('_')[1]);
        ema.set(p, values);
      } else if (name.startsWith('SMA_')) {
        const p = Number(name.split('_')[1]);
        sma.set(p, values);
      } else if (name === 'RSI') {
        rsi = values;
      } else if (name === 'MACD') {
        macdLine = this.toNumberArray(r.metadata?.macdLine);
        macdSignal = this.toNumberArray(r.metadata?.signalLine);
      } else if (name === 'VolumeSMA') {
        volumeSma = values;
      } else if (name === 'VolumeSpike') {
        volumeSpike = values;
      }
    }
    return { ema, sma, rsi, macdLine, macdSignal, volumeSma, volumeSpike };
  }

  private toNumberArray(v: unknown): number[] {
    if (!Array.isArray(v)) return [];
    return v as number[];
  }

  private seriesAt(series: number[] | null, i: number): number {
    if (!series) return NaN;
    return i < series.length ? series[i] : NaN;
  }

  private mapAt(map: Map<number, number[]>, period: number, i: number): number {
    const s = map.get(period);
    return this.seriesAt(s ?? null, i);
  }

  private executeTrades(data: OHLCV[], ind: SeriesSource, cfg: BacktestStrategy): Trade[] {
    const trades: Trade[] = [];
    const entryRule = cfg.entryRules[0];
    const exitRule = cfg.exitRules[0];
    let inPosition = false;
    let entryPrice = 0;
    let entryIndex = 0;
    let trailingHigh = 0;

    const start = entryRule?.lookback ?? 0;
    for (let i = start; i < data.length; i++) {
      if (!inPosition) {
        if (this.checkEntrySignal(data, i, ind, entryRule)) {
          inPosition = true;
          entryPrice = data[i].close;
          entryIndex = i;
          trailingHigh = data[i].high;
        }
      } else {
        trailingHigh = Math.max(trailingHigh, data[i].high);
        const exitSignal = this.checkExitSignal(data, i, ind, entryPrice, trailingHigh, entryIndex, exitRule);
        if (exitSignal !== null) {
          trades.push({
            entryIndex,
            entryTimestamp: data[entryIndex].timestamp,
            entryPrice,
            exitIndex: i,
            exitTimestamp: data[i].timestamp,
            exitPrice: data[i].close,
            holdingDays: i - entryIndex,
            returnPercent: ((data[i].close - entryPrice) / entryPrice) * 100,
            returnAbsolute: data[i].close - entryPrice,
            exitReason: exitSignal,
          });
          inPosition = false;
        }
      }
    }

    if (inPosition) {
      const last = data[data.length - 1];
      trades.push({
        entryIndex,
        entryTimestamp: data[entryIndex].timestamp,
        entryPrice,
        exitIndex: data.length - 1,
        exitTimestamp: last.timestamp,
        exitPrice: last.close,
        holdingDays: data.length - 1 - entryIndex,
        returnPercent: ((last.close - entryPrice) / entryPrice) * 100,
        returnAbsolute: last.close - entryPrice,
        exitReason: 'HOLD_UNTIL_END',
      });
    }
    return trades;
  }

  private checkEntrySignal(data: OHLCV[], index: number, ind: SeriesSource, rule: EntryRule): boolean {
    if (!rule) return false;
    const current = data[index];
    switch (rule.signal) {
      case 'ALWAYS':
        return true;
      case 'CLOSE_ABOVE_EMA': {
        const emaVal = this.mapAt(ind.ema, rule.lookback, index);
        return !isNaN(emaVal) && current.close > emaVal;
      }
      case 'OPEN_ABOVE_EMA': {
        const emaVal = this.mapAt(ind.ema, rule.lookback, index);
        return !isNaN(emaVal) && current.open > emaVal;
      }
      case 'RSI_OVERSOLD': {
        const rsiVal = this.seriesAt(ind.rsi, index);
        return !isNaN(rsiVal) && rsiVal < rule.threshold;
      }
      case 'VOLUME_SPIKE': {
        const ratio = this.seriesAt(ind.volumeSpike, index);
        return !isNaN(ratio) && ratio >= rule.threshold;
      }
      case 'PRICE_ABOVE_SMA': {
        const smaVal = this.mapAt(ind.sma, rule.lookback, index);
        return !isNaN(smaVal) && current.close > smaVal;
      }
      case 'MACD_CROSSOVER': {
        if (index < 1) return false;
        const cur = this.seriesAt(ind.macdLine, index);
        const prev = this.seriesAt(ind.macdLine, index - 1);
        const curSig = this.seriesAt(ind.macdSignal, index);
        const prevSig = this.seriesAt(ind.macdSignal, index - 1);
        if ([cur, prev, curSig, prevSig].some((v) => isNaN(v))) return false;
        return cur > curSig && prev <= prevSig;
      }
      default:
        return false;
    }
  }

  private checkExitSignal(
    data: OHLCV[],
    index: number,
    ind: SeriesSource,
    entryPrice: number,
    trailingHigh: number,
    entryIndex: number,
    rule: ExitRule,
  ): Trade['exitReason'] | null {
    if (!rule) return null;
    const current = data[index];
    const pnlPercent = ((current.close - entryPrice) / entryPrice) * 100;

    switch (rule.signal) {
      case 'STOP_LOSS':
        return pnlPercent <= -rule.stopLossPercent ? 'STOP_LOSS' : null;
      case 'TAKE_PROFIT':
        return pnlPercent >= rule.takeProfitPercent ? 'TAKE_PROFIT' : null;
      case 'TRAILING_STOP': {
        const trailPnl = ((current.close - trailingHigh) / trailingHigh) * 100;
        return trailPnl <= -rule.trailingStopPercent ? 'TRAILING_STOP' : null;
      }
      case 'TIME_BASED':
        return index - entryIndex >= rule.maxHoldingDays ? 'TIME_BASED' : null;
      case 'RSI_OVERBOUGHT': {
        const rsiVal = this.seriesAt(ind.rsi, index);
        if (isNaN(rsiVal)) return null;
        return rsiVal > (rule.threshold || 70) ? 'RSI_OVERBOUGHT' : null;
      }
      case 'CLOSE_BELOW_EMA': {
        const emaVal = this.mapAt(ind.ema, rule.lookback || 20, index);
        if (isNaN(emaVal)) return null;
        return current.close < emaVal ? 'CLOSE_BELOW_EMA' : null;
      }
      case 'HOLD_UNTIL_END':
        return null;
      default:
        return null;
    }
  }

  private buildEquityCurve(trades: Trade[], initialCapital: number, positionSizePercent: number): number[] {
    const curve: number[] = [initialCapital];
    let equity = initialCapital;
    for (const trade of trades) {
      equity *= 1 + (trade.returnPercent / 100) * (positionSizePercent / 100);
      curve.push(Math.round(equity * 100) / 100);
    }
    return curve;
  }

  private calculatePerformance(
    trades: Trade[],
    data: OHLCV[],
    equityCurve: number[],
    cfg: BacktestStrategy,
    maxDrawdown: number,
  ): PerformanceMetrics {
    const returns = trades.map((t) => t.returnPercent);
    const winning = returns.filter((r) => r > 0);
    const losing = returns.filter((r) => r <= 0);

    const sortedReturns = [...returns].sort((a, b) => a - b);
    const median =
      sortedReturns.length % 2 === 0
        ? (sortedReturns[sortedReturns.length / 2 - 1] + sortedReturns[sortedReturns.length / 2]) / 2
        : sortedReturns[Math.floor(sortedReturns.length / 2)];

    const totalReturn = trades.reduce((acc, t) => acc * (1 + t.returnPercent / 100), 1) - 1;
    const totalDays = trades.reduce((acc, t) => acc + t.holdingDays, 0);
    const years = totalDays / (cfg.tradingDaysPerYear ?? 252);
    const cagr = years > 0 ? (Math.pow(1 + totalReturn, 1 / years) - 1) * 100 : 0;
    const annualReturn = cagr;

    const grossProfit = winning.reduce((a, r) => a + r, 0);
    const grossLoss = Math.abs(losing.reduce((a, r) => a + r, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const avgWin = winning.length > 0 ? grossProfit / winning.length : 0;
    const avgLoss = losing.length > 0 ? grossLoss / losing.length : 0;
    const expectancy =
      trades.length > 0 ? (winning.length / trades.length) * avgWin - (losing.length / trades.length) * avgLoss : 0;
    const riskReward = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    const totalBars = data.length;
    const barsInPosition = trades.reduce((acc, t) => acc + t.holdingDays, 0);
    const exposure = totalBars > 0 ? (barsInPosition / totalBars) * 100 : 0;

    const recoveryFactor = maxDrawdown > 0 ? (totalReturn * 100) / maxDrawdown : 0;

    return {
      totalTrades: trades.length,
      winningTrades: winning.length,
      losingTrades: losing.length,
      winRate: trades.length > 0 ? (winning.length / trades.length) * 100 : 0,
      lossRate: trades.length > 0 ? (losing.length / trades.length) * 100 : 0,
      averageReturn: trades.length > 0 ? returns.reduce((a, b) => a + b, 0) / trades.length : 0,
      medianReturn: median,
      averageWin: avgWin,
      averageLoss: avgLoss,
      bestTrade: returns.length > 0 ? Math.max(...returns) : 0,
      worstTrade: returns.length > 0 ? Math.min(...returns) : 0,
      cagr,
      annualReturn,
      profitFactor,
      totalReturn: totalReturn * 100,
      expectancy,
      exposure,
      recoveryFactor,
      riskReward,
    };
  }

  private calculateRisk(trades: Trade[], equityCurve: number[], cfg: BacktestStrategy): RiskMetrics {
    const returns = trades.map((t) => t.returnPercent);
    const dailyRf = (cfg.riskFreeRate ?? 0.15) / (cfg.tradingDaysPerYear ?? 252);

    const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((acc, r) => acc + (r - meanReturn) ** 2, 0) / returns.length : 0;
    const volatility = Math.sqrt(variance);

    const downsideReturns = returns.filter((r) => r < dailyRf * 100);
    const downsideVariance =
      downsideReturns.length > 0
        ? downsideReturns.reduce((acc, r) => acc + (r - dailyRf * 100) ** 2, 0) / downsideReturns.length
        : 0;
    const downsideDeviation = Math.sqrt(downsideVariance);

    const excessReturn = meanReturn - dailyRf * 100;
    const sharpeRatio = volatility > 0 ? (excessReturn / volatility) * Math.sqrt(cfg.tradingDaysPerYear ?? 252) : 0;
    const sortinoRatio = downsideDeviation > 0 ? (excessReturn / downsideDeviation) * Math.sqrt(cfg.tradingDaysPerYear ?? 252) : 0;

    let maxDrawdown = 0;
    let maxDrawdownDuration = 0;
    let peak = equityCurve[0];
    let drawdownStart = 0;
    for (let i = 1; i < equityCurve.length; i++) {
      if (equityCurve[i] > peak) {
        peak = equityCurve[i];
        drawdownStart = i;
      }
      const drawdown = peak > 0 ? ((peak - equityCurve[i]) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownDuration = i - drawdownStart;
      }
    }
    const calmarRatio = maxDrawdown > 0 ? (meanReturn * (cfg.tradingDaysPerYear ?? 252)) / maxDrawdown : 0;

    return { sharpeRatio, sortinoRatio, maxDrawdown, maxDrawdownDuration, volatility, downsideDeviation, calmarRatio };
  }

  private buildDrawdownCurve(equityCurve: number[], data: OHLCV[]): DrawdownPoint[] {
    const curve: DrawdownPoint[] = [];
    let peak = equityCurve[0];
    for (let i = 0; i < equityCurve.length; i++) {
      peak = Math.max(peak, equityCurve[i]);
      const value = equityCurve[i];
      const drawdownPercent = peak > 0 ? ((peak - value) / peak) * 100 : 0;
      curve.push({
        timestamp: i === 0 ? data[0].timestamp : this.timestampForStep(i, data),
        value,
        peak,
        drawdownPercent: Math.round(drawdownPercent * 100) / 100,
      });
    }
    return curve;
  }

  private buildEquityPoints(equityCurve: number[], data: OHLCV[], trades: Trade[]): EquityPoint[] {
    const points: EquityPoint[] = [];
    points.push({ timestamp: data[0].timestamp, value: equityCurve[0] });
    for (let i = 0; i < trades.length; i++) {
      points.push({ timestamp: trades[i].exitTimestamp, value: equityCurve[i + 1] });
    }
    return points;
  }

  private buildPeriodReturns(trades: Trade[], periodOf: (t: Trade) => string): PeriodReturn[] {
    const map = new Map<string, number>();
    for (const t of trades) {
      const p = periodOf(t);
      map.set(p, (map.get(p) ?? 0) + t.returnPercent);
    }
    return Array.from(map.entries())
      .map(([period, ret]) => ({ period, return: Math.round(ret * 100) / 100 }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private buildAiExplanation(
    performance: PerformanceMetrics,
    risk: RiskMetrics,
    trades: Trade[],
    strategy: BacktestStrategy,
  ): AiExplanation {
    const total = performance.totalTrades;
    const win = performance.winningTrades;
    const loss = performance.losingTrades;
    const pf = performance.profitFactor;
    const succ = performance.totalReturn > 0;

    const summary = succ
      ? `Strateji ${performance.totalReturn.toFixed(2)}% toplam getiri ile ${win}/${total} kârlı işlem.`
      : `Strateji ${performance.totalReturn.toFixed(2)}% toplam getiri ile ${loss}/${total} zararlı işlem.`;

    const successFactors = win > 0 ? [`Kazanma oranı %${performance.winRate.toFixed(1)}`, `Profit faktörü ${pf.toFixed(2)}`] : [];
    const failureFactors = loss > 0 ? [`Zararlı işlem oranı %${performance.lossRate.toFixed(1)}`, `Maksimum çekilme %${risk.maxDrawdown.toFixed(2)}`] : [];

    const strongPeriods: string[] = [];
    const weakPeriods: string[] = [];
    if (trades.length > 0) {
      const avg = performance.averageReturn;
      for (const t of trades) {
        const tag = `${this.monthOf(t.entryTimestamp)}`;
        if (t.returnPercent >= avg) {
          this.pushUnique(strongPeriods, tag);
        } else if (t.returnPercent < avg) {
          this.pushUnique(weakPeriods, tag);
        }
      }
    }

    const riskAnalysis = [
      `Volatilite: ${risk.volatility.toFixed(2)}`,
      `Maksimum çekilme: %${risk.maxDrawdown.toFixed(2)} (${risk.maxDrawdownDuration} gün)`,
      `Sharpe oranı: ${risk.sharpeRatio.toFixed(2)}`,
    ];

    const improvementSuggestions: string[] = [];
    if (performance.winRate < 50) improvementSuggestions.push('Girdi sinyallerini titrelendirmek (stop-loss) stratejisini gözden geçirin.');
    if (pf < 1) improvementSuggestions.push('Profit faktörü 1\'in altında; çıkış kurallarını güçlendirin.');
    if (risk.maxDrawdown > 20) improvementSuggestions.push('Maksimum çekilme yüksek; pozisyon büyüklüğünü azaltın.');
    if (improvementSuggestions.length === 0) improvementSuggestions.push('Strateji tutarlı; ağırlıklar korunmalı.');

    return {
      summary,
      successFactors,
      failureFactors,
      weakPeriods,
      strongPeriods,
      riskAnalysis,
      improvementSuggestions,
    };
  }

  private buildRuleContribution(trades: Trade[], cfg: BacktestStrategy): RuleContribution {
    const entryRule = cfg.entryRules[0];
    const exitRule = cfg.exitRules[0];
    const winning = trades.filter((t) => t.returnPercent > 0);
    return {
      entryRule: entryRule?.signal ?? 'UNKNOWN',
      exitRule: exitRule?.signal ?? 'UNKNOWN',
      trades: trades.length,
      winRate: trades.length > 0 ? (winning.length / trades.length) * 100 : 0,
      avgReturn: trades.length > 0 ? trades.reduce((a, t) => a + t.returnPercent, 0) / trades.length : 0,
    };
  }

  private emptyBenchmark(): BenchmarkComparison {
    return {
      strategyReturn: 0,
      benchmarkReturn: 0,
      excessReturn: 0,
      alpha: 0,
      beta: 0,
      informationRatio: 0,
      trackingError: 0,
      captureRatio: 0,
      isValid: false,
    };
  }

  private emptyResult(strategy: BacktestStrategy, reason: string, data?: OHLCV[]): BacktestResult {
    const now = data && data.length > 0 ? data[data.length - 1].timestamp : new Date().toISOString();
    return {
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        lossRate: 0,
        averageReturn: 0,
        medianReturn: 0,
        averageWin: 0,
        averageLoss: 0,
        bestTrade: 0,
        worstTrade: 0,
        cagr: 0,
        annualReturn: 0,
        profitFactor: 0,
        totalReturn: 0,
        expectancy: 0,
        exposure: 0,
        recoveryFactor: 0,
        riskReward: 0,
      },
      risk: {
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        maxDrawdownDuration: 0,
        volatility: 0,
        downsideDeviation: 0,
        calmarRatio: 0,
      },
      equityCurve: data && data.length > 0 ? [strategy.initialCapital ?? 100000] : [],
      equityCurvePoints: [],
      drawdownCurve: [],
      trades: [],
      monthlyReturns: [],
      yearlyReturns: [],
      benchmarkComparison: this.emptyBenchmark(),
      aiExplanation: {
        summary: reason,
        successFactors: [],
        failureFactors: [],
        weakPeriods: [],
        strongPeriods: [],
        riskAnalysis: [],
        improvementSuggestions: [],
      },
      ruleContribution: { entryRule: strategy.entryRules[0]?.signal ?? 'UNKNOWN', exitRule: strategy.exitRules[0]?.signal ?? 'UNKNOWN', trades: 0, winRate: 0, avgReturn: 0 },
      metadata: {
        totalBars: data ? data.length : 0,
        dateRange: { start: data && data.length > 0 ? data[0].timestamp : now, end: data && data.length > 0 ? data[data.length - 1].timestamp : now },
        initialCapital: strategy.initialCapital ?? 100000,
        timeframe: strategy.timeframe,
        symbol: strategy.symbol,
        backtestType: strategy.backtestType,
        timeRange: strategy.timeRange,
        entryRule: strategy.entryRules[0]?.signal ?? 'UNKNOWN',
        exitRule: strategy.exitRules[0]?.signal ?? 'UNKNOWN',
        reasons: [reason],
      },
      isValid: false,
    };
  }

  private monthOf(ts: string): string {
    return ts.slice(0, 7);
  }
  private yearOf(ts: string): string {
    return ts.slice(0, 4);
  }
  private timestampForStep(i: number, data: OHLCV[]): string {
    const idx = Math.min(i, data.length - 1);
    return data[idx]?.timestamp ?? new Date().toISOString();
  }
  private pushUnique(arr: string[], v: string): void {
    if (v && !arr.includes(v)) arr.push(v);
  }
}
