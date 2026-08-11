import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { WorkflowInstance, WorkflowStats } from './workflow.types';

function makeWorkflow(overrides?: Partial<WorkflowInstance>): WorkflowInstance {
  return {
    id: 'wf-1700000000000-0a1b',
    type: 'single_stock_analysis',
    status: 'pending',
    symbol: 'THYAO',
    steps: [
      { step: 'fetch_data', status: 'pending', startedAt: null, completedAt: null, durationMs: 0, attempt: 0, error: null, metadata: {} },
    ],
    currentStep: null,
    progress: 0,
    startedAt: null,
    completedAt: null,
    durationMs: 0,
    retryCount: 0,
    metadata: {},
    createdAt: '2025-01-15T12:00:00.000Z',
    ...overrides,
  };
}

function makeStats(overrides?: Partial<WorkflowStats>): WorkflowStats {
  return {
    totalCreated: 10,
    totalCompleted: 8,
    totalFailed: 1,
    totalCancelled: 1,
    totalTimedOut: 0,
    activeWorkflows: 2,
    avgDurationMs: 300000,
    byType: {
      single_stock_analysis: { created: 5, completed: 4, failed: 0 },
      market_scan: { created: 3, completed: 2, failed: 1 },
      backtest: { created: 1, completed: 1, failed: 0 },
      optimization: { created: 1, completed: 1, failed: 0 },
      full_pipeline: { created: 0, completed: 0, failed: 0 },
    },
    ...overrides,
  };
}

const mockService = {
  createWorkflow: jest.fn().mockReturnValue(makeWorkflow()),
  startWorkflow: jest.fn().mockResolvedValue(makeWorkflow({ status: 'completed' })),
  cancelWorkflow: jest.fn().mockReturnValue(true),
  retryWorkflow: jest.fn().mockResolvedValue(makeWorkflow({ id: 'wf-retry-1', metadata: { retriedFrom: 'wf-1700000000000-0a1b' } })),
  getWorkflow: jest.fn().mockReturnValue(makeWorkflow()),
  listWorkflows: jest.fn().mockReturnValue([makeWorkflow()]),
  getActiveWorkflows: jest.fn().mockReturnValue([makeWorkflow()]),
  getHistory: jest.fn().mockReturnValue([makeWorkflow({ status: 'completed' })]),
  getStatistics: jest.fn().mockReturnValue(makeStats()),
};

