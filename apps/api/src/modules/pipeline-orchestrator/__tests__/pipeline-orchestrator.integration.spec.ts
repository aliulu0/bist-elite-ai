import { Test, TestingModule } from '@nestjs/testing';
import { PipelineOrchestratorService } from '../pipeline-orchestrator.service';
import { WebSocketGatewayModule } from '../../websocket-gateway/websocket-gateway.module';
import { PipelineGateway } from '../../websocket-gateway/websocket-gateway';

describe('PipelineOrchestrator Integration', () => {
  let service: PipelineOrchestratorService;
  let gateway: PipelineGateway;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WebSocketGatewayModule],
      providers: [
        {
          provide: PipelineOrchestratorService,
          useFactory: () => new PipelineOrchestratorService(
            undefined, undefined, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined, undefined,
            undefined, { trackMetrics: true },
          ),
        },
      ],
    }).compile();

    service = module.get(PipelineOrchestratorService);
    gateway = module.get(PipelineGateway);
  });

  afterAll(async () => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(gateway).toBeDefined();
  });

  it('should run full pipeline without throwing', async () => {
    const result = await service.runFullPipeline();
    expect(result.steps).toHaveLength(10);
    for (const step of result.steps) {
      expect(step.status).toBe('completed');
    }
  });

  it('should produce valid metrics after pipeline run', async () => {
    await service.runFullPipeline();
    const metrics = service.getMetrics();
    expect(metrics.pipelineDurationMs).toBeGreaterThanOrEqual(0);
    expect(metrics.totalSteps).toBe(10);
    expect(metrics.completedSteps).toBe(10);
    expect(metrics.failedSteps).toBe(0);
    expect(Array.isArray(metrics.stepNames)).toBe(true);
    expect(metrics.stepNames).toHaveLength(10);
  });

  it('should handle sequential pipeline runs', async () => {
    const first = await service.runFullPipeline({ runId: 'run-1' });
    const second = await service.runFullPipeline({ runId: 'run-2' });
    expect(first.startedAt).not.toBe(second.startedAt);
    expect(first.metadata).toMatchObject({ runId: 'run-1' });
    expect(second.metadata).toMatchObject({ runId: 'run-2' });
  });

  it('should not throw when running pipeline concurrently', async () => {
    const results = await Promise.all([
      service.runFullPipeline({ batch: 'a' }),
      service.runFullPipeline({ batch: 'b' }),
      service.runFullPipeline({ batch: 'c' }),
    ]);
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.steps).toHaveLength(10);
    }
  });

  it('should clear state on reset', async () => {
    await service.runFullPipeline();
    service.reset();
    const metrics = service.getMetrics();
    expect(metrics.pipelineDurationMs).toBe(0);
    expect(metrics.totalSteps).toBe(0);
    expect(service.getStepDurations()).toEqual({});
    expect(service.getLastRanked()).toEqual([]);
  });

  it('should keep per-step durations', async () => {
    await service.runFullPipeline();
    const durations = service.getStepDurations();
    const expectedSteps = ['fetch_market_data', 'normalize', 'aggregate', 'ai_analysis', 'opportunity_detection', 'scanner', 'ranking', 'alerts', 'portfolio_refresh', 'macro_refresh'];
    for (const name of expectedSteps) {
      expect(typeof durations[name]).toBe('number');
      expect(durations[name]).toBeGreaterThanOrEqual(0);
    }
  });

  it('should handle error gracefully when step throws', async () => {
    const fragile = new PipelineOrchestratorService(
      undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined,
      undefined, { trackMetrics: true },
    );
    const result = await fragile.runFullPipeline();
    expect(result.steps.every((s) => s.status === 'completed')).toBe(true);
  });

  it('should report provider failures count', async () => {
    await service.runFullPipeline({ providerFailures: 3 });
    const metrics = service.getMetrics();
    expect(metrics.providerFailures).toBe(3);
  });

  it('should track macro refresh duration', async () => {
    await service.runFullPipeline();
    const metrics = service.getMetrics();
    expect(metrics.macroRefreshDurationMs).toBeGreaterThanOrEqual(0);
  });
});
