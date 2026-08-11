import { Injectable } from '@nestjs/common';
import { LearningReportDto } from '../dto/learning-report.dto';

export interface LearningRecord {
  symbol: string;
  timeframe: string;
  backtestType: string;
  report: LearningReportDto;
  createdAt: string;
}

@Injectable()
export class LearningRegistry {
  private readonly records = new Map<string, LearningRecord[]>();

  store(symbol: string, timeframe: string, backtestType: string, report: LearningReportDto): void {
    const key = this.key(symbol, timeframe, backtestType);
    const list = this.records.get(key) ?? [];
    list.push({ symbol, timeframe, backtestType, report, createdAt: report.updatedAt });
    this.records.set(key, list);
  }

  latest(symbol: string, timeframe = '1d', backtestType = 'indicator'): LearningRecord | null {
    const list = this.records.get(this.key(symbol, timeframe, backtestType));
    if (!list || list.length === 0) return null;
    return list[list.length - 1];
  }

  history(symbol: string, timeframe = '1d', backtestType = 'indicator'): LearningRecord[] {
    return this.records.get(this.key(symbol, timeframe, backtestType)) ?? [];
  }

  all(): LearningRecord[] {
    const out: LearningRecord[] = [];
    for (const list of this.records.values()) out.push(...list);
    return out;
  }

  clear(): void {
    this.records.clear();
  }

  private key(symbol: string, timeframe: string, backtestType: string): string {
    return `${symbol}:${timeframe}:${backtestType}`;
  }
}
