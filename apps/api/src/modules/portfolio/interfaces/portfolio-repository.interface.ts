import { Portfolio, Position, Transaction, PortfolioSnapshot } from '../types/portfolio.types';

export interface IPortfolioRepository {
  findAll(): Portfolio[];
  findById(id: string): Portfolio | undefined;
  findByName(name: string): Portfolio | undefined;
  create(portfolio: Portfolio): Portfolio;
  update(portfolio: Portfolio): Portfolio;
  delete(id: string): boolean;
}

export interface IPositionRepository {
  findByPortfolio(portfolioId: string): Position[];
  findById(id: string): Position | undefined;
  findBySymbol(portfolioId: string, symbol: string): Position | undefined;
  create(position: Position): Position;
  update(position: Position): Position;
  delete(id: string): boolean;
}

export interface ITransactionRepository {
  findByPortfolio(portfolioId: string): Transaction[];
  findById(id: string): Transaction | undefined;
  findBySymbol(portfolioId: string, symbol: string): Transaction[];
  create(transaction: Transaction): Transaction;
  delete(id: string): boolean;
  getRange(portfolioId: string, startDate: string, endDate: string): Transaction[];
}

export interface ISnapshotRepository {
  findByPortfolio(portfolioId: string): PortfolioSnapshot[];
  findLatest(portfolioId: string): PortfolioSnapshot | undefined;
  create(snapshot: PortfolioSnapshot): PortfolioSnapshot;
  getRange(portfolioId: string, startDate: string, endDate: string): PortfolioSnapshot[];
  deleteOlderThan(portfolioId: string, date: string): number;
}
