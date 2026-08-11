import { PipelineOrchestratorService } from './pipeline-orchestrator.service';

describe('PipelineOrchestratorService', () => {
  let service: PipelineOrchestratorService;

  beforeEach(() => {
    service = new PipelineOrchestratorService(
      undefined, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined,
      undefined, { trackMetrics: true },
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runFullPipeline', () => {
    it('should run all 10 pipeline steps', async () => {
      const result = await service.runFullPipeline();
      expect(result).toHaveProperty('startedAt');
      expect(result).toHaveProperty('steps');
      expect(result.steps.length).toBe(10);
    });

    it('should complete all steps with fallback status when no services injected', async () => {
      const result = await service.runFullPipeline();
      const steps = result.steps;
      expect(steps.length).toBe(10);
      for (const step of steps) {
        expect(step.status).toBe('completed');
        expect(step.metadata).toBeDefined();
      }
    });

    it('should record step names in order', async () => {
      const result = await service.runFullPipeline();
      const stepNames = result.steps.map((s) => s.name);
      expect(stepNames).toEqual([
        'fetch_market_data', 'normalize', 'aggregate', 'ai_analysis',
        'opportunity_detection', 'scanner', 'ranking',
        'alerts', 'portfolio_refresh', 'macro_refresh',
      ]);
    });

    it('should handle custom metadata', async () => {
      const meta = { source: 'test', customField: 'value' };
      const result = await service.runFullPipeline(meta);
      expect(result.metadata).toMatchObject(meta);
    });

    it('should track duration for each step', async () => {
      const result = await service.runFullPipeline();
      for (const step of result.steps) {
        expect(step.durationMs).toBeGreaterThanOrEqual(0);
        expect(typeof step.startedAt).toBe('string');
        expect(typeof step.completedAt).toBe('string');
      }
    });
  });

  describe('getMetrics', () => {
    it('should return metrics with default values', () => {
      const metrics = service.getMetrics();
      expect(metrics).toHaveProperty('pipelineDurationMs');
      expect(metrics).toHaveProperty('macroRefreshDurationMs');
      expect(metrics).toHaveProperty('providerFailures');
    });
  });

  describe('getStepDurations', () => {
    it('should return durations as an object', () => {
      const durations = service.getStepDurations();
      expect(typeof durations).toBe('object');
    });
  });

  describe('getLastRanked', () => {
    it('should return empty array initially', () => {
      expect(service.getLastRanked()).toEqual([]);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      service.runFullPipeline();
      service.reset();
      expect(service.getStepDurations()).toEqual({});
      expect(service.getLastRanked()).toEqual([]);
    });
  });
});
