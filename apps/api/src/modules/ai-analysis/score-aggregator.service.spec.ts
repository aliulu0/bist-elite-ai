import { ScoreAggregator } from './score-aggregator.service';
import { ModuleResult } from './ai-analysis.types';
import { DEFAULT_WEIGHTS } from './config/ai-analysis.config';

describe('ScoreAggregator', () => {
  let aggregator: ScoreAggregator;

  beforeEach(() => {
    aggregator = new ScoreAggregator();
  });

  describe('calculateOverallScore', () => {
    it('should return 0 for empty results', () => {
      expect(aggregator.calculateOverallScore([])).toBe(0);
    });

    it('should calculate weighted average from single module', () => {
      const results: ModuleResult[] = [
        { module: 'technical', score: 80, confidence: 90, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
      ];
      const score = aggregator.calculateOverallScore(results);
      expect(score).toBe(80);
    });

    it('should calculate weighted average from multiple modules', () => {
      const results: ModuleResult[] = [
        { module: 'technical', score: 80, confidence: 90, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
        { module: 'fundamental', score: 60, confidence: 80, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
      ];
      const score = aggregator.calculateOverallScore(results);
      expect(score).toBeGreaterThan(60);
      expect(score).toBeLessThan(80);
    });

    it('should weight modules according to config', () => {
      const results: ModuleResult[] = [
        { module: 'technical', score: 100, confidence: 100, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
        { module: 'liquidity', score: 0, confidence: 100, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
      ];
      const score = aggregator.calculateOverallScore(results);
      expect(score).toBeGreaterThan(50);
    });

    it('should handle unknown module names gracefully', () => {
      const results: ModuleResult[] = [
        { module: 'unknown', score: 100, confidence: 100, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
      ];
      const score = aggregator.calculateOverallScore(results);
      expect(score).toBe(0);
    });

    it('should return weighted average proportional to scores', () => {
      const results: ModuleResult[] = [
        { module: 'technical', score: 200, confidence: 100, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
      ];
      const score = aggregator.calculateOverallScore(results);
      expect(score).toBe(200);
    });
  });

  describe('getModuleContributions', () => {
    it('should return contributions for each module', () => {
      const results: ModuleResult[] = [
        { module: 'technical', score: 80, confidence: 90, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
        { module: 'fundamental', score: 60, confidence: 80, signals: [], strengths: [], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
      ];
      const contributions = aggregator.getModuleContributions(results, DEFAULT_WEIGHTS);
      expect(contributions).toHaveLength(2);
      expect(contributions[0].module).toBe('technical');
      expect(contributions[0].weight).toBe(DEFAULT_WEIGHTS.technical);
    });

    it('should return empty for empty results', () => {
      expect(aggregator.getModuleContributions([], DEFAULT_WEIGHTS)).toEqual([]);
    });
  });
});
