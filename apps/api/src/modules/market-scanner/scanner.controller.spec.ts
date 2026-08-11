import { Test, TestingModule } from '@nestjs/testing';
import { ScannerController } from './scanner.controller';
import { ScannerService } from './scanner.service';
import { NotFoundException } from '@nestjs/common';
import { MarketScannerResult, RankedSymbol } from './market-scanner.types';

function makeRankedSymbol(overrides?: Partial<RankedSymbol>): RankedSymbol {
  return {
    symbol: 'THYAO',
    status: 'TOP_CANDIDATE',
    eliteScore: 80,
    eliteRating: 'AA',
    opportunityLevel: 'HIGH',
    candidateScore: 70,
    compositeScore: 78.5,
    rank: 1,
    reasons: ['Strong fundamentals'],
    ...overrides,
  };
}

function makeScanResult(): MarketScannerResult {
  return {
    topCandidates: [makeRankedSymbol({ symbol: 'THYAO', rank: 1 }), makeRankedSymbol({ symbol: 'GARAN', rank: 2, compositeScore: 72 })],
    watchlist: [makeRankedSymbol({ symbol: 'ASELS', status: 'WATCHLIST', rank: 3, compositeScore: 65 })],
    rejected: [makeRankedSymbol({ symbol: 'EREGL', status: 'REJECTED', rank: 4, compositeScore: 45 })],
    statistics: {
      totalSymbols: 4,
      topCandidateCount: 2,
      watchlistCount: 1,
      rejectedCount: 1,
      avgEliteScore: 75,
      avgOpportunityScore: 60,
      avgCandidateScore: 65,
      scoreDistribution: { AAA: 1, AA: 1, A: 1, BBB: 1, BB: 0, B: 0, C: 0, D: 0 },
    },
    metadata: { scannedAt: '2025-01-15T12:00:00.000Z', totalProcessed: 4 },
  };
}

const mockService = {
  getResult: jest.fn().mockReturnValue(makeScanResult()),
  getTopCandidates: jest.fn().mockReturnValue({ items: [makeRankedSymbol()], total: 2, offset: 0, limit: 10 }),
  getWatchlist: jest.fn().mockReturnValue({ items: [makeRankedSymbol({ status: 'WATCHLIST' })], total: 1, offset: 0, limit: 20 }),
  getRejected: jest.fn().mockReturnValue({ items: [makeRankedSymbol({ status: 'REJECTED' })], total: 1, offset: 0, limit: 50 }),
  getStatistics: jest.fn().mockReturnValue(makeScanResult().statistics),
  runScan: jest.fn().mockReturnValue(makeScanResult()),
};

describe('ScannerController', () => {
  let controller: ScannerController;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockService.getResult.mockReturnValue(makeScanResult());
    mockService.getTopCandidates.mockReturnValue({ items: [makeRankedSymbol()], total: 2, offset: 0, limit: 10 });
    mockService.getWatchlist.mockReturnValue({ items: [makeRankedSymbol({ status: 'WATCHLIST' })], total: 1, offset: 0, limit: 20 });
    mockService.getRejected.mockReturnValue({ items: [makeRankedSymbol({ status: 'REJECTED' })], total: 1, offset: 0, limit: 50 });
    mockService.getStatistics.mockReturnValue(makeScanResult().statistics);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScannerController],
      providers: [{ provide: ScannerService, useValue: mockService }],
    }).compile();

    controller = module.get<ScannerController>(ScannerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /scanner', () => {
    it('should return full scan results', () => {
      const result = controller.getFullScan();
      expect(result.success).toBe(true);
      expect(result.topCandidates).toBeDefined();
      expect(result.watchlist).toBeDefined();
      expect(result.rejected).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should throw when no scan data', () => {
      mockService.getResult.mockReturnValue(null);
      expect(() => controller.getFullScan()).toThrow(NotFoundException);
    });
  });

  describe('GET /scanner/top', () => {
    it('should return top candidates', () => {
      const result = controller.getTop({});
      expect(result.items).toBeDefined();
      expect(result.total).toBeDefined();
    });

    it('should pass query params to service', () => {
      controller.getTop({ offset: 5, limit: 3, sortBy: 'eliteScore', sortDir: 'asc' });
      expect(mockService.getTopCandidates).toHaveBeenCalledWith(5, 3, 'eliteScore', 'asc');
    });

    it('should use defaults', () => {
      controller.getTop({});
      expect(mockService.getTopCandidates).toHaveBeenCalledWith(0, 10, 'compositeScore', 'desc');
    });

    it('should throw when no scan data', () => {
      mockService.getResult.mockReturnValue(null);
      expect(() => controller.getTop({})).toThrow(NotFoundException);
    });
  });

  describe('GET /scanner/watchlist', () => {
    it('should return watchlist', () => {
      const result = controller.getWatchlist({});
      expect(result.items).toBeDefined();
    });

    it('should pass query params', () => {
      controller.getWatchlist({ offset: 2, limit: 5 });
      expect(mockService.getWatchlist).toHaveBeenCalledWith(2, 5, 'compositeScore', 'desc');
    });

    it('should throw when no scan data', () => {
      mockService.getResult.mockReturnValue(null);
      expect(() => controller.getWatchlist({})).toThrow(NotFoundException);
    });
  });

  describe('GET /scanner/rejected', () => {
    it('should return rejected', () => {
      const result = controller.getRejected({});
      expect(result.items).toBeDefined();
    });

    it('should throw when no scan data', () => {
      mockService.getResult.mockReturnValue(null);
      expect(() => controller.getRejected({})).toThrow(NotFoundException);
    });
  });

  describe('GET /scanner/statistics', () => {
    it('should return statistics', () => {
      const result = controller.getStatistics();
      expect(result.totalSymbols).toBe(4);
    });

    it('should throw when no scan data', () => {
      mockService.getStatistics.mockReturnValue(null);
      expect(() => controller.getStatistics()).toThrow(NotFoundException);
    });
  });
});
