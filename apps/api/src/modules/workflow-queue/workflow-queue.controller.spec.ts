import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowQueueController } from './workflow-queue.controller';
import { WorkflowQueueService } from './workflow-queue.service';

describe('WorkflowQueueController', () => {
  let controller: WorkflowQueueController;

  const mockService = {
    getSnapshot: jest.fn(),
    getStatistics: jest.fn(),
    getAllJobs: jest.fn(),
    getJob: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    retryJob: jest.fn(),
    cancelJob: jest.fn(),
    clear: jest.fn(),
    isPriorityValid: jest.fn(),
    isStateValid: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowQueueController],
      providers: [{ provide: WorkflowQueueService, useValue: mockService }],
    }).compile();
    controller = module.get(WorkflowQueueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/v1/queue', () => {
    it('should return snapshot', async () => {
      const snapshot = {
        statistics: { totalEnqueued: 5, waitingCount: 2, runningCount: 1, completedCount: 2, failedCount: 0, deadLetterCount: 0, activeWorkers: 1, totalWorkers: 4, avgWaitTimeMs: 100, avgExecutionTimeMs: 500, uptimeMs: 10000, totalCompleted: 2, totalFailed: 0, totalCancelled: 0, totalRetried: 0, totalDeadLettered: 0 },
        waitingJobs: [], runningJobs: [], deadLetterJobs: [],
        workers: [{ id: 0, busy: true, jobId: 'jq-1', startedAt: new Date().toISOString() }],
        timestamp: new Date().toISOString(),
      };
      mockService.getSnapshot.mockReturnValue(snapshot);
      const result = await controller.getSnapshot();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(snapshot);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/queue/statistics', () => {
    it('should return statistics', async () => {
      const stats = { totalEnqueued: 10, totalCompleted: 8, totalFailed: 1, totalCancelled: 1, totalRetried: 2, totalDeadLettered: 0, waitingCount: 1, runningCount: 0, completedCount: 8, failedCount: 1, deadLetterCount: 0, activeWorkers: 0, totalWorkers: 4, avgWaitTimeMs: 150, avgExecutionTimeMs: 300, uptimeMs: 50000 };
      mockService.getStatistics.mockReturnValue(stats);
      const result = await controller.getStatistics();
      expect(result.success).toBe(true);
      expect(result.data.totalEnqueued).toBe(10);
    });
  });

  describe('GET /api/v1/queue/jobs', () => {
    it('should return jobs with defaults', async () => {
      mockService.isStateValid.mockReturnValue(true);
      mockService.isPriorityValid.mockReturnValue(true);
      mockService.getAllJobs.mockReturnValue({ jobs: [{ id: 'jq-1', state: 'WAITING', priority: 'NORMAL' }], total: 1 });
      const result = await controller.getJobs({});
      expect(result.success).toBe(true);
      expect(result.data.jobs.length).toBe(1);
      expect(mockService.getAllJobs).toHaveBeenCalledWith({ limit: 50, offset: 0, state: undefined, priority: undefined });
    });

    it('should use provided pagination', async () => {
      mockService.isStateValid.mockReturnValue(true);
      mockService.isPriorityValid.mockReturnValue(true);
      mockService.getAllJobs.mockReturnValue({ jobs: [], total: 0 });
      await controller.getJobs({ limit: 10, offset: 5 });
      expect(mockService.getAllJobs).toHaveBeenCalledWith({ limit: 10, offset: 5, state: undefined, priority: undefined });
    });

    it('should filter by state', async () => {
      mockService.isStateValid.mockReturnValue(true);
      mockService.isPriorityValid.mockReturnValue(true);
      mockService.getAllJobs.mockReturnValue({ jobs: [], total: 0 });
      await controller.getJobs({ state: 'RUNNING' });
      expect(mockService.getAllJobs).toHaveBeenCalledWith({ limit: 50, offset: 0, state: 'RUNNING', priority: undefined });
    });

    it('should filter by priority', async () => {
      mockService.isStateValid.mockReturnValue(true);
      mockService.isPriorityValid.mockReturnValue(true);
      mockService.getAllJobs.mockReturnValue({ jobs: [], total: 0 });
      await controller.getJobs({ priority: 'HIGH' });
      expect(mockService.getAllJobs).toHaveBeenCalledWith({ limit: 50, offset: 0, state: undefined, priority: 'HIGH' });
    });

    it('should return error for invalid state', async () => {
      mockService.isStateValid.mockReturnValue(false);
      const result = await controller.getJobs({ state: 'INVALID' });
      expect(result.success).toBe(false);
      expect(result.data.jobs).toEqual([]);
    });

    it('should return error for invalid priority', async () => {
      mockService.isStateValid.mockReturnValue(true);
      mockService.isPriorityValid.mockReturnValue(false);
      const result = await controller.getJobs({ priority: 'INVALID' });
      expect(result.success).toBe(false);
      expect(result.data.jobs).toEqual([]);
    });
  });

  describe('GET /api/v1/queue/job/:id', () => {
    it('should return job when found', async () => {
      mockService.getJob.mockReturnValue({ id: 'jq-1', state: 'WAITING' });
      const result = await controller.getJob({ id: 'jq-1' });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('jq-1');
    });

    it('should return error when not found', async () => {
      mockService.getJob.mockReturnValue(undefined);
      const result = await controller.getJob({ id: 'nonexistent' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('POST /api/v1/queue/start', () => {
    it('should start queue', async () => {
      mockService.start.mockImplementation(() => {});
      const result = await controller.startQueue();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Queue started successfully');
      expect(mockService.start).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/queue/stop', () => {
    it('should stop queue', async () => {
      mockService.stop.mockImplementation(() => {});
      const result = await controller.stopQueue();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Queue stopped successfully');
      expect(mockService.stop).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/queue/job/:id/retry', () => {
    it('should retry failed job', async () => {
      mockService.getJob.mockReturnValue({ id: 'jq-1', state: 'FAILED' });
      mockService.retryJob.mockReturnValue(true);
      const result = await controller.retryJob({ id: 'jq-1' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('retry');
    });

    it('should retry dead-lettered job', async () => {
      mockService.getJob.mockReturnValue({ id: 'jq-1', state: 'DEAD_LETTER' });
      mockService.retryJob.mockReturnValue(true);
      const result = await controller.retryJob({ id: 'jq-1' });
      expect(result.success).toBe(true);
    });

    it('should return error when job not found', async () => {
      mockService.getJob.mockReturnValue(undefined);
      const result = await controller.retryJob({ id: 'nonexistent' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should return error for non-retriable state', async () => {
      mockService.getJob.mockReturnValue({ id: 'jq-1', state: 'WAITING' });
      const result = await controller.retryJob({ id: 'jq-1' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('cannot be retried');
    });

    it('should return error for completed state', async () => {
      mockService.getJob.mockReturnValue({ id: 'jq-1', state: 'COMPLETED' });
      const result = await controller.retryJob({ id: 'jq-1' });
      expect(result.success).toBe(false);
    });
  });

  describe('POST /api/v1/queue/job/:id/cancel', () => {
    it('should cancel waiting job', async () => {
      mockService.getJob.mockReturnValue({ id: 'jq-1', state: 'WAITING' });
      mockService.cancelJob.mockReturnValue(true);
      const result = await controller.cancelJob({ id: 'jq-1' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('cancelled');
    });

    it('should return error when job not found', async () => {
      mockService.getJob.mockReturnValue(undefined);
      const result = await controller.cancelJob({ id: 'nonexistent' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should return error for completed state', async () => {
      mockService.getJob.mockReturnValue({ id: 'jq-1', state: 'COMPLETED' });
      const result = await controller.cancelJob({ id: 'jq-1' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('cannot be cancelled');
    });

    it('should return error for failed state', async () => {
      mockService.getJob.mockReturnValue({ id: 'jq-1', state: 'FAILED' });
      const result = await controller.cancelJob({ id: 'jq-1' });
      expect(result.success).toBe(false);
    });

    it('should return error for cancelled state', async () => {
      mockService.getJob.mockReturnValue({ id: 'jq-1', state: 'CANCELLED' });
      const result = await controller.cancelJob({ id: 'jq-1' });
      expect(result.success).toBe(false);
    });

    it('should return error for dead-letter state', async () => {
      mockService.getJob.mockReturnValue({ id: 'jq-1', state: 'DEAD_LETTER' });
      const result = await controller.cancelJob({ id: 'jq-1' });
      expect(result.success).toBe(false);
    });
  });

  describe('POST /api/v1/queue/clear', () => {
    it('should clear queue', async () => {
      mockService.clear.mockImplementation(() => {});
      const result = await controller.clearQueue();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Queue cleared successfully');
      expect(mockService.clear).toHaveBeenCalled();
    });
  });
});
