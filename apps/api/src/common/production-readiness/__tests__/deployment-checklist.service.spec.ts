import { DeploymentChecklistService } from '../deployment-checklist.service';
import { AppLoggerService } from '../../logger/logger.service';
import { ReadinessStatus, ChecklistPhase } from '../types';

jest.mock('../../logger/logger.service', () => ({
  AppLoggerService: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('DeploymentChecklistService', () => {
  let service: DeploymentChecklistService;

  beforeEach(() => {
    service = new DeploymentChecklistService(new AppLoggerService(null as never));
  });

  describe('generate', () => {
    it('should generate pre-deployment checklist', () => {
      const result = service.generate(ChecklistPhase.PRE_DEPLOYMENT);
      expect(result.phase).toBe(ChecklistPhase.PRE_DEPLOYMENT);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalItems).toBe(result.items.length);
    });

    it('should generate deployment checklist', () => {
      const result = service.generate(ChecklistPhase.DEPLOYMENT);
      expect(result.phase).toBe(ChecklistPhase.DEPLOYMENT);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should generate post-deployment checklist', () => {
      const result = service.generate(ChecklistPhase.POST_DEPLOYMENT);
      expect(result.phase).toBe(ChecklistPhase.POST_DEPLOYMENT);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should generate rollback checklist', () => {
      const result = service.generate(ChecklistPhase.ROLLBACK);
      expect(result.phase).toBe(ChecklistPhase.ROLLBACK);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should have mandatory items', () => {
      const result = service.generate(ChecklistPhase.PRE_DEPLOYMENT);
      expect(result.mandatoryItems).toBeGreaterThan(0);
    });

    it('should default to pre-deployment phase', () => {
      const result = service.generate();
      expect(result.phase).toBe(ChecklistPhase.PRE_DEPLOYMENT);
    });

    it('should track completed items', () => {
      const result = service.generate(ChecklistPhase.PRE_DEPLOYMENT);
      expect(result.completedItems).toBe(0);
      expect(result.completedMandatory).toBe(0);
    });

    it('should include timestamp', () => {
      const result = service.generate();
      expect(result.timestamp).toBeDefined();
    });

    it('should categorize items', () => {
      const result = service.generate(ChecklistPhase.PRE_DEPLOYMENT);
      const categories = [...new Set(result.items.map((i) => i.category))];
      expect(categories.length).toBeGreaterThan(1);
    });
  });

  describe('generateAll', () => {
    it('should generate all four phases', () => {
      const all = service.generateAll();
      expect(Object.keys(all)).toHaveLength(4);
      expect(all[ChecklistPhase.PRE_DEPLOYMENT]).toBeDefined();
      expect(all[ChecklistPhase.DEPLOYMENT]).toBeDefined();
      expect(all[ChecklistPhase.POST_DEPLOYMENT]).toBeDefined();
      expect(all[ChecklistPhase.ROLLBACK]).toBeDefined();
    });
  });
});
