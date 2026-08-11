import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerEngine } from '../scheduler.engine';
import { SchedulerModule } from '../scheduler.module';
import { EventBusModule } from '../../event-bus/event-bus.module';
import { PerformanceMonitorModule } from '../../performance-monitor/performance-monitor.module';
import { PipelineOrchestratorModule } from '../../pipeline-orchestrator/pipeline-orchestrator.module';
import { MacroModule } from '../../macro/macro.module';
import { SymbolRegistryModule } from '../../market-data/symbol-registry/symbol-registry.module';
import { PrismaModule } from '../../../common/database/prisma.module';
import { PrismaService } from '../../../common/database/prisma.service';
import { JobName } from '../scheduler.types';
import { DEFAULT_JOB_CONFIGS } from '../scheduler.config';
import { IJob, JobResult } from '../jobs/job.interface';

function makeJob(): IJob {
  return {
    execute: jest.fn().mockResolvedValue({ success: true, message: 'OK', metadata: {} } as JobResult),
  };
}

describe('Scheduler Integration', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EventBusModule,
        PerformanceMonitorModule,
        MacroModule,
        PipelineOrchestratorModule,
        SchedulerModule,
        SymbolRegistryModule,
        PrismaModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({ isDbConnected: jest.fn().mockReturnValue(true) } as any)
      .compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should compile the scheduler module', () => {
    const engine = module.get(SchedulerEngine);
    expect(engine).toBeDefined();
  });

  it('should have fullPipelineRun job enabled in config', () => {
    const jobConfig = DEFAULT_JOB_CONFIGS['fullPipelineRun'];
    expect(jobConfig).toBeDefined();
    expect(jobConfig.enabled).toBe(true);
    expect(jobConfig.intervalMs).toBeGreaterThan(0);
  });

  it('should have valid interval for all jobs', () => {
    const jobs = DEFAULT_JOB_CONFIGS;
    for (const [name, config] of Object.entries(jobs)) {
      expect(typeof config.intervalMs).toBe('number');
      expect(config.intervalMs).toBeGreaterThan(0);
      expect(typeof config.enabled).toBe('boolean');
    }
  });

  it('should register jobs without error', () => {
    const engine = module.get(SchedulerEngine);
    const job = makeJob();
    expect(() => engine.registerJob('fullPipelineRun', job)).not.toThrow();
  });

  it('should get job state after registration', () => {
    const engine = module.get(SchedulerEngine);
    const job = makeJob();
    engine.registerJob('fullPipelineRun', job);
    const state = engine.getJobState('fullPipelineRun');
    expect(state).toBeDefined();
    expect(state!.jobName).toBe('fullPipelineRun');
    expect(state!.status).toBe('idle');
  });

  it('should handle enabling and disabling jobs', () => {
    const engine = module.get(SchedulerEngine);
    engine.registerJob('marketOpenScan', makeJob());
    engine.enableJob('marketOpenScan');
    const enabled = engine.getJobState('marketOpenScan');
    expect(enabled!.enabled).toBe(true);

    engine.disableJob('marketOpenScan');
    const disabled = engine.getJobState('marketOpenScan');
    expect(disabled!.enabled).toBe(false);
  });

  it('should return status with all jobs', () => {
    const engine = module.get(SchedulerEngine);
    const allJobNames = Object.keys(DEFAULT_JOB_CONFIGS) as JobName[];
    for (const name of allJobNames) {
      engine.registerJob(name, makeJob());
    }
    const status = engine.getStatus();
    expect(status.jobs.length).toBe(allJobNames.length);
    expect(status.running).toBe(false);
    expect(status.totalExecutions).toBe(0);
  });

  it('should return result summary', () => {
    const engine = module.get(SchedulerEngine);
    const result = engine.getResult();
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('metadata');
    expect(result.status).toHaveProperty('jobs');
  });

  it('should start and stop without throwing', () => {
    const engine = module.get(SchedulerEngine);
    expect(() => engine.start()).not.toThrow();
    expect(() => engine.stop()).not.toThrow();
  });

  it('should have getJobHistory returning array', () => {
    const engine = module.get(SchedulerEngine);
    const history = engine.getJobHistory('fullPipelineRun');
    expect(Array.isArray(history)).toBe(true);
  });
});
