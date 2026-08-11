import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigDomain } from './configuration.types';

function makeAllDomains(): Record<string, Record<string, unknown>> {
  const domains = [
    'technical', 'financial', 'smart_money', 'opportunity', 'candidate',
    'confluence', 'elite_score', 'workflow', 'scheduler', 'providers',
    'scanner', 'backtest', 'benchmark', 'performance_monitor',
  ];
  const result: Record<string, Record<string, unknown>> = {};
  for (const d of domains) result[d] = { rsiPeriod: 14 };
  return result;
}

const mockService = {
  getAll: jest.fn().mockReturnValue(makeAllDomains()),
  getDomain: jest.fn().mockReturnValue({ rsiPeriod: 14, macdFast: 12 }),
  setValue: jest.fn().mockReturnValue(1),
  getProfiles: jest.fn().mockReturnValue([
    { id: 'profile-default', name: 'default', label: 'Default', description: 'Standard', configs: {}, createdAt: '2025-01-15T12:00:00.000Z', isSystem: true },
    { id: 'profile-balanced', name: 'balanced', label: 'Balanced', description: 'Balanced', configs: {}, createdAt: '2025-01-15T12:00:00.000Z', isSystem: true },
  ]),
  createProfile: jest.fn().mockReturnValue({
    id: 'profile-new', name: 'custom', label: 'Custom', description: 'My profile',
    configs: {}, createdAt: '2025-01-15T12:00:00.000Z', isSystem: false,
  }),
  loadProfile: jest.fn().mockReturnValue(true),
  duplicateProfile: jest.fn().mockReturnValue({
    id: 'profile-dup', name: 'dup', label: 'Dup', description: 'Copy of Default',
    configs: {}, createdAt: '2025-01-15T12:00:00.000Z', isSystem: false,
  }),
  deleteProfile: jest.fn().mockReturnValue(true),
  getSnapshots: jest.fn().mockReturnValue([]),
  createSnapshot: jest.fn().mockReturnValue({
    id: 'snap-1', timestamp: '2025-01-15T12:00:00.000Z', user: 'system',
    comment: 'Test', changedKeys: [], configs: {}, version: 1,
  }),
  rollbackSnapshot: jest.fn().mockReturnValue(true),
  getHistory: jest.fn().mockReturnValue({ entries: [], total: 0 }),
  getStats: jest.fn().mockReturnValue({
    version: 1, totalDomains: 14, totalKeys: 200, totalSnapshots: 0,
    totalProfiles: 4, activeProfile: 'default', totalChanges: 0, lastModified: null,
  }),
  resetDomain: jest.fn(),
  resetAll: jest.fn(),
};

