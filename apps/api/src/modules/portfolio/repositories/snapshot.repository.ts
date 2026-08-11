import { Injectable } from '@nestjs/common';
import { PortfolioSnapshot } from '../types/portfolio.types';
import { ISnapshotRepository } from '../interfaces/portfolio-repository.interface';

@Injectable()
export class SnapshotRepository implements ISnapshotRepository {
  private readonly snapshots: Map<string, PortfolioSnapshot> = new Map();

  findByPortfolio(portfolioId: string): PortfolioSnapshot[] {
    return Array.from(this.snapshots.values())
      .filter((s) => s.portfolioId === portfolioId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  findLatest(portfolioId: string): PortfolioSnapshot | undefined {
    const entries = this.findByPortfolio(portfolioId);
    return entries.length > 0 ? entries[entries.length - 1] : undefined;
  }

  create(snapshot: PortfolioSnapshot): PortfolioSnapshot {
    this.snapshots.set(snapshot.id, snapshot);
    return snapshot;
  }

  getRange(portfolioId: string, startDate: string, endDate: string): PortfolioSnapshot[] {
    return Array.from(this.snapshots.values())
      .filter((s) => s.portfolioId === portfolioId && s.timestamp >= startDate && s.timestamp <= endDate)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  deleteOlderThan(portfolioId: string, date: string): number {
    let count = 0;
    for (const [id, s] of this.snapshots.entries()) {
      if (s.portfolioId === portfolioId && s.timestamp < date) {
        this.snapshots.delete(id);
        count++;
      }
    }
    return count;
  }
}
