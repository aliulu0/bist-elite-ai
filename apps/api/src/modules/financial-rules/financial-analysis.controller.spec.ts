import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FinancialAnalysisController } from './financial-analysis.controller';
import { FinancialAnalysisService } from './financial-analysis.service';
import { FinancialAnalysisInputDto } from './dto';
import { FinancialData } from './rule.types';

const mockAnalysisResult = {
  symbol: 'THYAO',
  score: 85.0,
  grade: 'A',
  confidence: 0.83,
  rules: [
    { id: 'price_to_book', name: 'Price/Book', status: 'PASS', value: 1.2, reason: 'Good' },
    { id: 'ev_to_ebitda', name: 'EV/EBITDA', status: 'PASS', value: 8.0, reason: 'Good' },
    { id: 'net_profit_growth', name: 'Net Profit Growth', status: 'PASS', value: 28, reason: 'Good' },
    { id: 'equity_growth', name: 'Equity Growth', status: 'PASS', value: 12.5, reason: 'Good' },
    { id: 'debt_ratio', name: 'Debt Ratio', status: 'WARNING', value: 0.55, reason: 'Moderate' },
    { id: 'sector_comparison', name: 'Sector Comparison', status: 'PASS', value: null, reason: 'Good' },
  ],
  strengths: ['Attractive valuation', 'Strong net profit growth'],
  weaknesses: ['Debt ratio is moderate'],
  risks: [],
  summary: 'THYAO scored 85/100 (Grade: A). 5 rules passed, 1 warning, 0 failed.',
  overallOpinion: 'Financial structure is healthy.',
};

const mockService = {
  analyze: jest.fn().mockReturnValue(mockAnalysisResult),
};

describe('FinancialAnalysisController', () => {
  let controller: FinancialAnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialAnalysisController],
      providers: [
        { provide: FinancialAnalysisService, useValue: mockService },
      ],
    }).compile();

    controller = module.get(FinancialAnalysisController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('analyze', () => {
    const validInput: FinancialAnalysisInputDto = {
      priceToBook: 1.2,
      enterpriseValueToEBITDA: 8.0,
      netProfit: 32000000000,
      netProfitPrevious: 25000000000,
      equity: 180000000000,
      equityPrevious: 160000000000,
      totalDebt: 95000000000,
      totalAssets: 275000000000,
      sector: 'Ulaştırma',
      sectorAverages: {
        priceToBook: 1.5,
        enterpriseValueToEBITDA: 10,
        debtRatio: 0.45,
      },
    };

    it('should return analysis for valid input', () => {
      const result = controller.analyze('THYAO', validInput);
      expect(result.symbol).toBe('THYAO');
      expect(result.score).toBe(85.0);
      expect(result.grade).toBe('A');
      expect(result.timestamp).toBeDefined();
    });

    it('should pass financial data to service', () => {
      controller.analyze('THYAO', validInput);
      expect(mockService.analyze).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'THYAO',
          priceToBook: 1.2,
          enterpriseValueToEBITDA: 8.0,
        }),
      );
    });

    it('should uppercase symbol', () => {
      controller.analyze('thyao', validInput);
      expect(mockService.analyze).toHaveBeenCalledWith(
        expect.objectContaining({ symbol: 'THYAO' }),
      );
    });

    it('should trim symbol', () => {
      controller.analyze('  THYAO  ', validInput);
      expect(mockService.analyze).toHaveBeenCalledWith(
        expect.objectContaining({ symbol: 'THYAO' }),
      );
    });

    it('should throw BadRequestException for empty symbol', () => {
      expect(() => controller.analyze('', validInput)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for whitespace symbol', () => {
      expect(() => controller.analyze('   ', validInput)).toThrow(BadRequestException);
    });

    it('should handle null financial values', () => {
      const inputWithNulls: FinancialAnalysisInputDto = {
        priceToBook: null,
        enterpriseValueToEBITDA: null,
        netProfit: null,
        netProfitPrevious: null,
        equity: null,
        equityPrevious: null,
        totalDebt: null,
        totalAssets: null,
      };
      controller.analyze('TEST', inputWithNulls);
      expect(mockService.analyze).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'TEST',
          priceToBook: null,
          enterpriseValueToEBITDA: null,
        }),
      );
    });

    it('should handle missing optional sector data', () => {
      const inputWithoutSector: FinancialAnalysisInputDto = {
        priceToBook: 1.0,
        enterpriseValueToEBITDA: 5.0,
        netProfit: 1000000000,
        netProfitPrevious: 800000000,
        equity: 5000000000,
        equityPrevious: 4500000000,
        totalDebt: 2000000000,
        totalAssets: 7000000000,
      };
      controller.analyze('TEST', inputWithoutSector);
      expect(mockService.analyze).toHaveBeenCalledWith(
        expect.objectContaining({ symbol: 'TEST' }),
      );
    });

    it('should map sectorAverages correctly', () => {
      controller.analyze('THYAO', validInput);
      expect(mockService.analyze).toHaveBeenCalledWith(
        expect.objectContaining({
          sectorAverages: {
            priceToBook: 1.5,
            enterpriseValueToEBITDA: 10,
            debtRatio: 0.45,
          },
        }),
      );
    });

    it('should handle null sectorAverages values', () => {
      const inputWithNullAverages: FinancialAnalysisInputDto = {
        ...validInput,
        sectorAverages: {
          priceToBook: null,
          enterpriseValueToEBITDA: null,
          debtRatio: null,
        },
      };
      controller.analyze('THYAO', inputWithNullAverages);
      expect(mockService.analyze).toHaveBeenCalledWith(
        expect.objectContaining({
          sectorAverages: {
            priceToBook: undefined,
            enterpriseValueToEBITDA: undefined,
            debtRatio: undefined,
          },
        }),
      );
    });

    it('should include timestamp in response', () => {
      const before = new Date().toISOString();
      const result = controller.analyze('THYAO', validInput);
      const after = new Date().toISOString();
      expect(result.timestamp >= before).toBe(true);
      expect(result.timestamp <= after).toBe(true);
    });

    it('should return full result from service', () => {
      const result = controller.analyze('THYAO', validInput);
      expect(result.strengths).toEqual(mockAnalysisResult.strengths);
      expect(result.weaknesses).toEqual(mockAnalysisResult.weaknesses);
      expect(result.risks).toEqual(mockAnalysisResult.risks);
      expect(result.summary).toBe(mockAnalysisResult.summary);
      expect(result.overallOpinion).toBe(mockAnalysisResult.overallOpinion);
    });
  });
});
