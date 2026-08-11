import { ExplanationBuilder } from './explanation-builder.service';
import { ModuleResult } from './ai-analysis.types';

describe('ExplanationBuilder', () => {
  let builder: ExplanationBuilder;

  beforeEach(() => {
    builder = new ExplanationBuilder();
  });

  const mockModuleResults: ModuleResult[] = [
    {
      module: 'technical',
      score: 75,
      confidence: 85,
      signals: [],
      strengths: ['Strong market cap', 'Good sector position'],
      weaknesses: ['Low volume'],
      risks: ['Market volatility'],
      warnings: [],
      metrics: { marketCap: 500000000 },
      explanation: 'Strong technical position.',
      metadata: {},
    },
    {
      module: 'fundamental',
      score: 80,
      confidence: 90,
      signals: [],
      strengths: ['High gross margin', 'Positive net income'],
      weaknesses: [],
      risks: [],
      warnings: [],
      metrics: { grossMargin: 35, netMargin: 12 },
      explanation: 'Strong fundamental position.',
      metadata: {},
    },
  ];

  describe('buildExplanation', () => {
    it('should include score description', () => {
      const explanation = builder.buildExplanation(75, 'BUY', mockModuleResults);
      expect(explanation).toContain('Good overall analysis score');
    });

    it('should include key strengths', () => {
      const explanation = builder.buildExplanation(75, 'BUY', mockModuleResults);
      expect(explanation).toContain('Strong market cap');
    });

    it('should include key concerns', () => {
      const explanation = builder.buildExplanation(40, 'REDUCE', [
        { module: 'test', score: 40, confidence: 50, signals: [], strengths: [], weaknesses: ['High debt'], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
      ]);
      expect(explanation).toContain('High debt');
    });

    it('should end with period', () => {
      const explanation = builder.buildExplanation(50, 'NEUTRAL', []);
      expect(explanation).toMatch(/\.$/);
    });
  });

  describe('collectStrengths', () => {
    it('should collect unique strengths from all modules', () => {
      const strengths = builder.collectStrengths(mockModuleResults);
      expect(strengths).toContain('Strong market cap');
      expect(strengths).toContain('High gross margin');
    });

    it('should deduplicate strengths', () => {
      const results: ModuleResult[] = [
        { module: 'a', score: 0, confidence: 0, signals: [], strengths: ['Same strength'], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
        { module: 'b', score: 0, confidence: 0, signals: [], strengths: ['Same strength'], weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
      ];
      const strengths = builder.collectStrengths(results);
      expect(strengths.filter((s) => s === 'Same strength')).toHaveLength(1);
    });

    it('should limit to 10 items', () => {
      const manyStrengths = Array.from({ length: 15 }, (_, i) => `Strength ${i}`);
      const results: ModuleResult[] = [
        { module: 'a', score: 0, confidence: 0, signals: [], strengths: manyStrengths, weaknesses: [], risks: [], warnings: [], metrics: {}, explanation: '', metadata: {} },
      ];
      expect(builder.collectStrengths(results)).toHaveLength(10);
    });
  });

  describe('collectWeaknesses', () => {
    it('should collect unique weaknesses', () => {
      const weaknesses = builder.collectWeaknesses(mockModuleResults);
      expect(weaknesses).toContain('Low volume');
    });
  });

  describe('collectRisks', () => {
    it('should collect unique risks', () => {
      const risks = builder.collectRisks(mockModuleResults);
      expect(risks).toContain('Market volatility');
    });
  });

  describe('buildSupportingMetrics', () => {
    it('should build metrics from all modules', () => {
      const metrics = builder.buildSupportingMetrics(mockModuleResults);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.some((m) => m.name === 'marketCap')).toBe(true);
    });

    it('should include module name for each metric', () => {
      const metrics = builder.buildSupportingMetrics(mockModuleResults);
      for (const m of metrics) {
        expect(m.module).toBeTruthy();
      }
    });

    it('should include description for known metrics', () => {
      const metrics = builder.buildSupportingMetrics(mockModuleResults);
      const marketCapMetric = metrics.find((m) => m.name === 'marketCap');
      expect(marketCapMetric?.description).toBeTruthy();
    });
  });
});
