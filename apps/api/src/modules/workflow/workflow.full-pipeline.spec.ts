import { WorkflowService } from './workflow.service';
import { WorkflowEngine } from './workflow.engine';
import { FULL_PIPELINE_STEPS, DEFAULT_WORKFLOW_CONFIG } from './workflow.config';
import type { WorkflowType, WorkflowTypeConfig } from './workflow.types';

const PIPELINE_STEPS = FULL_PIPELINE_STEPS.steps;

function makePipelineConfig() {
  const allTypes: Record<WorkflowType, WorkflowTypeConfig> = {
    ...DEFAULT_WORKFLOW_CONFIG.types,
    full_pipeline: {
      steps: PIPELINE_STEPS.map((s) => ({
        ...s,
        retryAttempts: 0,
        retryDelayMs: 0,
      })),
      timeoutMs: 600000,
      retryPolicy: { maxRetriesPerStep: 0, retryDelayMs: 0, backoffMultiplier: 1 },
    },
  };
  return {
    types: allTypes,
    maxConcurrentWorkflows: 5,
    maxHistorySize: 200,
    enableEvents: false,
    enablePerformanceTracking: false,
  };
}

const noopHandler = () => ({ ok: true });

describe('Workflow full_pipeline', () => {
  let engine: WorkflowEngine;
  let service: WorkflowService;

  beforeEach(() => {
    engine = new WorkflowEngine(makePipelineConfig());
    service = new WorkflowService(engine);
  });

  afterEach(() => {
    engine.clearAll();
  });

  it('should have all 10 steps defined in FULL_PIPELINE_STEPS', () => {
    expect(PIPELINE_STEPS).toHaveLength(10);
    const stepNames = PIPELINE_STEPS.map((s) => s.name);
    expect(stepNames).toEqual([
      'fetch_market_data',
      'normalize',
      'aggregate',
      'ai_analysis',
      'opportunity_detection',
      'scanner',
      'ranking',
      'alerts',
      'portfolio_refresh',
      'macro_refresh',
    ]);
  });

  it('should have increasing order numbers', () => {
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      expect(PIPELINE_STEPS[i].order).toBe(i + 1);
    }
  });

  it('should include macro_refresh as the last step', () => {
    const lastStep = PIPELINE_STEPS[PIPELINE_STEPS.length - 1];
    expect(lastStep.name).toBe('macro_refresh');
  });

  it('should have alerts, portfolio_refresh, and macro_refresh as optional', () => {
    const alertsStep = PIPELINE_STEPS.find((s) => s.name === 'alerts');
    const portfolioRefreshStep = PIPELINE_STEPS.find((s) => s.name === 'portfolio_refresh');
    const macroRefreshStep = PIPELINE_STEPS.find((s) => s.name === 'macro_refresh');
    expect(alertsStep?.optional).toBe(true);
    expect(portfolioRefreshStep?.optional).toBe(true);
    expect(macroRefreshStep?.optional).toBe(true);
  });

  it('should create a full_pipeline workflow', () => {
    const wf = service.createWorkflow('full_pipeline');
    expect(wf.id).toBeDefined();
    expect(wf.type).toBe('full_pipeline');
    expect(wf.status).toBe('pending');
    expect(wf.steps).toHaveLength(10);
  });

  it('should execute all steps via the service', async () => {
    for (const step of PIPELINE_STEPS) {
      engine.registerHandler('full_pipeline', step.name, noopHandler);
    }
    const wf = service.createWorkflow('full_pipeline');
    const result = await service.startWorkflow(wf.id);
    expect(result.status).toBe('completed');
  });

  it('should skip optional steps when no handler registered', async () => {
    for (const step of PIPELINE_STEPS) {
      if (!step.optional) {
        engine.registerHandler('full_pipeline', step.name, noopHandler);
      }
    }
    const wf = service.createWorkflow('full_pipeline');
    const result = await service.startWorkflow(wf.id);
    expect(result.status).toBe('completed');
  });
});