describe('ConfigurationController', () => {
  let controller: ConfigurationController;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockService.getAll.mockReturnValue(makeAllDomains());
    mockService.getDomain.mockReturnValue({ rsiPeriod: 14 });
    mockService.setValue.mockReturnValue(1);
    mockService.getProfiles.mockReturnValue([
      { id: 'profile-default', name: 'default', label: 'Default', description: 'Standard', configs: {}, createdAt: '2025-01-15T12:00:00.000Z', isSystem: true },
    ]);
    mockService.createProfile.mockReturnValue({
      id: 'profile-new', name: 'custom', label: 'Custom', description: '',
      configs: {}, createdAt: '2025-01-15T12:00:00.000Z', isSystem: false,
    });
    mockService.loadProfile.mockReturnValue(true);
    mockService.duplicateProfile.mockReturnValue({
      id: 'profile-dup', name: 'dup', label: 'Dup', description: 'Copy',
      configs: {}, createdAt: '2025-01-15T12:00:00.000Z', isSystem: false,
    });
    mockService.deleteProfile.mockReturnValue(true);
    mockService.getSnapshots.mockReturnValue([]);
    mockService.createSnapshot.mockReturnValue({
      id: 'snap-1', timestamp: '2025-01-15T12:00:00.000Z', user: 'system',
      comment: 'Test', changedKeys: [], configs: {}, version: 1,
    });
    mockService.rollbackSnapshot.mockReturnValue(true);
    mockService.getHistory.mockReturnValue({ entries: [], total: 0 });
    mockService.getStats.mockReturnValue({
      version: 1, totalDomains: 14, totalKeys: 200, totalSnapshots: 0,
      totalProfiles: 4, activeProfile: 'default', totalChanges: 0, lastModified: null,
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigurationController],
      providers: [{ provide: ConfigurationService, useValue: mockService }],
    }).compile();

    controller = module.get<ConfigurationController>(ConfigurationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /configuration', () => {
    it('should return all configurations', () => {
      const result = controller.getAll();
      expect(result.success).toBe(true);
      expect(result.data.totalDomains).toBe(14);
      expect(result.data.domains).toBeDefined();
    });

    it('should call service.getAll', () => {
      controller.getAll();
      expect(mockService.getAll).toHaveBeenCalledTimes(1);
    });

    it('should include version from stats', () => {
      controller.getAll();
      expect(mockService.getStats).toHaveBeenCalled();
    });
  });

  describe('GET /configuration/profiles', () => {
    it('should return profiles', () => {
      const result = controller.getProfiles();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should call service.getProfiles', () => {
      controller.getProfiles();
      expect(mockService.getProfiles).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /configuration/snapshots', () => {
    it('should return snapshots', () => {
      const result = controller.getSnapshots();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('GET /configuration/history', () => {
    it('should return history with defaults', () => {
      const result = controller.getHistory({});
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
    });

    it('should pass custom limit and offset', () => {
      controller.getHistory({ limit: 10, offset: 5 });
      expect(mockService.getHistory).toHaveBeenCalledWith(10, 5);
    });
  });

  describe('GET /configuration/statistics', () => {
    it('should return statistics', () => {
      const result = controller.getStatistics();
      expect(result.success).toBe(true);
      expect(result.data.totalDomains).toBe(14);
    });
  });

  describe('GET /configuration/:domain', () => {
    it('should return domain config', () => {
      const result = controller.getDomain({ domain: 'technical' });
      expect(result.success).toBe(true);
      expect(result.data.domain).toBe('technical');
    });

    it('should throw for invalid domain', () => {
      expect(() => controller.getDomain({ domain: 'invalid' })).toThrow(BadRequestException);
    });

    it('should accept all valid domains', () => {
      const validDomains = [
        'technical', 'financial', 'smart_money', 'opportunity', 'candidate',
        'confluence', 'elite_score', 'workflow', 'scheduler', 'providers',
        'scanner', 'backtest', 'benchmark', 'performance_monitor',
      ];
      for (const d of validDomains) {
        const result = controller.getDomain({ domain: d });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('POST /configuration/:domain/value', () => {
    it('should update a value', () => {
      const result = controller.setValue(
        { domain: 'technical' },
        { key: 'rsiPeriod', value: 21 },
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('rsiPeriod');
      expect(result.version).toBe(1);
    });

    it('should throw for invalid domain', () => {
      expect(() => controller.setValue(
        { domain: 'bad' },
        { key: 'rsiPeriod', value: 21 },
      )).toThrow(BadRequestException);
    });

    it('should pass user and comment', () => {
      controller.setValue(
        { domain: 'technical' },
        { key: 'rsiPeriod', value: 21, user: 'admin', comment: 'test' },
      );
      expect(mockService.setValue).toHaveBeenCalledWith('technical', 'rsiPeriod', 21, 'admin', 'test');
    });
  });

  describe('POST /configuration/reset', () => {
    it('should reset all', () => {
      const result = controller.resetAll();
      expect(result.success).toBe(true);
      expect(result.message).toContain('reset');
    });

    it('should call service.resetAll', () => {
      controller.resetAll();
      expect(mockService.resetAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /configuration/reset/:domain', () => {
    it('should reset a domain', () => {
      const result = controller.resetDomain({ domain: 'technical' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('technical');
    });

    it('should throw for invalid domain', () => {
      expect(() => controller.resetDomain({ domain: 'bad' })).toThrow(BadRequestException);
    });
  });

  describe('POST /configuration/profile/load/:id', () => {
    it('should load a profile', () => {
      const result = controller.loadProfile({ id: 'profile-default' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('loaded');
    });

    it('should throw when profile not found', () => {
      mockService.loadProfile.mockReturnValue(false);
      expect(() => controller.loadProfile({ id: 'nonexistent' })).toThrow(NotFoundException);
    });
  });

  describe('POST /configuration/profile/create', () => {
    it('should create a profile', () => {
      const result = controller.createProfile({ name: 'custom', label: 'Custom', description: 'Test' });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('custom');
    });

    it('should call service.createProfile', () => {
      controller.createProfile({ name: 'x', label: 'X' });
      expect(mockService.createProfile).toHaveBeenCalledWith('x', 'X', undefined);
    });
  });

  describe('POST /configuration/profile/duplicate/:id', () => {
    it('should duplicate a profile', () => {
      const result = controller.duplicateProfile(
        { id: 'profile-default' },
        { newName: 'dup', newLabel: 'Dup' },
      );
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('dup');
    });

    it('should throw when source not found', () => {
      mockService.duplicateProfile.mockReturnValue(null);
      expect(() => controller.duplicateProfile(
        { id: 'nonexistent' },
        { newName: 'dup', newLabel: 'Dup' },
      )).toThrow(NotFoundException);
    });
  });

  describe('DELETE /configuration/profile/:id', () => {
    it('should delete a profile', () => {
      const result = controller.deleteProfile({ id: 'profile-new' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted');
    });

    it('should throw when profile not found', () => {
      mockService.deleteProfile.mockReturnValue(false);
      expect(() => controller.deleteProfile({ id: 'nonexistent' })).toThrow(NotFoundException);
    });
  });

  describe('POST /configuration/snapshot/create', () => {
    it('should create a snapshot', () => {
      const result = controller.createSnapshot({ comment: 'Test', user: 'admin' });
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('snap-1');
    });

    it('should call service.createSnapshot', () => {
      controller.createSnapshot({ comment: 'Test' });
      expect(mockService.createSnapshot).toHaveBeenCalledWith('Test', undefined);
    });
  });

  describe('POST /configuration/snapshot/rollback/:id', () => {
    it('should rollback to snapshot', () => {
      const result = controller.rollbackSnapshot({ id: 'snap-1' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('rolled back');
    });

    it('should throw when snapshot not found', () => {
      mockService.rollbackSnapshot.mockReturnValue(false);
      expect(() => controller.rollbackSnapshot({ id: 'nonexistent' })).toThrow(NotFoundException);
    });
  });
});
