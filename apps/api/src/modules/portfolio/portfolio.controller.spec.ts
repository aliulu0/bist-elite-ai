import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioController } from './portfolio.controller';
import { PortfolioEngine } from './engine/portfolio-engine.service';
import { NotFoundException } from '@nestjs/common';
import { Portfolio } from './types/portfolio.types';

function makePortfolio(overrides?: Partial<Portfolio>): Portfolio {
  const now = new Date().toISOString();
  return {
    id: 'pf-1',
    name: 'Main',
    type: 'MAIN',
    displayName: 'Main',
    description: '',
    currency: 'TRY',
    cash: 10000,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
    metadata: { totalInvested: 50000, totalWithdrawn: 0, inceptionDate: now },
    ...overrides,
  };
}

const mockEngine = {
  getPortfolios: jest.fn(),
  getPortfolio: jest.fn(),
  getSummary: jest.fn(),
  getPositions: jest.fn(),
  getTransactionHistory: jest.fn(),
  getRisk: jest.fn(),
  getAllocation: jest.fn(),
  getPerformance: jest.fn(),
  getFullReport: jest.fn(),
  createPortfolio: jest.fn(),
  executeTransaction: jest.fn(),
  getObservabilityMetrics: jest.fn(),
};

describe('PortfolioController', () => {
  let controller: PortfolioController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [{ provide: PortfolioEngine, useValue: mockEngine }],
    }).compile();
    controller = module.get<PortfolioController>(PortfolioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /portfolio', () => {
    it('should list portfolios in envelope', () => {
      mockEngine.getPortfolios.mockReturnValue([makePortfolio()]);
      const result = controller.listPortfolios();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.timestamp).toBeDefined();
    });

    it('should return empty list when none', () => {
      mockEngine.getPortfolios.mockReturnValue([]);
      const result = controller.listPortfolios();
      expect(result.data).toEqual([]);
    });
  });

  describe('GET /portfolio/metrics', () => {
    it('should return observability metrics', () => {
      mockEngine.getObservabilityMetrics.mockReturnValue({ totalPortfolios: 1, timestamp: 'x' });
      const result = controller.getMetrics();
      expect(result.success).toBe(true);
      expect(result.data.totalPortfolios).toBe(1);
    });
  });

  describe('GET /portfolio/:id', () => {
    it('should return a portfolio', () => {
      mockEngine.getPortfolio.mockReturnValue(makePortfolio());
      const result = controller.getPortfolio('pf-1');
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('pf-1');
    });

    it('should throw when not found', () => {
      mockEngine.getPortfolio.mockReturnValue(undefined);
      expect(() => controller.getPortfolio('nope')).toThrow(NotFoundException);
    });
  });

  describe('GET /portfolio/:id/summary', () => {
    it('should return summary', () => {
      mockEngine.getSummary.mockReturnValue({ portfolioId: 'pf-1', portfolioName: 'Main' });
      const result = controller.getSummary('pf-1');
      expect(result.success).toBe(true);
      expect(result.data.portfolioName).toBe('Main');
    });

    it('should throw when portfolio missing', () => {
      mockEngine.getSummary.mockReturnValue(undefined);
      expect(() => controller.getSummary('nope')).toThrow(NotFoundException);
    });
  });

  describe('GET /portfolio/:id/positions', () => {
    it('should return positions', () => {
      mockEngine.getPositions.mockReturnValue([{ symbol: 'THYAO', quantity: 10 }]);
      const result = controller.getPositions('pf-1');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /portfolio/:id/transactions', () => {
    it('should return transactions', () => {
      mockEngine.getTransactionHistory.mockReturnValue([{ symbol: 'THYAO', type: 'BUY' }]);
      const result = controller.getTransactions('pf-1');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /portfolio/:id/risk', () => {
    it('should return risk', () => {
      mockEngine.getRisk.mockReturnValue({ portfolioId: 'pf-1', portfolioRisk: 30 });
      const result = controller.getRisk('pf-1');
      expect(result.success).toBe(true);
      expect(result.data.portfolioRisk).toBe(30);
    });

    it('should throw when portfolio missing', () => {
      mockEngine.getRisk.mockReturnValue(undefined);
      expect(() => controller.getRisk('nope')).toThrow(NotFoundException);
    });
  });

  describe('GET /portfolio/:id/allocation', () => {
    it('should return allocation', () => {
      mockEngine.getAllocation.mockReturnValue([{ type: 'SECTOR', entries: [], timestamp: 'x' }]);
      const result = controller.getAllocation('pf-1');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /portfolio/:id/performance', () => {
    it('should return performance with default period', () => {
      mockEngine.getPerformance.mockReturnValue({ portfolioId: 'pf-1', percentReturn: 5 });
      const result = controller.getPerformance('pf-1', {});
      expect(result.success).toBe(true);
      expect(mockEngine.getPerformance).toHaveBeenCalledWith('pf-1', 'MONTHLY');
    });

    it('should use provided period', () => {
      mockEngine.getPerformance.mockReturnValue({ portfolioId: 'pf-1', percentReturn: 5 });
      controller.getPerformance('pf-1', { period: 'YEARLY' });
      expect(mockEngine.getPerformance).toHaveBeenCalledWith('pf-1', 'YEARLY');
    });

    it('should throw when portfolio missing', () => {
      mockEngine.getPerformance.mockReturnValue(undefined);
      expect(() => controller.getPerformance('nope', {})).toThrow(NotFoundException);
    });
  });

  describe('GET /portfolio/:id/report', () => {
    it('should return full report', () => {
      mockEngine.getFullReport.mockReturnValue({ portfolioId: 'pf-1' });
      const result = controller.getReport('pf-1');
      expect(result.success).toBe(true);
    });

    it('should throw when portfolio missing', () => {
      mockEngine.getFullReport.mockReturnValue(undefined);
      expect(() => controller.getReport('nope')).toThrow(NotFoundException);
    });
  });

  describe('POST /portfolio', () => {
    it('should create a portfolio', () => {
      mockEngine.createPortfolio.mockReturnValue(makePortfolio({ name: 'New' }));
      const result = controller.createPortfolio({ name: 'New' });
      expect(result.success).toBe(true);
      expect(mockEngine.createPortfolio).toHaveBeenCalledWith({ name: 'New' });
    });
  });

  describe('POST /portfolio/:id/transactions', () => {
    it('should execute a transaction', () => {
      mockEngine.executeTransaction.mockReturnValue({
        transaction: { id: 'tx-1', symbol: 'THYAO', type: 'BUY', quantity: 10, price: 300, total: 3000 },
        position: null,
        closed: false,
        realizedPnL: 0,
      });
      const result = controller.executeTransaction('pf-1', { symbol: 'THYAO', type: 'BUY', quantity: 10, price: 300 });
      expect(result.success).toBe(true);
      expect(mockEngine.executeTransaction).toHaveBeenCalled();
    });
  });
});
