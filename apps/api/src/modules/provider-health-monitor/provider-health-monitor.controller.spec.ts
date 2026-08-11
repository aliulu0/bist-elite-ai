import { Test, TestingModule } from '@nestjs/testing';
import { ProviderHealthMonitorController } from './provider-health-monitor.controller';
import { ProviderHealthMonitorService } from './provider-health-monitor.service';
import { BadRequestException } from '@nestjs/common';
import { ProviderName } from './provider-health-monitor.types';

function makeProviderState(overrides?: Partial<{ provider: ProviderName }>) {
  return {
    provider: 'yahoo_finance' as ProviderName,
    status: 'healthy' as const,
    totalRequests: 100,
    successfulRequests: 95,
    failedRequests: 5,
    timeoutCount: 2,
    consecutiveFailures: 0,
    lastFailureTime: null,
    lastSuccessTime: Date.now(),
    lastRequestTime: Date.now(),
    recoveryTimeMs: null,
    avgLatencyMs: 250,
    p50LatencyMs: 200,
    p95LatencyMs: 500,
    p99LatencyMs: 800,
    reliabilityScore: 95,
    successRate: 95,
    errorRate: 5,
    uptime: 300000,
    ...overrides,
  };
}

function makeSnapshot() {
  return {
    providers: [makeProviderState(), makeProviderState({ provider: 'fintables' as ProviderName })],
    overallStatus: 'healthy' as const,
    totalProviders: 4,
    healthyCount: 3,
    degradedCount: 1,
    unhealthyCount: 0,
    timestamp: new Date().toISOString(),
  };
}

const mockService = {
  getSnapshot: jest.fn().mockReturnValue(makeSnapshot()),
  getProviderState: jest.fn().mockReturnValue(makeProviderState()),
  getRequestHistory: jest.fn().mockReturnValue({ requests: [{ timestamp: Date.now(), latencyMs: 100, success: true, isTimeout: false }], total: 1 }),
  resetAll: jest.fn(),
  resetProvider: jest.fn(),
};

