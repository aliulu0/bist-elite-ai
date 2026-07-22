import { Injectable } from '@nestjs/common';
import { PaperRiskManagerService } from './paper-risk-manager.service';
import { PaperPerformanceTrackerService } from './paper-performance-tracker.service';
import { PaperReportGeneratorService } from './paper-report-generator.service';
import { PaperTradeExecutorService } from './paper-trade-executor.service';
import { PositionManagerService } from './position-manager.service';
import {
  PortfolioState, PaperPortfolioConfig, PAPER_PORTFOLIO_DEFAULTS,
  PositionStatus, PositionState, ExecuteSignalInput, ClosePositionInput,
  PartialCloseInput, PortfolioSummary, PerformanceReport,
  RiskAssessment, MarketRegime,
} from './types';

@Injectable()
export class PaperPortfolioOrchestratorService {
  private portfolio: PortfolioState;

  constructor(
    private readonly riskManager: PaperRiskManagerService,
    private readonly performanceTracker: PaperPerformanceTrackerService,
    private readonly reportGenerator: PaperReportGeneratorService,
    private readonly tradeExecutor: PaperTradeExecutorService,
    private readonly positionManager: PositionManagerService,
    private readonly config: PaperPortfolioConfig = PAPER_PORTFOLIO_DEFAULTS,
  ) {
    this.portfolio = this.createDefaultPortfolio();
  }

  executeSignal(input: ExecuteSignalInput): {
    success: boolean;
    orderId?: string;
    message: string;
    portfolioState: PortfolioState;
  } {
    const riskCheck = this.riskManager.checkPositionLimit(
      this.portfolio, input.quantity, input.currentPrice, this.config,
    );
    if (!riskCheck.allowed) {
      return { success: false, message: riskCheck.reason, portfolioState: this.portfolio };
    }

    const maxPosCheck = this.riskManager.checkMaxPositions(this.portfolio, this.config);
    if (!maxPosCheck.allowed) {
      return { success: false, message: maxPosCheck.reason, portfolioState: this.portfolio };
    }

    const drawdownCheck = this.riskManager.checkDrawdownLimit(this.portfolio, this.config);
    if (!drawdownCheck.withinLimit) {
      return {
        success: false,
        message: `Drawdown limiti aşıldı: -${drawdownCheck.currentDrawdown.toFixed(2)}%`,
        portfolioState: this.portfolio,
      };
    }

    const order = this.tradeExecutor.executeBuy(
      input.stockSymbol,
      input.stockName,
      input.quantity,
      input.currentPrice,
      input.eliteScore || 70,
      input.consensusScore || 70,
      input.confidenceScore || 0.7,
      input.strategyUsed || 'elite-score',
      input.notes || '',
      this.config,
    );

    const totalOrderCost = (order.executionPrice || order.price) * order.quantity + order.transactionCost;
    this.portfolio.cashBalance -= totalOrderCost;
    this.portfolio.orders.push(order);
    this.portfolio.updatedAt = new Date().toISOString();

    const position = this.positionManager.openPosition(
      order,
      order.executionPrice || order.price,
      order.executionTime || new Date().toISOString(),
      input.stockName,
      input.marketRegime || MarketRegime.SIDEWAYS,
      input.timeframeConsensus || 'balanced',
      input.strategyUsed || 'elite-score',
      input.sector,
    );
    this.portfolio.positions.set(input.stockSymbol, position);

    this.updatePeakValue();

    return {
      success: true,
      orderId: order.id,
      message: `${input.stockSymbol} satın alındı: ${input.quantity} lot @ ${(order.executionPrice || order.price).toFixed(2)}`,
      portfolioState: this.portfolio,
    };
  }

  closePosition(input: ClosePositionInput): {
    success: boolean;
    message: string;
    realizedPnl: number;
    portfolioState: PortfolioState;
  } {
    const position = this.portfolio.positions.get(input.stockSymbol);
    if (!position || position.status !== PositionStatus.OPEN) {
      return {
        success: false,
        message: `${input.stockSymbol} için açık pozisyon bulunamadı`,
        realizedPnl: 0,
        portfolioState: this.portfolio,
      };
    }

    const order = this.tradeExecutor.executeSell(
      input.stockSymbol,
      position.stockName,
      position.quantity,
      input.exitPrice,
      position.entryEliteScore,
      position.entryConsensusScore,
      position.entryConfidence,
      'manual-close',
      input.notes || 'Manuel kapatma',
      this.config,
    );

    const totalSellProceeds = (order.executionPrice || order.price) * order.quantity - order.transactionCost;
    const realizedPnl = totalSellProceeds - (position.avgCost * position.quantity);

    this.portfolio.cashBalance += totalSellProceeds;
    this.portfolio.orders.push(order);
    this.portfolio.updatedAt = new Date().toISOString();

    const closedPosition = this.positionManager.closePosition(
      position, input.exitPrice, new Date().toISOString(), input.notes,
    );
    this.portfolio.positions.delete(input.stockSymbol);
    this.portfolio.positions.set(`${input.stockSymbol}_closed`, closedPosition);

    this.updatePeakValue();

    return {
      success: true,
      message: `${input.stockSymbol} kapatıldı. K/Z: ${realizedPnl.toFixed(2)} TL`,
      realizedPnl,
      portfolioState: this.portfolio,
    };
  }

