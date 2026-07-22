import { Test, TestingModule } from '@nestjs/testing';
import { PaperPortfolioModule } from './paper-portfolio.module';
import { PaperRiskManagerService } from './paper-risk-manager.service';
import { PaperPerformanceTrackerService } from './paper-performance-tracker.service';
import { PaperReportGeneratorService } from './paper-report-generator.service';
import { PaperTradeExecutorService } from './paper-trade-executor.service';
import { PositionManagerService } from './position-manager.service';
import { PaperPortfolioOrchestratorService } from './paper-portfolio-orchestrator.service';

describe('PaperPortfolioModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PaperPortfolioModule],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should provide PaperRiskManagerService', () => {
    const service = module.get(PaperRiskManagerService);
    expect(service).toBeDefined();
  });

  it('should provide PaperPerformanceTrackerService', () => {
    const service = module.get(PaperPerformanceTrackerService);
    expect(service).toBeDefined();
  });

  it('should provide PaperReportGeneratorService', () => {
    const service = module.get(PaperReportGeneratorService);
    expect(service).toBeDefined();
  });

  it('should provide PaperTradeExecutorService', () => {
    const service = module.get(PaperTradeExecutorService);
    expect(service).toBeDefined();
  });

  it('should provide PositionManagerService', () => {
    const service = module.get(PositionManagerService);
    expect(service).toBeDefined();
  });

  it('should provide PaperPortfolioOrchestratorService', () => {
    const service = module.get(PaperPortfolioOrchestratorService);
    expect(service).toBeDefined();
  });
});
