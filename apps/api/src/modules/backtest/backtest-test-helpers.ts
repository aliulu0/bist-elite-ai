import { OHLCV } from '../indicators/indicator.types';
import { MarketDataPoint } from '../market-data/interfaces/market-data.types';
import { BacktestResult, BacktestStrategy, Trade, BenchmarkComparison } from './backtest.types';
import { BenchmarkResult } from '../benchmark/benchmark.types';
import { LearningReportDto, LearningSummaryDto } from './dto/learning-report.dto';
import { BacktestResponseDto } from './dto/backtest-response.dto';
import { BacktestRequestDto } from './dto/backtest-request.dto';
import {
  StrategyRankingDto,
  PortfolioSignalDto,
  TomorrowFeedbackResultDto,
  EliteScoreWeightDeltaDto,
  BacktestReportDto,
} from './dto/strategy-ranking.dto';

export function stubTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    entryIndex: 0,
    entryTimestamp: '2024-01-01',
    entryPrice: 100,
    exitIndex: 5,
    exitTimestamp: '2024-01-06',
    exitPrice: 105,
    holdingDays: 5,
    returnPercent: 5,
    returnAbsolute: 5,
    exitReason: 'TAKE_PROFIT',
    ...overrides,
  };
}

export function stubStrategy(overrides: Partial<BacktestStrategy> = {}): BacktestStrategy {
  return {
    entryRules: [{ signal: 'ALWAYS', threshold: 0, lookback: 0 }],
    exitRules: [
      { signal: 'TAKE_PROFIT', stopLossPercent: 5, takeProfitPercent: 10, trailingStopPercent: 8, maxHoldingDays: 30, lookback: 20, threshold: 70 },
    ],
    initialCapital: 100000,
    positionSizePercent: 100,
    riskFreeRate: 0.15,
    tradingDaysPerYear: 252,
    minTradesRequired: 1,
    symbol: 'THYAO.IS',
    timeframe: '1d',
    backtestType: 'indicator',
    timeRange: '1Y',
    benchmarkTicker: 'XU030.IS',
    days: 252,
    ...overrides,
  } as BacktestStrategy;
}

export function stubResult(overrides: Partial<BacktestResult> = {}): BacktestResult {
  const { performance: perfOver, risk: riskOver, trades: tradesOver, ...rest } = overrides;
  const trades: Trade[] = tradesOver ?? [stubTrade()];
  const winning = trades.filter((t) => t.returnPercent > 0).length;
  const losing = trades.filter((t) => t.returnPercent <= 0).length;
  return {
    performance: {
      winRate: 100,
      lossRate: 0,
      averageReturn: 5,
      medianReturn: 5,
      averageWin: 5,
      averageLoss: 0,
      bestTrade: 5,
      worstTrade: 5,
      cagr: 5,
      annualReturn: 5,
      profitFactor: 2,
      totalReturn: 5,
      expectancy: 5,
      exposure: 2,
      recoveryFactor: 5,
      riskReward: 2,
      ...perfOver,
      totalTrades: trades.length,
      winningTrades: winning,
      losingTrades: losing,
    },
    risk: {
      sharpeRatio: 1.5,
      sortinoRatio: 2.0,
      maxDrawdown: 3,
      maxDrawdownDuration: 0,
      volatility: 10,
      downsideDeviation: 5,
      calmarRatio: 0.5,
      ...riskOver,
    },
    equityCurve: [100000, 105000],
    equityCurvePoints: [{ timestamp: '2024-01-01', value: 100000 }],
    drawdownCurve: [{ timestamp: '2024-01-01', value: 100000, peak: 100000, drawdownPercent: 0 }],
    trades,
    monthlyReturns: [{ period: '2024-01', return: 5 }],
    yearlyReturns: [{ period: '2024', return: 5 }],
    benchmarkComparison: {
      strategyReturn: 5,
      benchmarkReturn: 3,
      excessReturn: 2,
      alpha: 2,
      beta: 1,
      informationRatio: 1,
      trackingError: 2,
      captureRatio: 1.5,
      isValid: true,
    },
    aiExplanation: {
      summary: 'Strateji 5.00% toplam getiri ile 1/1 kârlı işlem.',
      successFactors: ['Kazanma oranı %100.0', 'Profit faktörü 2.00'],
      failureFactors: [],
      weakPeriods: [],
      strongPeriods: [],
      riskAnalysis: ['Volatilite: 10.00', 'Maksimum çekilme: %3.00 (0 gün)', 'Sharpe oranı: 1.50'],
      improvementSuggestions: ['Strateji tutarlı; ağırlıklar korunmalı.'],
    },
    ruleContribution: { entryRule: 'ALWAYS', exitRule: 'TAKE_PROFIT', trades: 1, winRate: 100, avgReturn: 5 },
    metadata: {
      totalBars: 10,
      dateRange: { start: '2024-01-01', end: '2024-01-10' },
      initialCapital: 100000,
      timeframe: '1d',
      symbol: 'THYAO.IS',
      backtestType: 'indicator',
      timeRange: '1Y',
      entryRule: 'ALWAYS',
      exitRule: 'TAKE_PROFIT',
    },
    isValid: true,
    ...rest,
  } as BacktestResult;
}

export function stubBenchmarkResult(): BenchmarkResult {
  return {
    strategyReturn: 5,
    benchmarkReturn: 3,
    sectorReturn: 2,
    alpha: 2,
    beta: 1,
    trackingError: 2,
    informationRatio: 1,
    captureRatio: 1.5,
    excessReturn: 2,
    metadata: {},
    isValid: true,
  };
}