  partialClose(input: PartialCloseInput): {
    success: boolean;
    message: string;
    realizedPnl: number;
    portfolioState: PortfolioState;
  } {
    const position = this.portfolio.positions.get(input.stockSymbol);
    if (!position || position.status !== PositionStatus.OPEN) {
      return {
        success: false,
        message: `${input.stockSymbol} için açık pozisyon bulunamadı`,
        realizedPnl: 0,
        portfolioState: this.portfolio,
      };
    }

    if (input.quantity > position.quantity) {
      return {
        success: false,
        message: `İstenen miktar (${input.quantity}) pozisyondan (${position.quantity}) büyük`,
        realizedPnl: 0,
        portfolioState: this.portfolio,
      };
    }

    const order = this.tradeExecutor.executeSell(
      input.stockSymbol,
      position.stockName,
      input.quantity,
      input.exitPrice,
      position.entryEliteScore,
      position.entryConsensusScore,
      position.entryConfidence,
      'partial-close',
      input.notes || 'Kısmi kapatma',
      this.config,
    );

    const totalSellProceeds = (order.executionPrice || order.price) * order.quantity - order.transactionCost;
    const realizedPnl = totalSellProceeds - (position.avgCost * input.quantity);

    this.portfolio.cashBalance += totalSellProceeds;
    this.portfolio.orders.push(order);
    this.portfolio.updatedAt = new Date().toISOString();

    const { closed, remaining } = this.positionManager.partialClose(
      position, input.quantity, input.exitPrice, new Date().toISOString(), input.notes,
    );
    this.portfolio.positions.set(`${input.stockSymbol}_closed`, closed);
    this.portfolio.positions.set(input.stockSymbol, remaining);

    this.updatePeakValue();

    return {
      success: true,
      message: `${input.stockSymbol} kısmen kapatıldı: ${input.quantity} lot. K/Z: ${realizedPnl.toFixed(2)} TL`,
      realizedPnl,
      portfolioState: this.portfolio,
    };
  }

  getSummary(): PortfolioSummary {
    const totalValue = this.portfolio.cashBalance + this.getInvestedValue();
    const totalReturn = totalValue - this.portfolio.initialCapital;
    const totalReturnPercent = (totalReturn / this.portfolio.initialCapital) * 100;

    let openCount = 0;
    let closedCount = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
    this.portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN) {
        openCount++;
        totalUnrealizedPnl += p.unrealizedPnl;
      } else if (p.status === PositionStatus.CLOSED) {
        closedCount++;
        totalRealizedPnl += p.realizedPnl;
      }
    });

    return {
      id: this.portfolio.id,
      name: this.portfolio.name,
      type: this.portfolio.type,
      totalValue,
      cashBalance: this.portfolio.cashBalance,
      investedValue: this.getInvestedValue(),
      totalReturn,
      totalReturnPercent,
      openPositionsCount: openCount,
      closedPositionsCount: closedCount,
      unrealizedPnl: totalUnrealizedPnl,
      realizedPnl: totalRealizedPnl,
      lastUpdated: this.portfolio.updatedAt,
    };
  }

  getPerformanceReport(): PerformanceReport {
    return this.performanceTracker.calculatePerformance(this.portfolio);
  }

  getRiskAssessment(): RiskAssessment {
    return this.riskManager.evaluatePortfolioRisk(this.portfolio, this.config);
  }

  getFullReport(): string {
    const performance = this.performanceTracker.calculatePerformance(this.portfolio);
    const risk = this.riskManager.evaluatePortfolioRisk(this.portfolio, this.config);
    return this.reportGenerator.generateSummaryReport(this.portfolio, performance, risk);
  }

  getPositionReport(): string {
    return this.reportGenerator.generatePositionReport(this.portfolio);
  }

  getRiskReport(): string {
    const risk = this.riskManager.evaluatePortfolioRisk(this.portfolio, this.config);
    return this.reportGenerator.generateRiskReport(risk);
  }

  getPortfolio(): PortfolioState {
    return this.portfolio;
  }

  updatePrices(priceMap: Record<string, number>): void {
    const entries = Array.from(this.portfolio.positions.entries());
    for (const [symbol, position] of entries) {
      if (position.status === PositionStatus.OPEN && priceMap[symbol]) {
        const updated = this.positionManager.updateCurrentPrice(position, priceMap[symbol]);
        this.portfolio.positions.set(symbol, updated);
      }
    }
    this.portfolio.updatedAt = new Date().toISOString();
  }

  private createDefaultPortfolio(): PortfolioState {
    return {
      id: `paper-${Date.now()}`,
      name: 'Kağıt Portföy',
      type: 'DEFAULT' as any,
      initialCapital: 1000000,
      cashBalance: 1000000,
      positions: new Map(),
      orders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      peakValue: 1000000,
    };
  }

  private getInvestedValue(): number {
    let invested = 0;
    this.portfolio.positions.forEach(p => {
      if (p.status === PositionStatus.OPEN) {
        invested += p.quantity * p.currentPrice;
      }
    });
    return invested;
  }

  private updatePeakValue(): void {
    const totalValue = this.portfolio.cashBalance + this.getInvestedValue();
    if (totalValue > this.portfolio.peakValue) {
      this.portfolio.peakValue = totalValue;
    }
  }
}
