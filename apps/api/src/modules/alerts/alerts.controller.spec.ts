import { Test, TestingModule } from '@nestjs/testing';
import { AlertsController } from './alerts.controller';
import { AlertEngine } from './engine/alert-engine.service';

function makeHistoryEntry(overrides?: Record<string, unknown>) {
  return {
    alert: {
      id: 'alert-1',
      type: 'OPPORTUNITY',
      priority: 'HIGH',
      title: 'THYAO: STRONG_BUY',
      message: 'THYAO - Rank #1',
      symbol: 'THYAO',
      channels: ['APPLICATION', 'WEBSOCKET'],
      status: 'ACTIVE',
      createdAt: '2026-08-01T00:00:00.000Z',
      acknowledgedAt: null,
      dismissedAt: null,
      expiresAt: null,
    },
    channelsSent: ['APPLICATION', 'WEBSOCKET'],
    channelsFailed: [],
    durationMs: 12,
    timestamp: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

const mockEngine = {
  getHistory: jest.fn(),
  getMetrics: jest.fn(),
  acknowledgeAlert: jest.fn(),
  dismissAlert: jest.fn(),
};

describe('AlertsController', () => {
  let controller: AlertsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [{ provide: AlertEngine, useValue: mockEngine }],
    }).compile();
    controller = module.get<AlertsController>(AlertsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /alerts', () => {
    it('should return alert history in envelope', () => {
      mockEngine.getHistory.mockReturnValue([makeHistoryEntry()]);
      const result = controller.getAlerts(undefined, undefined);
      expect(result.success).toBe(true);
      expect(result.data.alerts).toHaveLength(1);
      expect(result.data.alerts[0].id).toBe('alert-1');
      expect(result.data.alerts[0].deliveredChannels).toContain('APPLICATION');
      expect(result.data.total).toBe(1);
      expect(result.data.limit).toBe(50);
    });

    it('should apply limit/offset', () => {
      mockEngine.getHistory.mockReturnValue([]);
      controller.getAlerts('10', '5');
      expect(mockEngine.getHistory).toHaveBeenCalledWith(10, 5);
    });
  });

  describe('GET /alerts/metrics', () => {
    it('should return metrics', () => {
      mockEngine.getMetrics.mockReturnValue({ totalAlertsCreated: 3, timestamp: 'x' });
      const result = controller.getMetrics();
      expect(result.success).toBe(true);
      expect(result.data.totalAlertsCreated).toBe(3);
    });
  });

  describe('POST /alerts/:id/acknowledge', () => {
    it('should acknowledge an alert', async () => {
      mockEngine.acknowledgeAlert.mockResolvedValue(true);
      const result = await controller.acknowledge('alert-1');
      expect(result.success).toBe(true);
      expect(mockEngine.acknowledgeAlert).toHaveBeenCalledWith('alert-1');
    });

    it('should report failure when not found', async () => {
      mockEngine.acknowledgeAlert.mockResolvedValue(false);
      const result = await controller.acknowledge('nope');
      expect(result.success).toBe(false);
    });
  });

  describe('POST /alerts/:id/dismiss', () => {
    it('should dismiss an alert', async () => {
      mockEngine.dismissAlert.mockResolvedValue(true);
      const result = await controller.dismiss('alert-1');
      expect(result.success).toBe(true);
      expect(mockEngine.dismissAlert).toHaveBeenCalledWith('alert-1');
    });

    it('should report failure when not found', async () => {
      mockEngine.dismissAlert.mockResolvedValue(false);
      const result = await controller.dismiss('nope');
      expect(result.success).toBe(false);
    });
  });
});
