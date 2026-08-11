import { Injectable } from '@nestjs/common';
import { PortfolioSnapshot, Transaction, Position } from '../types/portfolio.types';
import { SnapshotRepository } from '../repositories/snapshot.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { PositionRepository } from '../repositories/position.repository';

@Injectable()
export class PortfolioHistory {
  constructor(
    private readonly snapshotRepo: SnapshotRepository,
    private readonly transactionRepo: TransactionRepository,
    private readonly positionRepo: PositionRepository,
  ) {}

  recordTransaction(portfolioId: string, transaction: Transaction): void {
    this.transactionRepo.create(transaction);
  }

  getTransactionHistory(portfolioId: string): Transaction[] {
    return this.transactionRepo.findByPortfolio(portfolioId);
  }

  getTransactionRange(portfolioId: string, startDate: string, endDate: string): Transaction[] {
    return this.transactionRepo.getRange(portfolioId, startDate, endDate);
  }

  recordSnapshot(portfolioId: string, totalValue: number, cash: number): PortfolioSnapshot {
    const snapshot: PortfolioSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      portfolioId,
      totalValue: Math.round(totalValue * 100) / 100,
      cash: Math.round(cash * 100) / 100,
      timestamp: new Date().toISOString(),
    };
    return this.snapshotRepo.create(snapshot);
  }

  getSnapshotHistory(portfolioId: string, startDate?: string, endDate?: string): PortfolioSnapshot[] {
    if (startDate && endDate) {
      return this.snapshotRepo.getRange(portfolioId, startDate, endDate);
    }
    return this.snapshotRepo.findByPortfolio(portfolioId);
  }

  getLatestSnapshot(portfolioId: string): PortfolioSnapshot | undefined {
    return this.snapshotRepo.findLatest(portfolioId);
  }

  pruneOldSnapshots(portfolioId: string, retentionDays: number): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    return this.snapshotRepo.deleteOlderThan(portfolioId, cutoff.toISOString());
  }

  getTotalInvested(portfolioId: string): number {
    const transactions = this.transactionRepo.findByPortfolio(portfolioId);
    return transactions
      .filter((t) => t.type === 'BUY')
      .reduce((sum, t) => sum + t.total, 0);
  }

  getTotalWithdrawn(portfolioId: string): number {
    const transactions = this.transactionRepo.findByPortfolio(portfolioId);
    return transactions
      .filter((t) => t.type === 'SELL')
      .reduce((sum, t) => sum + t.total, 0);
  }
}
