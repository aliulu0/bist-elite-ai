import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JobName, JobState, JobExecution } from './scheduler.types';

function makeJobExecution(overrides?: Partial<JobExecution>): JobExecution {
  return {
    jobName: 'marketOpenScan',
    startedAt: '2025-01-15T12:00:00.000Z',
    completedAt: '2025-01-15T12:00:01.234Z',
    durationMs: 1234,
    success: true,
    error: null,
    metadata: {},
    ...overrides,
  };
}

function makeJobState(overrides?: Partial<JobState>): JobState {
  return {
    jobName: 'marketOpenScan',
    status: 'idle',
    enabled: true,
    intervalMs: 900000,
    lastExecution: makeJobExecution(),
    totalExecutions: 42,
    consecutiveFailures: 0,
    ...overrides,
  };
}

const mockService = {
  getStatus: jest.fn().mockReturnValue({
    running: true,
    jobs: [makeJobState()],
    uptime: 3600000,
    totalExecutions: 42,
  }),
  getJobState: jest.fn().mockReturnValue(makeJobState()),
  getJobHistory: jest.fn().mockReturnValue([makeJobExecution()]),
  executeJob: jest.fn().mockResolvedValue(makeJobExecution()),
  startScheduler: jest.fn().mockReturnValue({ running: true, activeJobs: 8 }),
  stopScheduler: jest.fn().mockReturnValue({ running: false }),
  enableJob: jest.fn().mockReturnValue(makeJobState({ enabled: true })),
  disableJob: jest.fn().mockReturnValue(makeJobState({ enabled: false, status: 'disabled' })),
};

describe('SchedulerController', () => {
  let controller: SchedulerController;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockService.getStatus.mockReturnValue({
      running: true,
      jobs: [makeJobState()],
      uptime: 3600000,
      totalExecutions: 42,
    });
    mockService.getJobState.mockReturnValue(makeJobState());
    mockService.getJobHistory.mockReturnValue([makeJobExecution()]);
    mockService.executeJob.mockResolvedValue(makeJobExecution());
    mockService.startScheduler.mockReturnValue({ running: true, activeJobs: 8 });
    mockService.stopScheduler.mockReturnValue({ running: false });
    mockService.enableJob.mockReturnValue(makeJobState({ enabled: true }));
    mockService.disableJob.mockReturnValue(makeJobState({ enabled: false, status: 'disabled' }));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulerController],
      providers: [{ provide: SchedulerService, useValue: mockService }],
    }).compile();

    controller = module.get<SchedulerController>(SchedulerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /scheduler', () => {
    it('should return full scheduler status', () => {
      const result = controller.getStatus();
      expect(result.success).toBe(true);
      expect(result.running).toBe(true);
      expect(result.jobs).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.totalExecutions).toBe(42);
      expect(result.timestamp).toBeDefined();
    });

    it('should reflect stopped state', () => {
      mockService.getStatus.mockReturnValue({
        running: false,
        jobs: [],
        uptime: 0,
        totalExecutions: 0,
      });
      const result = controller.getStatus();
      expect(result.running).toBe(false);
    });
  });

  describe('GET /scheduler/:jobName', () => {
    it('should return job state for valid job', () => {
      const result = controller.getJobState('marketOpenScan');
      expect(result.jobName).toBe('marketOpenScan');
      expect(result.enabled).toBe(true);
    });

    it('should throw for invalid job name', () => {
      expect(() => controller.getJobState('invalid')).toThrow(BadRequestException);
    });

    it('should throw when job not found', () => {
      mockService.getJobState.mockReturnValue(undefined);
      expect(() => controller.getJobState('marketOpenScan')).toThrow(NotFoundException);
    });
  });

  describe('POST /scheduler/:jobName/execute', () => {
    it('should execute a valid job', async () => {
      const result = await controller.executeJob('marketOpenScan');
      expect(result.success).toBe(true);
      expect(result.executionSuccess).toBe(true);
      expect(result.durationMs).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should throw for invalid job name', async () => {
      await expect(controller.executeJob('invalid')).rejects.toThrow(BadRequestException);
    });

    it('should return error when job fails', async () => {
      mockService.executeJob.mockResolvedValue(makeJobExecution({ success: false, error: 'Failed' }));
      const result = await controller.executeJob('marketOpenScan');
      expect(result.executionSuccess).toBe(false);
      expect(result.error).toBe('Failed');
    });
  });

  describe('POST /scheduler/start', () => {
    it('should start the scheduler', () => {
      const result = controller.start();
      expect(result.success).toBe(true);
      expect(result.running).toBe(true);
      expect(result.activeJobs).toBe(8);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('POST /scheduler/stop', () => {
    it('should stop the scheduler', () => {
      const result = controller.stop();
      expect(result.success).toBe(true);
      expect(result.running).toBe(false);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('POST /scheduler/:jobName/enable', () => {
    it('should enable a valid job', () => {
      const result = controller.enable('marketOpenScan');
      expect(result.enabled).toBe(true);
    });

    it('should throw for invalid job name', () => {
      expect(() => controller.enable('invalid')).toThrow(BadRequestException);
    });

    it('should throw when job not found', () => {
      mockService.enableJob.mockReturnValue(undefined);
      expect(() => controller.enable('marketOpenScan')).toThrow(NotFoundException);
    });
  });

  describe('POST /scheduler/:jobName/disable', () => {
    it('should disable a valid job', () => {
      const result = controller.disable('marketOpenScan');
      expect(result.enabled).toBe(false);
    });

    it('should throw for invalid job name', () => {
      expect(() => controller.disable('invalid')).toThrow(BadRequestException);
    });

    it('should throw when job not found', () => {
      mockService.disableJob.mockReturnValue(undefined);
      expect(() => controller.disable('marketOpenScan')).toThrow(NotFoundException);
    });
  });

  describe('GET /scheduler/:jobName/history', () => {
    it('should return job history', () => {
      const result = controller.getHistory('marketOpenScan');
      expect(result).toHaveLength(1);
      expect(result[0].jobName).toBe('marketOpenScan');
    });

    it('should throw for invalid job name', () => {
      expect(() => controller.getHistory('invalid')).toThrow(BadRequestException);
    });

    it('should pass limit to service', () => {
      controller.getHistory('marketOpenScan', 10);
      expect(mockService.getJobHistory).toHaveBeenCalledWith('marketOpenScan', 10);
    });

    it('should use default limit of 50', () => {
      controller.getHistory('marketOpenScan');
      expect(mockService.getJobHistory).toHaveBeenCalledWith('marketOpenScan', 50);
    });

    it('should return empty history', () => {
      mockService.getJobHistory.mockReturnValue([]);
      const result = controller.getHistory('marketOpenScan');
      expect(result).toEqual([]);
    });
  });
});