describe('WorkflowController', () => {
  let controller: WorkflowController;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockService.createWorkflow.mockReturnValue(makeWorkflow());
    mockService.startWorkflow.mockResolvedValue(makeWorkflow({ status: 'completed' }));
    mockService.cancelWorkflow.mockReturnValue(true);
    mockService.retryWorkflow.mockResolvedValue(makeWorkflow({ id: 'wf-retry-1', metadata: { retriedFrom: 'wf-1700000000000-0a1b' } }));
    mockService.getWorkflow.mockReturnValue(makeWorkflow());
    mockService.listWorkflows.mockReturnValue([makeWorkflow()]);
    mockService.getActiveWorkflows.mockReturnValue([makeWorkflow()]);
    mockService.getHistory.mockReturnValue([makeWorkflow({ status: 'completed' })]);
    mockService.getStatistics.mockReturnValue(makeStats());

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [{ provide: WorkflowService, useValue: mockService }],
    }).compile();

    controller = module.get<WorkflowController>(WorkflowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /workflows', () => {
    it('should return list of workflows', () => {
      const result = controller.listWorkflows({});
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.timestamp).toBeDefined();
    });

    it('should pass status filter', () => {
      controller.listWorkflows({ status: 'pending' });
      expect(mockService.listWorkflows).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('should pass type filter', () => {
      controller.listWorkflows({ type: 'market_scan' });
      expect(mockService.listWorkflows).toHaveBeenCalledWith({ type: 'market_scan' });
    });

    it('should throw for invalid status', () => {
      expect(() => controller.listWorkflows({ status: 'invalid' })).toThrow(BadRequestException);
    });

    it('should throw for invalid type', () => {
      expect(() => controller.listWorkflows({ type: 'invalid' })).toThrow(BadRequestException);
    });

    it('should return empty list', () => {
      mockService.listWorkflows.mockReturnValue([]);
      const result = controller.listWorkflows({});
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('GET /workflows/active', () => {
    it('should return active workflows', () => {
      const result = controller.getActiveWorkflows();
      expect(result.data).toHaveLength(1);
      expect(result.timestamp).toBeDefined();
    });

    it('should return empty when none active', () => {
      mockService.getActiveWorkflows.mockReturnValue([]);
      const result = controller.getActiveWorkflows();
      expect(result.data).toEqual([]);
    });
  });

  describe('GET /workflows/history', () => {
    it('should return workflow history', () => {
      const result = controller.getHistory({});
      expect(result.data).toHaveLength(1);
      expect(result.timestamp).toBeDefined();
    });

    it('should pass filters to service', () => {
      controller.getHistory({ type: 'backtest', status: 'completed', limit: 10 });
      expect(mockService.getHistory).toHaveBeenCalledWith({
        type: 'backtest',
        status: 'completed',
        limit: 10,
      });
    });

    it('should throw for invalid type', () => {
      expect(() => controller.getHistory({ type: 'invalid' })).toThrow(BadRequestException);
    });

    it('should throw for invalid status', () => {
      expect(() => controller.getHistory({ status: 'invalid' })).toThrow(BadRequestException);
    });

    it('should handle empty history', () => {
      mockService.getHistory.mockReturnValue([]);
      const result = controller.getHistory({});
      expect(result.data).toEqual([]);
    });
  });

  describe('GET /workflows/statistics', () => {
    it('should return workflow statistics', () => {
      const result = controller.getStatistics();
      expect(result.success).toBe(true);
      expect(result.totalCreated).toBe(10);
      expect(result.totalCompleted).toBe(8);
      expect(result.byType).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('GET /workflows/:id', () => {
    it('should return workflow by id', () => {
      const result = controller.getWorkflow('wf-1700000000000-0a1b');
      expect(result.id).toBe('wf-1700000000000-0a1b');
    });

    it('should throw for non-existent workflow', () => {
      mockService.getWorkflow.mockReturnValue(undefined);
      expect(() => controller.getWorkflow('nonexistent')).toThrow(NotFoundException);
    });
  });

  describe('POST /workflows', () => {
    it('should create a workflow', () => {
      const result = controller.createWorkflow({ type: 'single_stock_analysis', symbol: 'THYAO' });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should throw for invalid type', () => {
      expect(() => controller.createWorkflow({ type: 'invalid' })).toThrow(BadRequestException);
    });

    it('should throw for single_stock_analysis without symbol', () => {
      expect(() => controller.createWorkflow({ type: 'single_stock_analysis' })).toThrow(BadRequestException);
    });

    it('should allow market_scan without symbol', () => {
      const result = controller.createWorkflow({ type: 'market_scan' });
      expect(result.success).toBe(true);
    });

    it('should pass metadata to service', () => {
      controller.createWorkflow({ type: 'backtest', metadata: { source: 'test' } });
      expect(mockService.createWorkflow).toHaveBeenCalledWith('backtest', undefined, { source: 'test' });
    });
  });

  describe('POST /workflows/:id/start', () => {
    it('should start a workflow', async () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'pending' }));
      const result = await controller.startWorkflow('wf-1700000000000-0a1b');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should throw for non-existent workflow', async () => {
      mockService.getWorkflow.mockReturnValue(undefined);
      await expect(controller.startWorkflow('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw for running workflow', async () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'running' }));
      await expect(controller.startWorkflow('wf-1700000000000-0a1b')).rejects.toThrow(ConflictException);
    });

    it('should throw for completed workflow', async () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'completed' }));
      await expect(controller.startWorkflow('wf-1700000000000-0a1b')).rejects.toThrow(ConflictException);
    });

    it('should allow starting queued workflow', async () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'queued' }));
      const result = await controller.startWorkflow('wf-1700000000000-0a1b');
      expect(result.success).toBe(true);
    });
  });

  describe('POST /workflows/:id/cancel', () => {
    it('should cancel a pending workflow', () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'pending' }));
      const result = controller.cancelWorkflow('wf-1700000000000-0a1b');
      expect(result.success).toBe(true);
    });

    it('should throw for non-existent workflow', () => {
      mockService.getWorkflow.mockReturnValue(undefined);
      expect(() => controller.cancelWorkflow('nonexistent')).toThrow(NotFoundException);
    });

    it('should throw for completed workflow', () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'completed' }));
      expect(() => controller.cancelWorkflow('wf-1700000000000-0a1b')).toThrow(ConflictException);
    });

    it('should throw for failed workflow', () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'failed' }));
      expect(() => controller.cancelWorkflow('wf-1700000000000-0a1b')).toThrow(ConflictException);
    });

    it('should throw for cancelled workflow', () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'cancelled' }));
      expect(() => controller.cancelWorkflow('wf-1700000000000-0a1b')).toThrow(ConflictException);
    });

    it('should throw when cancel returns false', () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'running' }));
      mockService.cancelWorkflow.mockReturnValue(false);
      expect(() => controller.cancelWorkflow('wf-1700000000000-0a1b')).toThrow(ConflictException);
    });
  });

  describe('POST /workflows/:id/retry', () => {
    it('should retry a failed workflow', async () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'failed' }));
      const result = await controller.retryWorkflow('wf-1700000000000-0a1b');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should retry a completed workflow', async () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'completed' }));
      const result = await controller.retryWorkflow('wf-1700000000000-0a1b');
      expect(result.success).toBe(true);
    });

    it('should retry a timed-out workflow', async () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'timeout' }));
      const result = await controller.retryWorkflow('wf-1700000000000-0a1b');
      expect(result.success).toBe(true);
    });

    it('should throw for non-existent workflow', async () => {
      mockService.getWorkflow.mockReturnValue(undefined);
      await expect(controller.retryWorkflow('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw for running workflow', async () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'running' }));
      await expect(controller.retryWorkflow('wf-1700000000000-0a1b')).rejects.toThrow(ConflictException);
    });

    it('should throw for pending workflow', async () => {
      mockService.getWorkflow.mockReturnValue(makeWorkflow({ status: 'pending' }));
      await expect(controller.retryWorkflow('wf-1700000000000-0a1b')).rejects.toThrow(ConflictException);
    });
  });
});
