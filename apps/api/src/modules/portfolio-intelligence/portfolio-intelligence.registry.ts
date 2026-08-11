import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  PORTFOLIO_INTELLIGENCE_CACHE_MAX_POSITIONS,
} from './portfolio-intelligence.config';
import {
  PortfolioPositionInput,
  PortfolioSnapshot,
  SnapshotComparison,
  StoredPortfolioPosition,
} from './portfolio-intelligence.types';

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

@Injectable()
export class PortfolioIntelligenceRegistry {
  private readonly positions = new Map<string, StoredPortfolioPosition>();
  private readonly snapshots: PortfolioSnapshot[] = [];

  upsertPosition(input: PortfolioPositionInput): StoredPortfolioPosition {
    const ticker = normalizeTicker(input.ticker);
    const now = new Date().toISOString();
    const existing = this.positions.get(ticker);
    if (existing) {
      const updated: StoredPortfolioPosition = {
        ...existing,
        quantity: input.quantity,
        averageCost: input.averageCost,
        currentPrice: input.currentPrice ?? existing.currentPrice,
        manualTarget: input.manualTarget ?? existing.manualTarget,
        manualStop: input.manualStop ?? existing.manualStop,
        notes: input.notes ?? existing.notes,
        portfolioWeight: input.portfolioWeight ?? existing.portfolioWeight,
        updatedAt: now,
      };
      this.positions.set(ticker, updated);
      return updated;
    }
    const created: StoredPortfolioPosition = {
      ticker,
      quantity: input.quantity,
      averageCost: input.averageCost,
      currentPrice: input.currentPrice ?? null,
      manualTarget: input.manualTarget ?? null,
      manualStop: input.manualStop ?? null,
      notes: input.notes ?? null,
      portfolioWeight: input.portfolioWeight ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.positions.set(ticker, created);
    this.enforceMaxSize();
    return created;
  }

  private enforceMaxSize(): void {
    while (this.positions.size > PORTFOLIO_INTELLIGENCE_CACHE_MAX_POSITIONS) {
      const oldestKey = [...this.positions.entries()].sort(
        (a, b) => a[1].createdAt.localeCompare(b[1].createdAt),
      )[0]?.[0];
      if (oldestKey === undefined) break;
      this.positions.delete(oldestKey);
    }
  }

  getPosition(ticker: string): StoredPortfolioPosition | null {
    return this.positions.get(normalizeTicker(ticker)) ?? null;
  }

  getAllPositions(): StoredPortfolioPosition[] {
    return [...this.positions.values()];
  }

  removePosition(ticker: string): boolean {
    return this.positions.delete(normalizeTicker(ticker));
  }

  hasPosition(ticker: string): boolean {
    return this.positions.has(normalizeTicker(ticker));
  }

  countPositions(): number {
    return this.positions.size;
  }

  clearPositions(): void {
    this.positions.clear();
  }

  saveSnapshot(snapshot: Omit<PortfolioSnapshot, 'id'>): PortfolioSnapshot {
    const full: PortfolioSnapshot = {
      ...snapshot,
      id: randomUUID(),
    };
    this.snapshots.push(full);
    if (this.snapshots.length > 50) {
      this.snapshots.splice(0, this.snapshots.length - 50);
    }
    return full;
  }

  getLatestSnapshot(): PortfolioSnapshot | null {
    if (this.snapshots.length === 0) return null;
    return this.snapshots[this.snapshots.length - 1];
  }

  getHistory(): PortfolioSnapshot[] {
    return [...this.snapshots];
  }

  compareSnapshots(): SnapshotComparison | null {
    if (this.snapshots.length < 2) return null;
    const previous = this.snapshots[this.snapshots.length - 2];
    const latest = this.snapshots[this.snapshots.length - 1];

    const improving: Array<{ ticker: string; change: number }> = [];
    const deteriorating: Array<{ ticker: string; change: number }> = [];
    for (const ticker of Object.keys(latest.positionScores)) {
      const prevScore = previous.positionScores[ticker];
      const latestScore = latest.positionScores[ticker];
      if (prevScore === undefined) continue;
      const change = Math.round((latestScore - prevScore) * 100) / 100;
      if (change > 0.5) improving.push({ ticker, change });
      if (change < -0.5) deteriorating.push({ ticker, change });
    }
    improving.sort((a, b) => b.change - a.change);
    deteriorating.sort((a, b) => a.change - b.change);

    return {
      scoreChange: Math.round((latest.score - previous.score) * 100) / 100,
      statusChange: previous.statusKey === latest.statusKey ? 'değişmedi' : `${previous.statusLabel} → ${latest.statusLabel}`,
      improvingPositions: improving,
      deterioratingPositions: deteriorating,
    };
  }

  clearSnapshots(): void {
    this.snapshots.length = 0;
  }
}
