import { Injectable } from '@nestjs/common';
import { BacktestResult, BenchmarkComparison } from '../backtest.types';
import { BacktestStrategy } from '../backtest.types';
import { StrategyRankingDto, BacktestReportDto } from '../dto/strategy-ranking.dto';
import { BacktestResponseDto, BacktestHistoryItemDto } from '../dto/backtest-response.dto';

export interface BacktestEntry {
  id: string;
  symbol: string;
  timeframe: string;
  backtestType: string;
  strategy: BacktestStrategy;
  result: BacktestResult;
  benchmark: BenchmarkComparison;
  ranking: StrategyRankingDto;
  response: BacktestResponseDto;
  createdAt: string;
}

export function backtestId(symbol: string, timeframe: string, backtestType: string): string {
  return `${symbol}:${timeframe}:${backtestType}`;
}

@Injectable()
export class BacktestRegistry {
  private readonly entries = new Map<string, BacktestEntry>();

  store(entry: BacktestEntry): void {
    this.entries.set(entry.id, entry);
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  get(id: string): BacktestEntry | null {
    return this.entries.get(id) ?? null;
  }

  getBySymbol(symbol: string, timeframe = '1d', backtestType = 'indicator'): BacktestEntry | null {
    return this.entries.get(backtestId(symbol, timeframe, backtestType)) ?? null;
  }

  getAll(): BacktestEntry[] {
    return Array.from(this.entries.values());
  }

  history(symbol: string): BacktestHistoryItemDto[] {
    return Array.from(this.entries.values())
      .filter((e) => e.symbol === symbol)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((e) => this.toHistoryItem(e));
  }

  rankings(): StrategyRankingDto[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.ranking.score - a.ranking.score)
      .map((e, idx) => ({ ...e.ranking, rank: idx + 1 }));
  }

  learning(symbol: string, timeframe = '1d', backtestType = 'indicator'): BacktestEntry['result']['benchmarkComparison'] | null {
    return this.getBySymbol(symbol, timeframe, backtestType)?.benchmark ?? null;
  }

  report(symbol: string, timeframe = '1d', backtestType = 'indicator'): BacktestReportDto | null {
    const e = this.getBySymbol(symbol, timeframe, backtestType);
    if (!e) return null;
    return {
      id: e.id,
      symbol: e.symbol,
      timeframe: e.timeframe,
      backtestType: e.backtestType,
      result: e.result as unknown as Record<string, unknown>,
      createdAt: e.createdAt,
    };
  }

  clear(): void {
    this.entries.clear();
  }

  private toHistoryItem(e: BacktestEntry): BacktestHistoryItemDto {
    return {
      id: e.id,
      symbol: e.symbol,
      timeframe: e.timeframe as BacktestHistoryItemDto['timeframe'],
      backtestType: e.backtestType as BacktestHistoryItemDto['backtestType'],
      totalReturn: e.result.performance.totalReturn,
      sharpeRatio: e.result.risk.sharpeRatio,
      maxDrawdown: e.result.risk.maxDrawdown,
      winRate: e.result.performance.winRate,
      createdAt: e.createdAt,
    };
  }
}
