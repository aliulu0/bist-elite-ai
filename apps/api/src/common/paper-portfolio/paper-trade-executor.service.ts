import { Injectable } from '@nestjs/common';
import { Order, OrderStatus, PaperPortfolioConfig, PortfolioState } from './types';

@Injectable()
export class PaperTradeExecutorService {
  executeBuy(
    stockSymbol: string,
    stockName: string,
    quantity: number,
    currentPrice: number,
    eliteScore: number,
    consensusScore: number,
    confidenceScore: number,
    signalSource: string,
    notes: string,
    config: PaperPortfolioConfig,
  ): Order {
    const slippage = this.calculateSlippage(currentPrice, 'BUY', config);
    const executionPrice = currentPrice + slippage;
    const transactionCost = this.calculateTransactionCost(executionPrice * quantity, config);

    return {
      id: `ord-${stockSymbol}-${Date.now()}`,
      stockSymbol,
      stockName,
      side: 'BUY',
      quantity,
      price: currentPrice,
      status: OrderStatus.FILLED,
      executionPrice,
      executionTime: new Date().toISOString(),
      slippage,
      transactionCost,
      signalSource,
      eliteScore,
      consensusScore,
      confidenceScore,
      notes,
      createdAt: new Date().toISOString(),
    };
  }

  executeSell(
    stockSymbol: string,
    stockName: string,
    quantity: number,
    currentPrice: number,
    eliteScore: number,
    consensusScore: number,
    confidenceScore: number,
    signalSource: string,
    notes: string,
    config: PaperPortfolioConfig,
  ): Order {
    const slippage = this.calculateSlippage(currentPrice, 'SELL', config);
    const executionPrice = currentPrice - slippage;
    const transactionCost = this.calculateTransactionCost(executionPrice * quantity, config);

    return {
      id: `ord-${stockSymbol}-${Date.now()}`,
      stockSymbol,
      stockName,
      side: 'SELL',
      quantity,
      price: currentPrice,
      status: OrderStatus.FILLED,
      executionPrice,
      executionTime: new Date().toISOString(),
      slippage,
      transactionCost,
      signalSource,
      eliteScore,
      consensusScore,
      confidenceScore,
      notes,
      createdAt: new Date().toISOString(),
    };
  }

  calculateSlippage(price: number, side: 'BUY' | 'SELL', config: PaperPortfolioConfig): number {
    const slippageAmount = price * config.slippagePercent;
    return Math.round(slippageAmount * 100) / 100;
  }

  calculateTransactionCost(amount: number, config: PaperPortfolioConfig): number {
    const cost = amount * config.transactionCostPercent;
    return Math.round(cost * 100) / 100;
  }

  validateBuyOrder(
    portfolio: PortfolioState,
    quantity: number,
    price: number,
    config: PaperPortfolioConfig,
  ): { valid: boolean; reason: string } {
    const totalCost = quantity * price;
    const orderWithCost = totalCost + this.calculateTransactionCost(totalCost, config);

    if (orderWithCost > portfolio.cashBalance) {
      return { valid: false, reason: 'Yetersiz nakit bakiyesi' };
    }

    if (totalCost < config.minPositionSize) {
      return { valid: false, reason: `Minimum pozisyon büyüklüğü ₺${config.minPositionSize}` };
    }

    const positionPercent = totalCost / (portfolio.cashBalance + this.getInvestedValue(portfolio));
    if (positionPercent > config.maxPositionSizePercent) {
      return {
        valid: false,
        reason: `Pozisyon büyüklüğü limiti aşıyor: %${(positionPercent * 100).toFixed(1)} > %${(config.maxPositionSizePercent * 100).toFixed(0)}`,
      };
    }

    const openCount = this.getOpenPositionCount(portfolio);
    if (openCount >= config.maxPositions) {
      return { valid: false, reason: `Maksimum pozisyon sayısına ulaşıldı: ${config.maxPositions}` };
    }

    return { valid: true, reason: 'Geçerli' };
  }

  validateSellOrder(
    portfolio: PortfolioState,
    stockSymbol: string,
    quantity: number,
  ): { valid: boolean; reason: string } {
    const position = portfolio.positions.get(stockSymbol);

    if (!position || position.status !== 'OPEN') {
      return { valid: false, reason: `${stockSymbol} için açık pozisyon bulunamadı` };
    }

    if (quantity > position.quantity) {
      return { valid: false, reason: `Yetersiz pozisyon: ${quantity} > ${position.quantity}` };
    }

    return { valid: true, reason: 'Geçerli' };
  }

  rejectOrder(
    stockSymbol: string,
    stockName: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    price: number,
    reason: string,
    eliteScore: number,
    consensusScore: number,
    confidenceScore: number,
  ): Order {
    return {
      id: `ord-${stockSymbol}-${Date.now()}`,
      stockSymbol,
      stockName,
      side,
      quantity,
      price,
      status: OrderStatus.REJECTED,
      slippage: 0,
      transactionCost: 0,
      signalSource: 'rejected',
      eliteScore,
      consensusScore,
      confidenceScore,
      notes: `Reddedildi: ${reason}`,
      createdAt: new Date().toISOString(),
    };
  }

  private getInvestedValue(portfolio: PortfolioState): number {
    let invested = 0;
    portfolio.positions.forEach(p => {
      if (p.status === 'OPEN') {
        invested += p.quantity * p.currentPrice;
      }
    });
    return invested;
  }

  private getOpenPositionCount(portfolio: PortfolioState): number {
    let count = 0;
    portfolio.positions.forEach(p => {
      if (p.status === 'OPEN') count++;
    });
    return count;
  }
}
