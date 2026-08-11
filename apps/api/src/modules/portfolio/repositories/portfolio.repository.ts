import { Injectable } from '@nestjs/common';
import { Portfolio } from '../types/portfolio.types';
import { IPortfolioRepository } from '../interfaces/portfolio-repository.interface';

@Injectable()
export class PortfolioRepository implements IPortfolioRepository {
  private readonly portfolios: Map<string, Portfolio> = new Map();

  findAll(): Portfolio[] {
    return Array.from(this.portfolios.values());
  }

  findById(id: string): Portfolio | undefined {
    return this.portfolios.get(id);
  }

  findByName(name: string): Portfolio | undefined {
    for (const p of this.portfolios.values()) {
      if (p.name === name) return p;
    }
    return undefined;
  }

  create(portfolio: Portfolio): Portfolio {
    this.portfolios.set(portfolio.id, portfolio);
    return portfolio;
  }

  update(portfolio: Portfolio): Portfolio {
    if (!this.portfolios.has(portfolio.id)) throw new Error(`Portfolio ${portfolio.id} not found`);
    this.portfolios.set(portfolio.id, portfolio);
    return portfolio;
  }

  delete(id: string): boolean {
    return this.portfolios.delete(id);
  }
}
