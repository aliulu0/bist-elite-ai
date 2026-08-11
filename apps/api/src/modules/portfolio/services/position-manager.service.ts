import { Injectable, Logger } from '@nestjs/common';
import { Position, Transaction, TransactionType } from '../types/portfolio.types';

@Injectable()
export class PositionManager {
  private readonly logger = new Logger(PositionManager.name);

  executeBuy(
    position: Position | undefined,
    transaction: Transaction,
    portfolioId: string,
  ): Position {
    if (position) {
      const totalCost = position.totalCost + transaction.total;
      const totalQuantity = position.quantity + transaction.quantity;
      const newAvgCost = this.round(totalCost / totalQuantity);
      return {
        ...position,
        quantity: totalQuantity,
        averageCost: newAvgCost,
        totalCost: totalCost,
        currentValue: totalQuantity * position.currentPrice,
        profitLoss: (position.currentPrice - newAvgCost) * totalQuantity,
        profitLossPercent: ((position.currentPrice - newAvgCost) / newAvgCost) * 100,
        lastBoughtAt: transaction.executedAt,
        highestPrice: Math.max(position.highestPrice, transaction.price),
        lowestPrice: Math.min(position.lowestPrice, transaction.price),
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      portfolioId,
      symbol: transaction.symbol,
      name: transaction.symbol,
      sector: '',
      industry: '',
      marketCap: 'LARGE',
      quantity: transaction.quantity,
      averageCost: transaction.price,
      totalCost: transaction.total,
      currentPrice: transaction.price,
      currentValue: transaction.quantity * transaction.price,
      profitLoss: 0,
      profitLossPercent: 0,
      weight: 0,
      contribution: 0,
      highestPrice: transaction.price,
      lowestPrice: transaction.price,
      risk: 0,
      firstBoughtAt: transaction.executedAt,
      lastBoughtAt: transaction.executedAt,
      updatedAt: new Date().toISOString(),
    };
  }

  executeSell(
    position: Position,
    transaction: Transaction,
  ): { updatedPosition: Position; closed: boolean; realizedPnL: number } {
    const remainingQuantity = position.quantity - transaction.quantity;
    const sellRatio = transaction.quantity / position.quantity;
    const costOfSoldShares = position.totalCost * sellRatio;
    const realizedPnL = transaction.total - costOfSoldShares;

    if (remainingQuantity <= 0) {
      return {
        updatedPosition: { ...position, quantity: 0, updatedAt: new Date().toISOString() },
        closed: true,
        realizedPnL: this.round(realizedPnL),
      };
    }

    const newTotalCost = position.totalCost - costOfSoldShares;
    const newAvgCost = newTotalCost / remainingQuantity;

    return {
      updatedPosition: {
        ...position,
        quantity: remainingQuantity,
        totalCost: this.round(newTotalCost),
        averageCost: this.round(newAvgCost),
        currentValue: remainingQuantity * position.currentPrice,
        profitLoss: (position.currentPrice - newAvgCost) * remainingQuantity,
        profitLossPercent: ((position.currentPrice - newAvgCost) / newAvgCost) * 100,
        updatedAt: new Date().toISOString(),
      },
      closed: false,
      realizedPnL: this.round(realizedPnL),
    };
  }

  updatePrices(positions: Position[], currentPrices: Map<string, number>): Position[] {
    return positions.map((pos) => {
      const price = currentPrices.get(pos.symbol);
      if (!price) return pos;
      const currentValue = pos.quantity * price;
      const profitLoss = currentValue - pos.totalCost;
      const profitLossPercent = pos.totalCost > 0 ? (profitLoss / pos.totalCost) * 100 : 0;
      return {
        ...pos,
        currentPrice: price,
        currentValue: this.round(currentValue),
        profitLoss: this.round(profitLoss),
        profitLossPercent: this.round(profitLossPercent),
        highestPrice: Math.max(pos.highestPrice, price),
        lowestPrice: Math.min(pos.lowestPrice, price),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  calculateWeights(positions: Position[], totalValue: number): Position[] {
    if (totalValue <= 0) return positions.map((p) => ({ ...p, weight: 0, contribution: 0 }));
    return positions.map((p) => ({
      ...p,
      weight: this.round((p.currentValue / totalValue) * 100),
      contribution: p.totalCost > 0
        ? this.round((p.profitLoss / p.totalCost) * 100)
        : 0,
    }));
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
