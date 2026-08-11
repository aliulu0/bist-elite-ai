import { Injectable } from '@nestjs/common';
import { Transaction } from '../types/portfolio.types';
import { ITransactionRepository } from '../interfaces/portfolio-repository.interface';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  private readonly transactions: Map<string, Transaction> = new Map();

  findByPortfolio(portfolioId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter((t) => t.portfolioId === portfolioId)
      .sort((a, b) => a.executedAt.localeCompare(b.executedAt));
  }

  findById(id: string): Transaction | undefined {
    return this.transactions.get(id);
  }

  findBySymbol(portfolioId: string, symbol: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter((t) => t.portfolioId === portfolioId && t.symbol === symbol)
      .sort((a, b) => a.executedAt.localeCompare(b.executedAt));
  }

  create(transaction: Transaction): Transaction {
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  delete(id: string): boolean {
    return this.transactions.delete(id);
  }

  getRange(portfolioId: string, startDate: string, endDate: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter((t) => t.portfolioId === portfolioId && t.executedAt >= startDate && t.executedAt <= endDate)
      .sort((a, b) => a.executedAt.localeCompare(b.executedAt));
  }
}
