import { Injectable } from '@nestjs/common';
import { PositionState, PositionStatus, Order, OrderStatus, MarketRegime } from './types';

@Injectable()
export class PositionManagerService {
  openPosition(
    order: Order,
    executionPrice: number,
    executionTime: string,
    stockName: string,
    marketRegime: MarketRegime,
    timeframeConsensus: string,
    strategyUsed: string,
    sector?: string,
  ): PositionState {
    return {
      id: `pos-${order.stockSymbol}-${Date.now()}`,
      stockSymbol: order.stockSymbol,
      stockName,
      status: PositionStatus.OPEN,
      side: 'BUY',
      quantity: order.quantity,
      avgCost: executionPrice,
      currentPrice: executionPrice,
      unrealizedPnl: 0,
      realizedPnl: 0,
      entryTime: executionTime,
      holdingPeriodDays: 0,
      notes: [order.notes],
      entryEliteScore: order.eliteScore,
      entryConfidence: order.confidenceScore,
      entryConsensusScore: order.consensusScore,
      strategyUsed,
      marketRegime,
      timeframeConsensus,
      sector,
    };
  }

  closePosition(
    position: PositionState,
    exitPrice: number,
    exitTime: string,
    notes?: string,
  ): PositionState {
    const realizedPnl = (exitPrice - position.avgCost) * position.quantity;
    const holdingDays = this.calculateHoldingPeriod(position.entryTime, exitTime);

    return {
      ...position,
      status: PositionStatus.CLOSED,
      exitPrice,
      exitTime,
      realizedPnl,
      unrealizedPnl: 0,
      holdingPeriodDays: holdingDays,
      notes: [...position.notes, notes || `Kapatıldı: ₺${exitPrice}`],
    };
  }

  partialClose(
    position: PositionState,
    closeQuantity: number,
    exitPrice: number,
    exitTime: string,
    notes?: string,
  ): { closed: PositionState; remaining: PositionState } {
    const realizedPnl = (exitPrice - position.avgCost) * closeQuantity;
    const holdingDays = this.calculateHoldingPeriod(position.entryTime, exitTime);

    const closed: PositionState = {
      ...position,
      id: `${position.id}-closed-${Date.now()}`,
      status: PositionStatus.CLOSED,
      quantity: closeQuantity,
      exitPrice,
      exitTime,
      realizedPnl,
      unrealizedPnl: 0,
      holdingPeriodDays: holdingDays,
      notes: [...position.notes, notes || `Kısmi kapatma: ${closeQuantity} adet @ ₺${exitPrice}`],
    };

    const remaining: PositionState = {
      ...position,
      quantity: position.quantity - closeQuantity,
      unrealizedPnl: (exitPrice - position.avgCost) * (position.quantity - closeQuantity),
    };

    return { closed, remaining };
  }

  updateCurrentPrice(position: PositionState, currentPrice: number): PositionState {
    const unrealizedPnl = (currentPrice - position.avgCost) * position.quantity;
    return {
      ...position,
      currentPrice,
      unrealizedPnl,
    };
  }

  calculateHoldingPeriod(entryTime: string, exitTime: string): number {
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const diffMs = exit.getTime() - entry.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  getOpenPositions(positions: Map<string, PositionState>): PositionState[] {
    const result: PositionState[] = [];
    positions.forEach(p => {
      if (p.status === PositionStatus.OPEN) {
        result.push(p);
      }
    });
    return result;
  }

  getClosedPositions(positions: Map<string, PositionState>): PositionState[] {
    const result: PositionState[] = [];
    positions.forEach(p => {
      if (p.status === PositionStatus.CLOSED) {
        result.push(p);
      }
    });
    return result;
  }

  getPosition(positions: Map<string, PositionState>, stockSymbol: string): PositionState | undefined {
    return positions.get(stockSymbol);
  }
}
