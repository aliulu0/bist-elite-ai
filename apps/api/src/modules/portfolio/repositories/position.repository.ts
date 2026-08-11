import { Injectable } from '@nestjs/common';
import { Position } from '../types/portfolio.types';
import { IPositionRepository } from '../interfaces/portfolio-repository.interface';

@Injectable()
export class PositionRepository implements IPositionRepository {
  private readonly positions: Map<string, Position> = new Map();

  findByPortfolio(portfolioId: string): Position[] {
    return Array.from(this.positions.values()).filter((p) => p.portfolioId === portfolioId);
  }

  findById(id: string): Position | undefined {
    return this.positions.get(id);
  }

  findBySymbol(portfolioId: string, symbol: string): Position | undefined {
    return Array.from(this.positions.values()).find(
      (p) => p.portfolioId === portfolioId && p.symbol === symbol,
    );
  }

  create(position: Position): Position {
    this.positions.set(position.id, position);
    return position;
  }

  update(position: Position): Position {
    if (!this.positions.has(position.id)) throw new Error(`Position ${position.id} not found`);
    this.positions.set(position.id, position);
    return position;
  }

  delete(id: string): boolean {
    return this.positions.delete(id);
  }
}
