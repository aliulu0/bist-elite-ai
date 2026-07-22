import { Test, TestingModule } from '@nestjs/testing';
import { MarketRegimeModule } from './market-regime.module';
import { RegimeDetectorService } from './regime-detector.service';
import { RegimeTransitionService } from './regime-transition.service';
import { RegimeHistoricalService } from './regime-historical.service';
import { RegimeContextService } from './regime-context.service';
import { RegimeReportGeneratorService } from './regime-report-generator.service';
import { MarketRegimeOrchestratorService } from './market-regime-orchestrator.service';

describe('MarketRegimeModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MarketRegimeModule],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide RegimeDetectorService', () => {
    const service = module.get(RegimeDetectorService);
    expect(service).toBeInstanceOf(RegimeDetectorService);
  });

  it('should provide RegimeTransitionService', () => {
    const service = module.get(RegimeTransitionService);
    expect(service).toBeInstanceOf(RegimeTransitionService);
  });

  it('should provide RegimeHistoricalService', () => {
    const service = module.get(RegimeHistoricalService);
    expect(service).toBeInstanceOf(RegimeHistoricalService);
  });

  it('should provide RegimeContextService', () => {
    const service = module.get(RegimeContextService);
    expect(service).toBeInstanceOf(RegimeContextService);
  });

  it('should provide MarketRegimeOrchestratorService', () => {
    const service = module.get(MarketRegimeOrchestratorService);
    expect(service).toBeInstanceOf(MarketRegimeOrchestratorService);
  });
});
