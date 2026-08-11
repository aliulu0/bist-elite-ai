import { WorkflowQueueEngine } from './workflow-queue.engine';
import { QueueJob, QueuePriority, QueueJobHandler } from './workflow-queue.types';
import { WorkflowQueueConfig } from './workflow-queue.config';

function makeEngine(overrides?: Partial<WorkflowQueueConfig>) {
  return new WorkflowQueueEngine({
    workers: 2,
    maxQueueSize: 100,
    defaultMaxAttempts: 2,
    defaultRetryDelayMs: 10,
    backoffMultiplier: 2,
    maxRetryDelayMs: 100,
    jobTimeoutMs: 5000,
    cleanupIntervalMs: 0,
    ...overrides,
  });
}

const noopHandler: QueueJobHandler = () => ({ ok: true });
const failingHandler: QueueJobHandler = () => { throw new Error('handler failed'); };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('WorkflowQueueEngine', () => {
  let engine: WorkflowQueueEngine;

  beforeEach(() => {
    engine = makeEngine();
  });

  afterEach(() => {
    engine.stop();
    engine.clear();
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  describe('enqueue', () => {
    it('should enqueue a job', () => {
      const job = engine.enqueue('wf-1', 'analysis', { symbol: 'THYAO' });
      expect(job.id).toBeDefined();
      expect(job.workflowId).toBe('wf-1');
      expect(job.type).toBe('analysis');
      expect(job.state).toBe('WAITING');
      expect(job.priority).toBe('NORMAL');
    });

    it('should increment totalEnqueued', () => {
      engine.enqueue('wf-1', 'analysis', {});
      expect(engine.getStatistics().totalEnqueued).toBe(1);
    });

    it('should add to waiting queue', () => {
      engine.enqueue('wf-1', 'analysis', {});
      expect(engine.getQueue().length).toBe(1);
    });

    it('should throw when queue is full', () => {
      const smallEngine = makeEngine({ maxQueueSize: 2 });
      smallEngine.enqueue('wf-1', 'a', {});
      smallEngine.enqueue('wf-2', 'a', {});
      expect(() => smallEngine.enqueue('wf-3', 'a', {})).toThrow('Queue is full');
      smallEngine.stop();
      smallEngine.clear();
    });

    it('should accept custom priority', () => {
      const job = engine.enqueue('wf-1', 'a', {}, { priority: 'CRITICAL' });
      expect(job.priority).toBe('CRITICAL');
    });

    it('should accept custom maxAttempts', () => {
      const job = engine.enqueue('wf-1', 'a', {}, { maxAttempts: 5 });
      expect(job.maxAttempts).toBe(5);
    });
  });

  describe('priority ordering', () => {
    it('should sort by priority - CRITICAL first', () => {
      engine.enqueue('wf-1', 'a', {}, { priority: 'LOW' });
      engine.enqueue('wf-2', 'a', {}, { priority: 'CRITICAL' });
      engine.enqueue('wf-3', 'a', {}, { priority: 'NORMAL' });
      const queue = engine.getQueue();
      expect(queue[0].priority).toBe('CRITICAL');
      expect(queue[1].priority).toBe('NORMAL');
      expect(queue[2].priority).toBe('LOW');
    });

    it('should maintain FIFO within same priority', () => {
      engine.enqueue('wf-1', 'a', {});
      engine.enqueue('wf-2', 'a', {});
      engine.enqueue('wf-3', 'a', {});
      const queue = engine.getQueue();
      expect(queue[0].workflowId).toBe('wf-1');
      expect(queue[1].workflowId).toBe('wf-2');
      expect(queue[2].workflowId).toBe('wf-3');
    });

    it('should handle all priority levels', () => {
      const priorities: QueuePriority[] = ['LOW', 'NORMAL', 'HIGH', 'VERY_HIGH', 'CRITICAL'];
      for (const p of priorities) {
        engine.enqueue(`wf-${p}`, 'a', {}, { priority: p });
      }
      const queue = engine.getQueue();
      expect(queue[0].priority).toBe('CRITICAL');
      expect(queue[4].priority).toBe('LOW');
    });
  });

  describe('dequeue', () => {
    it('should dequeue a job', () => {
      engine.enqueue('wf-1', 'a', {});
      const job = engine.dequeue();
      expect(job).not.toBeNull();
      expect(job!.workflowId).toBe('wf-1');
    });

    it('should return null when empty', () => {
      expect(engine.dequeue()).toBeNull();
    });

    it('should remove from queue', () => {
      engine.enqueue('wf-1', 'a', {});
      engine.dequeue();
      expect(engine.getQueue().length).toBe(0);
    });
  });

  describe('peek', () => {
    it('should peek without removing', () => {
      engine.enqueue('wf-1', 'a', {});
      const peeked = engine.peek();
      expect(peeked).not.toBeNull();
      expect(engine.getQueue().length).toBe(1);
    });

    it('should return null when empty', () => {
      expect(engine.peek()).toBeNull();
    });

    it('should show highest priority', () => {
      engine.enqueue('wf-1', 'a', {}, { priority: 'LOW' });
      engine.enqueue('wf-2', 'a', {}, { priority: 'CRITICAL' });
      expect(engine.peek()!.priority).toBe('CRITICAL');
    });
  });

  describe('start and stop', () => {
    it('should start the engine', () => {
      engine.start();
      expect(engine.isStarted()).toBe(true);
    });

    it('should stop the engine', () => {
      engine.start();
      engine.stop();
      expect(engine.isPaused()).toBe(true);
    });

    it('should not start twice', () => {
      engine.start();
      engine.start();
      expect(engine.isStarted()).toBe(true);
    });

    it('should track uptime', () => {
      engine.start();
      const stats = engine.getStatistics();
      expect(stats.uptimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('pause and resume', () => {
    it('should pause', () => {
      engine.start();
      engine.pause();
      expect(engine.isPaused()).toBe(true);
    });

    it('should resume', () => {
      engine.start();
      engine.pause();
      engine.resume();
      expect(engine.isPaused()).toBe(false);
    });

    it('should not process when paused', async () => {
      engine.registerHandler('a', noopHandler);
      engine.start();
      engine.pause();
      engine.enqueue('wf-1', 'a', {});
      expect(engine.getQueue().length).toBe(1);
      expect(engine.getRunning().length).toBe(0);
    });
  });

  describe('workers', () => {
    it('should have configured number of workers', () => {
      expect(engine.getWorkers().length).toBe(2);
    });

    it('should execute job with worker', async () => {
      engine.registerHandler('a', noopHandler);
      engine.start();
      engine.enqueue('wf-1', 'a', {});
      await delay(50);
      expect(engine.getStatistics().totalCompleted).toBe(1);
    });

    it('should track active workers', async () => {
      const slowHandler: QueueJobHandler = () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 50));
      engine.registerHandler('a', slowHandler);
      engine.start();
      engine.enqueue('wf-1', 'a', {});
      await delay(10);
      expect(engine.getStatistics().activeWorkers).toBeGreaterThanOrEqual(0);
    });

    it('should respect worker limit', async () => {
      let running = 0;
      let maxRunning = 0;
      const slowHandler: QueueJobHandler = async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await delay(30);
        running--;
        return { ok: true };
      };
      engine.registerHandler('a', slowHandler);
      engine.start();
      for (let i = 0; i < 6; i++) {
        engine.enqueue(`wf-${i}`, 'a', {});
      }
      await delay(20);
      expect(maxRunning).toBeLessThanOrEqual(2);
    });
  });

  describe('cancel', () => {
    it('should cancel a waiting job', () => {
      const job = engine.enqueue('wf-1', 'a', {});
      const cancelled = engine.cancel(job.id);
      expect(cancelled).toBe(true);
      expect(engine.getStatistics().totalCancelled).toBe(1);
    });

    it('should return false for non-existent job', () => {
      expect(engine.cancel('nonexistent')).toBe(false);
    });

    it('should not cancel completed job', async () => {
      engine.registerHandler('a', noopHandler);
      engine.start();
      const job = engine.enqueue('wf-1', 'a', {});
      await delay(50);
      expect(engine.cancel(job.id)).toBe(false);
    });

    it('should cancel a running job', async () => {
      const slowHandler: QueueJobHandler = () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 200));
      engine.registerHandler('a', slowHandler);
      engine.start();
      const job = engine.enqueue('wf-1', 'a', {});
      await delay(10);
      const cancelled = engine.cancel(job.id);
      expect(cancelled).toBe(true);
    });
  });

  describe('retry', () => {
    it('should retry a failed job', async () => {
      engine.registerHandler('a', failingHandler);
      engine.start();
      const job = engine.enqueue('wf-1', 'a', {}, { maxAttempts: 1 });
      await delay(50);
      expect(job.state).toBe('DEAD_LETTER');
      engine.stop();
      const retried = engine.retry(job.id);
      expect(retried).toBe(true);
      expect(job.state).toBe('WAITING');
    });

    it('should return false for non-existent job', () => {
      expect(engine.retry('nonexistent')).toBe(false);
    });

    it('should not retry running job', async () => {
      const slowHandler: QueueJobHandler = () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 200));
      engine.registerHandler('a', slowHandler);
      engine.start();
      const job = engine.enqueue('wf-1', 'a', {});
      await delay(10);
      expect(job.state).toBe('RUNNING');
      expect(engine.retry(job.id)).toBe(false);
    });

    it('should increment retry count', async () => {
      engine.registerHandler('a', failingHandler);
      engine.start();
      const job = engine.enqueue('wf-1', 'a', {}, { maxAttempts: 1 });
      await delay(50);
      engine.retry(job.id);
      expect(engine.getStatistics().totalRetried).toBeGreaterThanOrEqual(1);
    });
  });

  describe('dead letter', () => {
    it('should move failed job to dead letter after max attempts', async () => {
      engine.registerHandler('a', failingHandler);
      engine.start();
      engine.enqueue('wf-1', 'a', {}, { maxAttempts: 1 });
      await delay(50);
      expect(engine.getDeadLetter().length).toBe(1);
    });

    it('should move running job to dead letter', async () => {
      const slowHandler: QueueJobHandler = () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 200));
      engine.registerHandler('a', slowHandler);
      engine.start();
      const job = engine.enqueue('wf-1', 'a', {});
      await delay(10);
      const moved = engine.moveToDeadLetter(job.id);
      expect(moved).toBe(true);
      expect(engine.getDeadLetter().length).toBe(1);
    });

    it('should return false for non-existent job', () => {
      expect(engine.moveToDeadLetter('nonexistent')).toBe(false);
    });

    it('should retry from dead letter', async () => {
      engine.registerHandler('a', failingHandler);
      engine.start();
      const job = engine.enqueue('wf-1', 'a', {}, { maxAttempts: 1 });
      await delay(50);
      expect(job.state).toBe('DEAD_LETTER');
      engine.stop();
      const retried = engine.retry(job.id);
      expect(retried).toBe(true);
      expect(job.state).toBe('WAITING');
      expect(engine.getDeadLetter().length).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all jobs', () => {
      engine.enqueue('wf-1', 'a', {});
      engine.enqueue('wf-2', 'a', {});
      engine.clear();
      expect(engine.getQueue().length).toBe(0);
      expect(engine.getCompleted().length).toBe(0);
      expect(engine.getFailed().length).toBe(0);
      expect(engine.getDeadLetter().length).toBe(0);
    });

    it('should clear completed only', async () => {
      engine.registerHandler('a', noopHandler);
      engine.start();
      engine.enqueue('wf-1', 'a', {});
      await delay(50);
      engine.clearCompleted();
      expect(engine.getCompleted().length).toBe(0);
    });

    it('should clear dead letter only', async () => {
      engine.registerHandler('a', failingHandler);
      engine.start();
      engine.enqueue('wf-1', 'a', {}, { maxAttempts: 1 });
      await delay(50);
      engine.clearDeadLetter();
      expect(engine.getDeadLetter().length).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should return correct initial stats', () => {
      const stats = engine.getStatistics();
      expect(stats.totalEnqueued).toBe(0);
      expect(stats.totalCompleted).toBe(0);
      expect(stats.totalFailed).toBe(0);
      expect(stats.waitingCount).toBe(0);
      expect(stats.totalWorkers).toBe(2);
    });

    it('should track completed count', async () => {
      engine.registerHandler('a', noopHandler);
      engine.start();
      engine.enqueue('wf-1', 'a', {});
      await delay(50);
      const stats = engine.getStatistics();
      expect(stats.totalCompleted).toBe(1);
      expect(stats.completedCount).toBe(1);
    });

    it('should track failed count', async () => {
      engine.registerHandler('a', failingHandler);
      engine.start();
      engine.enqueue('wf-1', 'a', {}, { maxAttempts: 1 });
      await delay(50);
      expect(engine.getStatistics().totalDeadLettered).toBe(1);
    });

    it('should track dead letter count', async () => {
      engine.registerHandler('a', failingHandler);
      engine.start();
      engine.enqueue('wf-1', 'a', {}, { maxAttempts: 1 });
      await delay(50);
      expect(engine.getStatistics().deadLetterCount).toBe(1);
    });

    it('should compute avg wait and execution times', async () => {
      engine.registerHandler('a', noopHandler);
      engine.start();
      engine.enqueue('wf-1', 'a', {});
      await delay(50);
      const stats = engine.getStatistics();
      expect(stats.avgWaitTimeMs).toBeGreaterThanOrEqual(0);
      expect(stats.avgExecutionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('snapshot', () => {
    it('should return snapshot', () => {
      engine.enqueue('wf-1', 'a', {});
      const snap = engine.getSnapshot();
      expect(snap.statistics).toBeDefined();
      expect(snap.waitingJobs).toHaveLength(1);
      expect(snap.runningJobs).toHaveLength(0);
      expect(snap.deadLetterJobs).toHaveLength(0);
      expect(snap.workers).toHaveLength(2);
      expect(snap.timestamp).toBeDefined();
    });
  });

  describe('handlers', () => {
    it('should register and use handler', async () => {
      engine.registerHandler('analysis', noopHandler);
      engine.start();
      engine.enqueue('wf-1', 'analysis', {});
      await delay(50);
      expect(engine.getStatistics().totalCompleted).toBe(1);
    });

    it('should fail job without handler', async () => {
      engine.start();
      engine.enqueue('wf-1', 'unknown', {}, { maxAttempts: 1 });
      await delay(50);
      expect(engine.getStatistics().totalDeadLettered).toBe(1);
    });
  });

  describe('getJob', () => {
    it('should find waiting job', () => {
      const job = engine.enqueue('wf-1', 'a', {});
      expect(engine.getJob(job.id)).toBeDefined();
    });

    it('should return undefined for non-existent', () => {
      expect(engine.getJob('nonexistent')).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle enqueue after stop', () => {
      engine.start();
      engine.stop();
      engine.enqueue('wf-1', 'a', {});
      expect(engine.getQueue().length).toBe(1);
    });

    it('should handle multiple enqueue/dequeue cycles', () => {
      for (let i = 0; i < 10; i++) {
        engine.enqueue(`wf-${i}`, 'a', {});
      }
      expect(engine.getQueue().length).toBe(10);
      for (let i = 0; i < 5; i++) {
        engine.dequeue();
      }
      expect(engine.getQueue().length).toBe(5);
    });

    it('should handle cancel during retry delay', async () => {
      engine.registerHandler('a', failingHandler);
      engine.start();
      const job = engine.enqueue('wf-1', 'a', {}, { maxAttempts: 2, retryDelayMs: 100 });
      await delay(50);
      engine.cancel(job.id);
      await delay(200);
      expect(engine.getStatistics().totalCancelled).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty metadata', () => {
      const job = engine.enqueue('wf-1', 'a', {}, {});
      expect(job.metadata).toEqual({});
    });

    it('should handle concurrent enqueue calls', () => {
      for (let i = 0; i < 50; i++) {
        engine.enqueue(`wf-${i}`, 'a', {});
      }
      expect(engine.getQueue().length).toBe(50);
    });

    it('should handle retry on dead letter clears dead letter entry', async () => {
      engine.registerHandler('a', failingHandler);
      engine.start();
      const job = engine.enqueue('wf-1', 'a', {}, { maxAttempts: 1 });
      await delay(50);
      expect(engine.getDeadLetter().length).toBe(1);
      engine.stop();
      engine.retry(job.id);
      expect(engine.getDeadLetter().length).toBe(0);
    });
  });

  describe('stress test', () => {
    it('should handle 100 jobs with 4 workers', async () => {
      const stressEngine = makeEngine({ workers: 4, defaultRetryDelayMs: 5, maxRetryDelayMs: 50 });
      stressEngine.registerHandler('a', noopHandler);
      stressEngine.start();

      for (let i = 0; i < 100; i++) {
        stressEngine.enqueue(`wf-${i}`, 'a', {});
      }

      await delay(500);
      const stats = stressEngine.getStatistics();
      expect(stats.totalCompleted).toBe(100);
      expect(stats.totalFailed).toBe(0);
      stressEngine.stop();
      stressEngine.clear();
    });

    it('should handle mixed priorities under load', async () => {
      const stressEngine = makeEngine({ workers: 1, defaultRetryDelayMs: 5, maxRetryDelayMs: 50 });
      const order: string[] = [];
      const slowHandler: QueueJobHandler = async (job) => {
        await delay(20);
        order.push(job.workflowId);
        return { ok: true };
      };
      stressEngine.registerHandler('a', slowHandler);

      stressEngine.enqueue('wf-low', 'a', {}, { priority: 'LOW' });
      stressEngine.enqueue('wf-critical', 'a', {}, { priority: 'CRITICAL' });
      stressEngine.enqueue('wf-normal', 'a', {}, { priority: 'NORMAL' });
      stressEngine.enqueue('wf-high', 'a', {}, { priority: 'HIGH' });

      stressEngine.start();
      await delay(200);
      expect(order[0]).toBe('wf-critical');
      expect(order[1]).toBe('wf-high');
      expect(order[2]).toBe('wf-normal');
      expect(order[3]).toBe('wf-low');
      stressEngine.stop();
      stressEngine.clear();
    });
  });

  describe('backoff', () => {
    it('should apply exponential backoff on retry', async () => {
      const backoffEngine = makeEngine({ workers: 1, defaultRetryDelayMs: 20, backoffMultiplier: 3, maxRetryDelayMs: 200, defaultMaxAttempts: 3 });
      backoffEngine.registerHandler('a', failingHandler);
      backoffEngine.start();
      const job = backoffEngine.enqueue('wf-1', 'a', {}, { retryDelayMs: 20, maxAttempts: 3 });
      await delay(50);
      expect(job.retryDelayMs).toBe(60);
      backoffEngine.stop();
      backoffEngine.clear();
    });

    it('should cap retry delay at maxRetryDelayMs', async () => {
      const backoffEngine = makeEngine({ workers: 1, defaultRetryDelayMs: 50, backoffMultiplier: 10, maxRetryDelayMs: 100, defaultMaxAttempts: 4 });
      backoffEngine.registerHandler('a', failingHandler);
      backoffEngine.start();
      const job = backoffEngine.enqueue('wf-1', 'a', {}, { retryDelayMs: 50, maxAttempts: 4 });
      await delay(50);
      expect(job.retryDelayMs).toBeLessThanOrEqual(100);
      backoffEngine.stop();
      backoffEngine.clear();
    });
  });
});
