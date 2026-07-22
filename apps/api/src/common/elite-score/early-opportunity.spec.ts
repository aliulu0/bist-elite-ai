import { EarlyOpportunityDetector } from './early-opportunity.service';

describe('EarlyOpportunityDetector', () => {
  let detector: EarlyOpportunityDetector;

  beforeEach(() => {
    detector = new EarlyOpportunityDetector();
  });

  describe('detect', () => {
    it('should return base score for average inputs', () => {
      const result = detector.detect({
        signalFreshness: 0.5,
        confirmationLevel: 0.5,
        timeSinceDetection: 48,
        competitorConfirmation: 0.3,
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.description).toBeDefined();
    });

    it('should give high bonus for fresh signal detected recently', () => {
      const result = detector.detect({
        signalFreshness: 0.9,
        confirmationLevel: 0.8,
        timeSinceDetection: 6,
        competitorConfirmation: 0.1,
      });
      expect(result.freshnessBonus).toBeGreaterThan(10);
      expect(result.earlyDetectionBonus).toBeGreaterThanOrEqual(10);
      expect(result.score).toBeGreaterThan(60);
    });

    it('should penalize low confirmation level', () => {
      const result = detector.detect({
        signalFreshness: 0.5,
        confirmationLevel: 0.2,
        timeSinceDetection: 24,
        competitorConfirmation: 0.1,
      });
      expect(result.confirmationPenalty).toBeLessThan(0);
    });

    it('should penalize high competitor confirmation', () => {
      const result = detector.detect({
        signalFreshness: 0.5,
        confirmationLevel: 0.7,
        timeSinceDetection: 24,
        competitorConfirmation: 0.9,
      });
      expect(result.confirmationPenalty).toBeLessThan(0);
    });

    it('should give decreasing bonus as time increases', () => {
      const early = detector.detect({
        signalFreshness: 0.8,
        confirmationLevel: 0.7,
        timeSinceDetection: 6,
        competitorConfirmation: 0.2,
      });
      const late = detector.detect({
        signalFreshness: 0.8,
        confirmationLevel: 0.7,
        timeSinceDetection: 72,
        competitorConfirmation: 0.2,
      });
      expect(early.earlyDetectionBonus).toBeGreaterThan(late.earlyDetectionBonus);
    });

    it('should clamp score between 0 and 100', () => {
      const result = detector.detect({
        signalFreshness: 1.0,
        confirmationLevel: 1.0,
        timeSinceDetection: 1,
        competitorConfirmation: 0,
      });
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should generate Turkish description', () => {
      const result = detector.detect({
        signalFreshness: 0.9,
        confirmationLevel: 0.8,
        timeSinceDetection: 6,
        competitorConfirmation: 0.1,
      });
      expect(result.description).toContain('Taze sinyal');
    });

    it('should generate description for stale signal', () => {
      const result = detector.detect({
        signalFreshness: 0.2,
        confirmationLevel: 0.3,
        timeSinceDetection: 96,
        competitorConfirmation: 0.5,
      });
      expect(result.description).toContain('Onay seviyesi');
    });
  });
});