export function stubBenchmarkComparison(overrides: Partial<BenchmarkComparison> = {}): BenchmarkComparison {
  return {
    strategyReturn: 5,
    benchmarkReturn: 3,
    excessReturn: 2,
    alpha: 2,
    beta: 1,
    informationRatio: 1,
    trackingError: 2,
    captureRatio: 1.5,
    isValid: true,
    ...overrides,
  };
}

export function stubLearningReport(overrides: Partial<LearningReportDto> = {}): LearningReportDto {
  return {
    symbol: 'THYAO.IS',
    timeframe: '1d',
    backtestType: 'indicator',
    strategy: stubStrategy(),
    performance: {
      totalReturn: 5,
      cagr: 5,
      sharpeRatio: 1.5,
      maxDrawdown: 3,
      winRate: 100,
      profitFactor: 2,
      totalTrades: 1,
    },
    ruleStats: [],
    weightRecommendations: { 'ALWAYS/TAKE_PROFIT': 100 },
    confidence: 0.8,
    expectedImprovement: 2.5,
    recommendations: ['Strateji tutarlı; ağırlıklar korunmalı.'],
    learningFlowSteps: ['Strateji çalıştırıldı.', 'Öğrenme tamam.', 'Güven skoru: 80.0%'],
    updatedAt: '2025-01-15T12:00:00.000Z',
    ...overrides,
  };
}

export function stubMarketDataPoints(count: number, start = '2024-01-01'): MarketDataPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    symbol: 'THYAO.IS',
    timeframe: '1d',
    open: 100 + i,
    high: 105 + i,
    low: 98 + i,
    close: 100 + i * 1.1,
    volume: 1000000,
    timestamp: new Date(Date.parse(start) + i * 86400000).toISOString(),
    validationStatus: 'valid',
  }));
}

export function stubOhlcv(count: number): OHLCV[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.parse('2024-01-01') + i * 86400000).toISOString(),
    open: 100 + i,
    high: 105 + i,
    low: 98 + i,
    close: 100 + i * 1.1,
    volume: 1000000,
  }));
}

export function stubLearning(): LearningReportDto {
  return stubLearningReport();
}

export function stubSummary(): LearningSummaryDto {
  return { confidence: 0.8, expectedImprovement: 2.5, winRate: 100, totalReturn: 5 };
}

export function stubResponse(overrides: Partial<BacktestResponseDto> = {}): BacktestResponseDto {
  return {
    id: 'THYAO.IS:1d:indicator',
    symbol: 'THYAO.IS',
    timeframe: '1d',
    backtestType: 'indicator',
    timeRange: '1Y',
    initialCapital: 100000,
    result: stubResult(),
    learning: stubSummary(),
    benchmark: { strategyReturn: 5, benchmarkReturn: 3, alpha: 2, beta: 1, informationRatio: 1, isValid: true },
    createdAt: '2025-01-15T12:00:00.000Z',
    ...overrides,
  } as BacktestResponseDto;
}

export function stubRanking(overrides: Partial<StrategyRankingDto> = {}): StrategyRankingDto {
  return {
    symbol: 'THYAO.IS',
    backtestType: 'indicator',
    rank: 1,
    totalReturn: 5,
    score: 0.9,
    cagr: 5,
    sharpeRatio: 1.5,
    maxDrawdown: 3,
    winRate: 100,
    profitFactor: 2,
    totalTrades: 1,
    confidence: 0.8,
    lastUpdated: '2025-01-15T12:00:00.000Z',
    ...overrides,
  };
}

export function stubSignal(overrides: Partial<PortfolioSignalDto> = {}): PortfolioSignalDto {
  return {
    symbol: 'THYAO.IS',
    timeframe: '1d',
    action: 'BUY',
    confidence: 0.8,
    sizePercent: 60,
    rationale: ['test'],
    basedOn: { totalReturn: 5, sharpeRatio: 1.5, winRate: 100, maxDrawdown: 3 },
    ...overrides,
  } as PortfolioSignalDto;
}

export function stubFeedback(overrides: Partial<TomorrowFeedbackResultDto> = {}): TomorrowFeedbackResultDto {
  return {
    symbol: 'THYAO.IS',
    predicted: 5,
    actual: 7,
    delta: 2,
    direction: 'UPGRADE',
    confidence: 0.8,
    reason: 'test',
    ...overrides,
  };
}

export function stubEliteDelta(overrides: Partial<EliteScoreWeightDeltaDto> = {}): EliteScoreWeightDeltaDto {
  return {
    symbol: 'THYAO.IS',
    weightDelta: { momentum: 0.1, quality: 1, risk: 0.9 },
    updatedAt: '2025-01-15T12:00:00.000Z',
    ...overrides,
  };
}

export function stubReport(overrides: Partial<BacktestReportDto> = {}): BacktestReportDto {
  return {
    id: 'THYAO.IS:1d:indicator',
    symbol: 'THYAO.IS',
    timeframe: '1d',
    backtestType: 'indicator',
    result: { totalReturn: 5 } as unknown as Record<string, unknown>,
    createdAt: '2025-01-15T12:00:00.000Z',
    ...overrides,
  } as BacktestReportDto;
}

export function stubRequest(overrides: Partial<BacktestRequestDto> = {}): BacktestRequestDto {
  return { symbol: 'THYAO.IS', ...overrides } as BacktestRequestDto;
}