describe('ProviderHealthMonitorController', () => {
  let controller: ProviderHealthMonitorController;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockService.getSnapshot.mockReturnValue(makeSnapshot());
    mockService.getProviderState.mockReturnValue(makeProviderState());
    mockService.getRequestHistory.mockReturnValue({
      requests: [{ timestamp: Date.now(), latencyMs: 100, success: true, isTimeout: false }],
      total: 1,
    });
    mockService.resetAll.mockReturnValue(undefined);
    mockService.resetProvider.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProviderHealthMonitorController],
      providers: [
        { provide: ProviderHealthMonitorService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ProviderHealthMonitorController>(ProviderHealthMonitorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /providers/health', () => {
    it('should return full snapshot', () => {
      const result = controller.getSnapshot();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should call service.getSnapshot', () => {
      controller.getSnapshot();
      expect(mockService.getSnapshot).toHaveBeenCalledTimes(1);
    });

    it('should include overallStatus', () => {
      const result = controller.getSnapshot();
      expect(result.data).toHaveProperty('overallStatus');
    });

    it('should include providers array', () => {
      const result = controller.getSnapshot();
      expect(Array.isArray(result.data.providers)).toBe(true);
    });

    it('should include count fields', () => {
      const result = controller.getSnapshot();
      expect(result.data).toHaveProperty('totalProviders');
      expect(result.data).toHaveProperty('healthyCount');
      expect(result.data).toHaveProperty('degradedCount');
      expect(result.data).toHaveProperty('unhealthyCount');
    });

    it('should return ISO timestamp', () => {
      const result = controller.getSnapshot();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('GET /providers/health/:provider', () => {
    it('should return provider state for valid provider', () => {
      const result = controller.getProvider({ provider: 'yahoo_finance' });
      expect(result.success).toBe(true);
      expect(result.data.provider).toBe('yahoo_finance');
      expect(result.timestamp).toBeDefined();
    });

    it('should call service.getProviderState', () => {
      controller.getProvider({ provider: 'fintables' });
      expect(mockService.getProviderState).toHaveBeenCalledWith('fintables');
    });

    it('should throw for invalid provider', () => {
      expect(() => controller.getProvider({ provider: 'invalid_provider' })).toThrow(BadRequestException);
    });

    it('should accept all valid providers', () => {
      const validProviders = ['yahoo_finance', 'fintables', 'investing', 'google_discovery'];
      for (const p of validProviders) {
        mockService.getProviderState.mockReturnValue(makeProviderState({ provider: p as ProviderName }));
        const result = controller.getProvider({ provider: p });
        expect(result.success).toBe(true);
        expect(result.data.provider).toBe(p);
      }
    });

    it('should include all state fields', () => {
      const result = controller.getProvider({ provider: 'yahoo_finance' });
      expect(result.data).toHaveProperty('status');
      expect(result.data).toHaveProperty('totalRequests');
      expect(result.data).toHaveProperty('successfulRequests');
      expect(result.data).toHaveProperty('failedRequests');
      expect(result.data).toHaveProperty('reliabilityScore');
      expect(result.data).toHaveProperty('successRate');
      expect(result.data).toHaveProperty('errorRate');
    });
  });

  describe('GET /providers/history/:provider', () => {
    it('should return request history', () => {
      const result = controller.getHistory({ provider: 'yahoo_finance' }, {});
      expect(result.success).toBe(true);
      expect(result.data.requests).toBeDefined();
      expect(result.data.total).toBeDefined();
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
    });

    it('should call service with default pagination', () => {
      controller.getHistory({ provider: 'yahoo_finance' }, {});
      expect(mockService.getRequestHistory).toHaveBeenCalledWith('yahoo_finance', 50, 0);
    });

    it('should pass custom limit', () => {
      controller.getHistory({ provider: 'yahoo_finance' }, { limit: 10 });
      expect(mockService.getRequestHistory).toHaveBeenCalledWith('yahoo_finance', 10, 0);
    });

    it('should pass custom offset', () => {
      controller.getHistory({ provider: 'yahoo_finance' }, { offset: 20 });
      expect(mockService.getRequestHistory).toHaveBeenCalledWith('yahoo_finance', 50, 20);
    });

    it('should pass both limit and offset', () => {
      controller.getHistory({ provider: 'yahoo_finance' }, { limit: 5, offset: 10 });
      expect(mockService.getRequestHistory).toHaveBeenCalledWith('yahoo_finance', 5, 10);
    });

    it('should throw for invalid provider', () => {
      expect(() => controller.getHistory({ provider: 'invalid' }, {})).toThrow(BadRequestException);
    });

    it('should include request records', () => {
      mockService.getRequestHistory.mockReturnValue({
        requests: [
          { timestamp: Date.now(), latencyMs: 100, success: true, isTimeout: false },
          { timestamp: Date.now(), latencyMs: 200, success: false, isTimeout: true, error: 'timeout' },
        ],
        total: 2,
      });
      const result = controller.getHistory({ provider: 'yahoo_finance' }, {});
      expect(result.data.requests).toHaveLength(2);
      expect(result.data.requests[0].success).toBe(true);
      expect(result.data.requests[1].isTimeout).toBe(true);
    });

    it('should return empty requests', () => {
      mockService.getRequestHistory.mockReturnValue({ requests: [], total: 0 });
      const result = controller.getHistory({ provider: 'fintables' }, {});
      expect(result.data.requests).toEqual([]);
      expect(result.data.total).toBe(0);
    });
  });

  describe('POST /providers/reset', () => {
    it('should reset all providers', () => {
      const result = controller.resetAll();
      expect(result.success).toBe(true);
      expect(result.message).toBe('All provider statistics have been reset');
      expect(result.timestamp).toBeDefined();
    });

    it('should call service.resetAll', () => {
      controller.resetAll();
      expect(mockService.resetAll).toHaveBeenCalledTimes(1);
    });

    it('should return ISO timestamp', () => {
      const result = controller.resetAll();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('POST /providers/reset/:provider', () => {
    it('should reset a specific provider', () => {
      const result = controller.resetProvider({ provider: 'yahoo_finance' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('yahoo_finance');
      expect(mockService.resetProvider).toHaveBeenCalledWith('yahoo_finance');
    });

    it('should throw for invalid provider', () => {
      expect(() => controller.resetProvider({ provider: 'invalid' })).toThrow(BadRequestException);
    });

    it('should call service.resetProvider with correct name', () => {
      controller.resetProvider({ provider: 'fintables' });
      expect(mockService.resetProvider).toHaveBeenCalledWith('fintables');
    });

    it('should return proper message format', () => {
      const result = controller.resetProvider({ provider: 'investing' });
      expect(result.message).toBe("Provider 'investing' statistics have been reset");
    });
  });
});
