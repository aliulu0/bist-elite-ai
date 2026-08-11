import { WorkflowQueueService } from './workflow-queue.service';
import { WorkflowQueueEngine } from './workflow-queue.engine';
import { QueueJob } from './workflow-queue.types';

describe('WorkflowQueueService', () => {
  let service: WorkflowQueueService;
  let engine: WorkflowQueueEngine;

  function makeJob(overrides?: Partial<QueueJob>): QueueJob {
    return {
      id: 'jq-test-1',
      workflowId: 'wf-1',
      type: 'single_stock_analysis',
      priority: 'NORMAL',
      state: 'WAITING',
      payload: { symbol: 'THYAO' },
      attempt: 0,
      maxAttempts: 3,
      retryDelayMs: 1000,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      failedAt: null,
      error: null,
      metadata: {},
      ...overrides,
    };
  }

  beforeEach(() => {
    engine = new WorkflowQueueEngine({ workers: 2, maxQueueSize: 100, cleanupIntervalMs: 0 });
    service = new WorkflowQueueService(engine);
  });

  afterEach(() => {
    engine.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSnapshot', () => {
    it('should return snapshot with expected fields', () => {
      const snapshot = service.getSnapshot();
      expect(snapshot).toHaveProperty('statistics');
      expect(snapshot).toHaveProperty('waitingJobs');
      expect(snapshot).toHaveProperty('runningJobs');
      expect(snapshot).toHaveProperty('deadLetterJobs');
      expect(snapshot).toHaveProperty('workers');
      expect(snapshot).toHaveProperty('timestamp');
    });

    it('should include workers', () => {
      const snapshot = service.getSnapshot();
      expect(snapshot.workers.length).toBe(2);
    });

    it('should have valid timestamp', () => {
      const snapshot = service.getSnapshot();
      expect(new Date(snapshot.timestamp).toISOString()).toBe(snapshot.timestamp);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics with expected fields', () => {
      const stats = service.getStatistics();
      expect(stats).toHaveProperty('totalEnqueued');
      expect(stats).toHaveProperty('totalCompleted');
      expect(stats).toHaveProperty('totalFailed');
      expect(stats).toHaveProperty('totalCancelled');
      expect(stats).toHaveProperty('totalRetried');
      expect(stats).toHaveProperty('totalDeadLettered');
      expect(stats).toHaveProperty('waitingCount');
      expect(stats).toHaveProperty('runningCount');
      expect(stats).toHaveProperty('completedCount');
      expect(stats).toHaveProperty('failedCount');
      expect(stats).toHaveProperty('deadLetterCount');
      expect(stats).toHaveProperty('activeWorkers');
      expect(stats).toHaveProperty('totalWorkers');
      expect(stats).toHaveProperty('avgWaitTimeMs');
      expect(stats).toHaveProperty('avgExecutionTimeMs');
      expect(stats).toHaveProperty('uptimeMs');
    });

    it('should reflect enqueued jobs', () => {
      engine.enqueue('wf-1', 'type1', {});
      engine.enqueue('wf-2', 'type2', {});
      const stats = service.getStatistics();
      expect(stats.totalEnqueued).toBe(2);
      expect(stats.waitingCount).toBe(2);
    });
  });

  describe('getAllJobs', () => {
    it('should return empty when no jobs', () => {
      const result = service.getAllJobs();
      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should use default limit of 50', () => {
      for (let i = 0; i < 60; i++) engine.enqueue(`wf-${i}`, 'type', { i });
      const result = service.getAllJobs();
      expect(result.jobs.length).toBe(50);
      expect(result.total).toBe(60);
    });

    it('should return all jobs across states', () => {
      engine.enqueue('wf-1', 'type1', { a: 1 });
      engine.enqueue('wf-2', 'type2', { b: 2 });
      const result = service.getAllJobs();
      expect(result.jobs.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should paginate with limit', () => {
      for (let i = 0; i < 10; i++) engine.enqueue(`wf-${i}`, 'type', { i });
      const result = service.getAllJobs({ limit: 3 });
      expect(result.jobs.length).toBe(3);
      expect(result.total).toBe(10);
    });

    it('should paginate with offset', () => {
      for (let i = 0; i < 5; i++) engine.enqueue(`wf-${i}`, 'type', { i });
      const result = service.getAllJobs({ offset: 2 });
      expect(result.jobs.length).toBe(3);
      expect(result.total).toBe(5);
    });

    it('should paginate with limit and offset', () => {
      for (let i = 0; i < 10; i++) engine.enqueue(`wf-${i}`, 'type', { i });
      const result = service.getAllJobs({ limit: 2, offset: 3 });
      expect(result.jobs.length).toBe(2);
      expect(result.total).toBe(10);
    });

    it('should filter by state', () => {
      engine.enqueue('wf-1', 'type', {});
      engine.enqueue('wf-2', 'type', {});
      const result = service.getAllJobs({ state: 'WAITING' });
      expect(result.jobs.length).toBe(2);
      expect(result.jobs.every((j) => j.state === 'WAITING')).toBe(true);
    });

    it('should filter by priority', () => {
      engine.enqueue('wf-1', 'type', {}, { priority: 'HIGH' });
      engine.enqueue('wf-2', 'type', {}, { priority: 'LOW' });
      const result = service.getAllJobs({ priority: 'HIGH' });
      expect(result.jobs.length).toBe(1);
      expect(result.jobs[0].priority).toBe('HIGH');
    });

    it('should filter by state and priority combined', () => {
      engine.enqueue('wf-1', 'type', {}, { priority: 'HIGH' });
      engine.enqueue('wf-2', 'type', {}, { priority: 'LOW' });
      engine.enqueue('wf-3', 'type', {}, { priority: 'HIGH' });
      const result = service.getAllJobs({ state: 'WAITING', priority: 'HIGH' });
      expect(result.jobs.length).toBe(2);
    });

    it('should handle offset beyond total', () => {
      engine.enqueue('wf-1', 'type', {});
      const result = service.getAllJobs({ offset: 100 });
      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(1);
    });
  });

  describe('getJob', () => {
    it('should return undefined for unknown job', () => {
      expect(service.getJob('nonexistent')).toBeUndefined();
    });

    it('should return waiting job', () => {
      const job = engine.enqueue('wf-1', 'type', {});
      expect(service.getJob(job.id)).toBeDefined();
      expect(service.getJob(job.id)?.id).toBe(job.id);
    });
  });

  describe('start', () => {
    it('should start the queue', () => {
      service.start();
      expect(engine.isStarted()).toBe(true);
      expect(engine.isPaused()).toBe(false);
    });
  });

  describe('stop', () => {
    it('should stop the queue', () => {
      service.start();
      service.stop();
      expect(engine.isPaused()).toBe(true);
    });
  });

  describe('retryJob', () => {
    it('should return true for retriable job', () => {
      const job = engine.enqueue('wf-1', 'type', {});
      (engine as any).waiting.length = 0;
      (engine as any).failed.push({ ...job, state: 'FAILED', error: 'fail', attempt: 3 });
      expect(service.retryJob(job.id)).toBe(true);
    });

    it('should return true for dead-lettered job', () => {
      const job = engine.enqueue('wf-1', 'type', {});
      (engine as any).waiting.length = 0;
      (engine as any).deadLetter.push({ ...job, state: 'DEAD_LETTER', error: 'fail', attempt: 3 });
      expect(service.retryJob(job.id)).toBe(true);
    });

    it('should return false for non-retriable state', () => {
      const job = engine.enqueue('wf-1', 'type', {});
      expect(service.retryJob(job.id)).toBe(false);
    });
  });

  describe('cancelJob', () => {
    it('should cancel a waiting job', () => {
      const job = engine.enqueue('wf-1', 'type', {});
      expect(service.cancelJob(job.id)).toBe(true);
    });

    it('should return false for unknown job', () => {
      expect(service.cancelJob('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear the queue', () => {
      engine.enqueue('wf-1', 'type', {});
      engine.enqueue('wf-2', 'type', {});
      service.clear();
      expect(service.getAllJobs().jobs).toEqual([]);
    });
  });

  describe('isPriorityValid', () => {
    it('should validate all priorities', () => {
      expect(service.isPriorityValid('CRITICAL')).toBe(true);
      expect(service.isPriorityValid('VERY_HIGH')).toBe(true);
      expect(service.isPriorityValid('HIGH')).toBe(true);
      expect(service.isPriorityValid('NORMAL')).toBe(true);
      expect(service.isPriorityValid('LOW')).toBe(true);
    });

    it('should reject invalid priorities', () => {
      expect(service.isPriorityValid('invalid')).toBe(false);
      expect(service.isPriorityValid('')).toBe(false);
      expect(service.isPriorityValid('critical')).toBe(false);
    });
  });

  describe('isStateValid', () => {
    it('should validate all states', () => {
      expect(service.isStateValid('WAITING')).toBe(true);
      expect(service.isStateValid('RUNNING')).toBe(true);
      expect(service.isStateValid('COMPLETED')).toBe(true);
      expect(service.isStateValid('FAILED')).toBe(true);
      expect(service.isStateValid('RETRYING')).toBe(true);
      expect(service.isStateValid('DEAD_LETTER')).toBe(true);
      expect(service.isStateValid('CANCELLED')).toBe(true);
      expect(service.isStateValid('PAUSED')).toBe(true);
    });

    it('should reject invalid states', () => {
      expect(service.isStateValid('invalid')).toBe(false);
      expect(service.isStateValid('')).toBe(false);
      expect(service.isStateValid('waiting')).toBe(false);
    });
  });
});
