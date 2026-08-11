import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioIntelligenceController } from '../portfolio-intelligence.controller';
import { PortfolioIntelligenceService } from '../portfolio-intelligence.service';

const mockService = {
  getAnalysis: jest.fn(),
  listPositions: jest.fn(),
  getOpportunities: jest.fn(),
  getRisk: jest.fn(),
  getRebalance: jest.fn(),
  getScenarios: jest.fn(),
  getHistory: jest.fn(),
  getLearning: jest.fn(),
  addPosition: jest.fn(),
  updatePosition: jest.fn(),
  removePosition: jest.fn(),
  refresh: jest.fn(),
};

describe('PortfolioIntelligenceController', () => {
  let controller: PortfolioIntelligenceController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioIntelligenceController],
      providers: [{ provide: PortfolioIntelligenceService, useValue: mockService }],
    }).compile();
    controller = module.get<PortfolioIntelligenceController>(PortfolioIntelligenceController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /portfolio/analysis returns analysis', async () => {
    mockService.getAnalysis.mockResolvedValue({ score: 80 });
    const result = await controller.getAnalysis();
    expect(result.success).toBe(true);
    expect(result.data.score).toBe(80);
    expect(mockService.getAnalysis).toHaveBeenCalledWith(true);
  });

  it('GET /portfolio/positions returns positions', async () => {
    mockService.listPositions.mockReturnValue([{ ticker: 'THYAO' }]);
    const result = await controller.getPositions();
    expect(result.data).toHaveLength(1);
  });

  it('GET /portfolio/opportunities returns opportunities', async () => {
    mockService.getOpportunities.mockResolvedValue({ newOpportunities: [] });
    const result = await controller.getOpportunities();
    expect(result.success).toBe(true);
  });

  it('GET /portfolio/risk returns risk', async () => {
    mockService.getRisk.mockResolvedValue({ portfolioRiskScore: 20 });
    const result = await controller.getRisk();
    expect(result.data.portfolioRiskScore).toBe(20);
  });

  it('GET /portfolio/rebalance returns rebalance', async () => {
    mockService.getRebalance.mockResolvedValue([]);
    const result = await controller.getRebalance();
    expect(result.success).toBe(true);
  });

  it('GET /portfolio/scenarios returns scenarios', async () => {
    mockService.getScenarios.mockResolvedValue({ bull: {}, base: {}, bear: {} });
    const result = await controller.getScenarios();
    expect(result.data.bull).toBeDefined();
  });

  it('GET /portfolio/history returns history', async () => {
    mockService.getHistory.mockResolvedValue([]);
    const result = await controller.getHistory();
    expect(result.data).toEqual([]);
  });

  it('GET /portfolio/learning returns learning', async () => {
    mockService.getLearning.mockResolvedValue({ snapshotCount: 0 });
    const result = await controller.getLearning();
    expect(result.data.snapshotCount).toBe(0);
  });

  it('POST /portfolio/position adds a position', async () => {
    mockService.addPosition.mockReturnValue({ ticker: 'THYAO' });
    const dto = { ticker: 'THYAO', quantity: 100, averageCost: 100 };
    const result = await controller.addPosition(dto);
    expect(mockService.addPosition).toHaveBeenCalledWith(dto);
    expect(result.success).toBe(true);
  });

  it('PUT /portfolio/position/:ticker updates a position', async () => {
    mockService.updatePosition.mockReturnValue({ ticker: 'THYAO', quantity: 200 });
    const result = await controller.updatePosition('THYAO', { quantity: 200 });
    expect(mockService.updatePosition).toHaveBeenCalledWith('THYAO', { quantity: 200 });
    expect(result.data.quantity).toBe(200);
  });

  it('DELETE /portfolio/position/:ticker removes a position', async () => {
    mockService.removePosition.mockReturnValue({ removed: true, ticker: 'THYAO' });
    const result = await controller.removePosition('THYAO');
    expect(mockService.removePosition).toHaveBeenCalledWith('THYAO');
    expect(result.data.removed).toBe(true);
  });

  it('POST /portfolio/refresh refreshes analysis', async () => {
    mockService.refresh.mockResolvedValue({ score: 90 });
    const result = await controller.refresh();
    expect(result.data.score).toBe(90);
  });

  it('POST /portfolio/analyze returns fresh analysis', async () => {
    mockService.refresh.mockResolvedValue({ score: 85 });
    const result = await controller.analyze();
    expect(result.data.score).toBe(85);
  });
});
