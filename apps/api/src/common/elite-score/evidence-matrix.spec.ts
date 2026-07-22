import { EvidenceMatrixService } from './evidence-matrix.service';
import { WeightManager } from './weight-manager.service';
import { ScoringProfile } from './types';

describe('EvidenceMatrixService', () => {
  let service: EvidenceMatrixService;
  let weightManager: WeightManager;

  beforeEach(() => {
    weightManager = new WeightManager();
    service = new EvidenceMatrixService(weightManager);
  });

  describe('generate', () => {
    it('should generate matrix entries for all components', () => {
      const entries = service.generate(
        { technical: 70, trend: 65, momentum: 60 },
        ScoringProfile.BALANCED,
      );
      expect(entries.length).toBeGreaterThan(0);
    });

    it('should calculate contribution for each entry', () => {
      const entries = service.generate(
        { technical: 80 },
        ScoringProfile.BALANCED,
      );
      const techEntry = entries.find(e => e.component === 'technical');
      expect(techEntry).toBeDefined();
      expect(techEntry!.contribution).toBeGreaterThan(0);
    });

    it('should sort entries by contribution descending', () => {
      const entries = service.generate(
        { technical: 90, momentum: 30, trend: 60 },
        ScoringProfile.BALANCED,
      );
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].contribution).toBeLessThanOrEqual(entries[i - 1].contribution);
      }
    });

    it('should use custom labels when provided', () => {
      const entries = service.generate(
        { technical: 70 },
        ScoringProfile.BALANCED,
        { technical: 'Teknik Analiz' },
      );
      expect(entries[0].component).toBe('Teknik Analiz');
    });

    it('should calculate confidence based on distance from 50', () => {
      const entries = service.generate(
        { technical: 90 },
        ScoringProfile.BALANCED,
      );
      expect(entries[0].confidence).toBeGreaterThan(0);
    });
  });

  describe('calculateTotalContribution', () => {
    it('should sum all contributions', () => {
      const entries = service.generate(
        { technical: 70, trend: 60, momentum: 50 },
        ScoringProfile.BALANCED,
      );
      const total = service.calculateTotalContribution(entries);
      expect(total).toBeGreaterThan(0);
    });
  });

  describe('getTopContributors', () => {
    it('should return top N contributors', () => {
      const entries = service.generate(
        { technical: 90, trend: 60, momentum: 30 },
        ScoringProfile.BALANCED,
      );
      const top = service.getTopContributors(entries, 2);
      expect(top.length).toBe(2);
    });

    it('should return all if limit exceeds entries', () => {
      const entries = service.generate(
        { technical: 70 },
        ScoringProfile.BALANCED,
      );
      const top = service.getTopContributors(entries, 20);
      expect(top.length).toBe(entries.length);
    });
  });

  describe('getWeakestContributors', () => {
    it('should return weakest N contributors', () => {
      const entries = service.generate(
        { technical: 90, trend: 30, momentum: 20 },
        ScoringProfile.BALANCED,
      );
      const weakest = service.getWeakestContributors(entries, 2);
      expect(weakest.length).toBe(2);
      expect(weakest[0].contribution).toBeLessThanOrEqual(weakest[1].contribution);
    });
  });
});
