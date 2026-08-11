import { ScoreCalculator } from './services/score-calculator.service';
import { PriorityEngine } from './services/priority-engine.service';
import { AgeTracker } from './services/age-tracker.service';
import { DuplicateDetector } from './services/duplicate-detector.service';
import { ConfirmationEngine } from './services/confirmation-engine.service';
import { PenaltyEngine } from './services/penalty-engine.service';
import { ExplanationEngine } from './services/explanation-engine.service';
import { MetricsCollector } from './services/metrics-collector.service';
import { DEFAULT_DETECTION_MODULE_WEIGHTS, DEFAULT_PENALTY_CONFIG, DEFAULT_CONFIRMATION_CONFIG, DEFAULT_AGE_CONFIG, DEFAULT_PRIORITY_THRESHOLDS } from './opportunity-detection.config';
import { buildModuleResult, buildHistory } from './test-helpers';

describe('ScoreCalculator', () => {
  const calc = new ScoreCalculator();

  it('should return 0 for empty results', () => {
    expect(calc.calculateWeightedScore([], DEFAULT_DETECTION_MODULE_WEIGHTS)).toBe(0);
  });

  it('should calculate weighted average', () => {
    const results = [
      buildModuleResult({ module: 'priceStructure', score: 80 }),
      buildModuleResult({ module: 'volumeBehaviour', score: 60 }),
    ];
    const score = calc.calculateWeightedScore(results, DEFAULT_DETECTION_MODULE_WEIGHTS);
    expect(score).toBeGreaterThan(60);
    expect(score).toBeLessThan(80);
  });

  it('should apply penalties reducing score', () => {
    const penalties = [{ type: 'TEST', amount: 15, reason: 'test', module: 'test' }];
    const result = calc.applyPenalties(80, penalties);
    expect(result).toBe(65);
  });

  it('should not go below 0', () => {
    const penalties = [{ type: 'TEST', amount: 200, reason: 'test', module: 'test' }];
    expect(calc.applyPenalties(50, penalties)).toBe(0);
  });

  it('should not go above 100', () => {
    expect(calc.applyPenalties(110, [])).toBe(100);
  });
});

describe('PriorityEngine', () => {
  const engine = new PriorityEngine();

  it('should return CRITICAL for high composite', () => {
    expect(engine.calculate(90, 90, 10, 100, 100, DEFAULT_PRIORITY_THRESHOLDS)).toBe('CRITICAL');
  });

  it('should return IGNORE for very low scores', () => {
    expect(engine.calculate(10, 10, 90, 20, 0, DEFAULT_PRIORITY_THRESHOLDS)).toBe('IGNORE');
  });

  it('should return HIGH for good scores', () => {
    expect(engine.calculate(75, 75, 20, 80, 80, DEFAULT_PRIORITY_THRESHOLDS)).toBe('HIGH');
  });

  it('should return MEDIUM for moderate scores', () => {
    expect(engine.calculate(55, 60, 40, 60, 60, DEFAULT_PRIORITY_THRESHOLDS)).toBe('MEDIUM');
  });

  it('should return LOW for below-medium scores', () => {
    expect(engine.calculate(35, 40, 50, 40, 30, DEFAULT_PRIORITY_THRESHOLDS)).toBe('LOW');
  });

  it('should calculate composite score correctly', () => {
    const composite = engine.calculateCompositeScore(80, 80, 20, 100, 90);
    expect(composite).toBeGreaterThan(60);
    expect(composite).toBeLessThanOrEqual(100);
  });

  it('should have descriptions for all priorities', () => {
    expect(engine.getPriorityDescription('CRITICAL')).toBeTruthy();
    expect(engine.getPriorityDescription('HIGH')).toBeTruthy();
    expect(engine.getPriorityDescription('MEDIUM')).toBeTruthy();
    expect(engine.getPriorityDescription('LOW')).toBeTruthy();
    expect(engine.getPriorityDescription('IGNORE')).toBeTruthy();
  });
});

describe('AgeTracker', () => {
  const tracker = new AgeTracker();

  it('should return NEW for empty history', () => {
    expect(tracker.determineAge([], DEFAULT_AGE_CONFIG)).toBe('NEW');
  });

  it('should return GROWING for increasing scores', () => {
    const history = [
      { timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), score: 50, level: 'WATCH' as const, priority: 'LOW' as const },
      { timestamp: new Date().toISOString(), score: 60, level: 'EMERGING' as const, priority: 'MEDIUM' as const },
    ];
    expect(tracker.determineAge(history, DEFAULT_AGE_CONFIG)).toBe('GROWING');
  });

  it('should return WEAKENING for decreasing scores', () => {
    const history = [
      { timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), score: 70, level: 'STRONG' as const, priority: 'HIGH' as const },
      { timestamp: new Date().toISOString(), score: 60, level: 'EMERGING' as const, priority: 'MEDIUM' as const },
    ];
    expect(tracker.determineAge(history, DEFAULT_AGE_CONFIG)).toBe('WEAKENING');
  });

  it('should return correct age factors', () => {
    expect(tracker.getAgeFactor('NEW')).toBe(100);
    expect(tracker.getAgeFactor('EXPIRED')).toBe(0);
  });

  it('should allow notification for new opportunity', () => {
    expect(tracker.shouldNotify('NEW', null, 60000)).toBe(true);
  });

  it('should not notify if within cooldown', () => {
    expect(tracker.shouldNotify('STABLE', Date.now() - 1000, 60000)).toBe(false);
  });

  it('should not notify expired', () => {
    expect(tracker.shouldNotify('EXPIRED', null, 60000)).toBe(false);
  });
});

describe('DuplicateDetector', () => {
  const detector = new DuplicateDetector();

  it('should not detect duplicate with empty history', () => {
    const result = detector.detect('THYAO', 70, []);
    expect(result.isDuplicate).toBe(false);
  });

  it('should detect duplicate with similar score in time window', () => {
    const history = [
      { timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), score: 69, level: 'EMERGING' as const, priority: 'MEDIUM' as const },
      { timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), score: 71, level: 'EMERGING' as const, priority: 'MEDIUM' as const },
    ];
    const result = detector.detect('THYAO', 70, history);
    expect(result.isDuplicate).toBe(true);
    expect(result.duplicateCount).toBeGreaterThan(0);
  });

  it('should not detect duplicate with different score', () => {
    const history = buildHistory(2, 40);
    const result = detector.detect('THYAO', 80, history);
    expect(result.isDuplicate).toBe(false);
  });

  it('should merge and limit history', () => {
    const entries = buildHistory(10, 50);
    const merged = detector.mergeEntries(entries, 5);
    expect(merged).toHaveLength(5);
  });
});

describe('ConfirmationEngine', () => {
  const engine = new ConfirmationEngine();

  it('should return NONE for no confirming modules', () => {
    const results = [
      buildModuleResult({ module: 'a', score: 30, confidence: 40 }),
      buildModuleResult({ module: 'b', score: 20, confidence: 30 }),
    ];
    const { level, count } = engine.calculate(results, DEFAULT_CONFIRMATION_CONFIG);
    expect(level).toBe('NONE');
    expect(count).toBe(0);
  });

  it('should return SINGLE for 2 confirming modules', () => {
    const results = [
      buildModuleResult({ module: 'a', score: 65, confidence: 60 }),
      buildModuleResult({ module: 'b', score: 70, confidence: 55 }),
    ];
    const { level, count } = engine.calculate(results, DEFAULT_CONFIRMATION_CONFIG);
    expect(level).toBe('SINGLE');
    expect(count).toBe(2);
  });

  it('should return correct confirmation score', () => {
    expect(engine.getConfirmationScore('NONE')).toBe(0);
    expect(engine.getConfirmationScore('SINGLE')).toBe(20);
    expect(engine.getConfirmationScore('DOUBLE')).toBe(40);
    expect(engine.getConfirmationScore('TRIPLE')).toBe(60);
    expect(engine.getConfirmationScore('MULTI')).toBe(80);
  });
});

describe('PenaltyEngine', () => {
  const engine = new PenaltyEngine();

  it('should penalize low aggregation quality', () => {
    const penalties = engine.calculate([], DEFAULT_PENALTY_CONFIG, 30, 80);
    expect(penalties.some((p) => p.type === 'LOW_AGGREGATION_QUALITY')).toBe(true);
  });

  it('should penalize low provider confidence', () => {
    const penalties = engine.calculate([], DEFAULT_PENALTY_CONFIG, 80, 30);
    expect(penalties.some((p) => p.type === 'LOW_PROVIDER_CONFIDENCE')).toBe(true);
  });

  it('should penalize contradicting indicators', () => {
    const results = [
      buildModuleResult({ module: 'a', score: 80 }),
      buildModuleResult({ module: 'b', score: 20 }),
    ];
    const penalties = engine.calculate(results, DEFAULT_PENALTY_CONFIG, 80, 80);
    expect(penalties.some((p) => p.type === 'CONTRADICTING_INDICATORS')).toBe(true);
  });

  it('should penalize weak confirmations', () => {
    const results = [
      buildModuleResult({ module: 'a', score: 40 }),
    ];
    const penalties = engine.calculate(results, DEFAULT_PENALTY_CONFIG, 80, 80);
    expect(penalties.some((p) => p.type === 'WEAK_CONFIRMATIONS')).toBe(true);
  });

  it('should return no penalties for good inputs', () => {
    const results = [
      buildModuleResult({ module: 'fundamentalChange', score: 80 }),
      buildModuleResult({ module: 'a', score: 80 }),
      buildModuleResult({ module: 'b', score: 80 }),
    ];
    const penalties = engine.calculate(results, DEFAULT_PENALTY_CONFIG, 90, 90);
    expect(penalties.length).toBe(0);
  });
});

describe('ExplanationEngine', () => {
  const engine = new ExplanationEngine();

  it('should build explanation with all components', () => {
    const explanation = engine.buildExplanation(
      75, 'STRONG', ['MOMENTUM_BREAKOUT'], 'DOUBLE',
      ['Strength 1'], ['Weakness 1'],
      [{ type: 'TEST', amount: 5, reason: 'test', module: 'test' }],
    );
    expect(explanation).toContain('Strong opportunity');
    expect(explanation).toContain('STRONG');
    expect(explanation).toContain('MOMENTUM_BREAKOUT');
    expect(explanation).toContain('DOUBLE');
    expect(explanation).toContain('Strength 1');
    expect(explanation).toContain('Weakness 1');
    expect(explanation).toMatch(/\.$/);
  });

  it('should collect unique strengths', () => {
    const results = [
      buildModuleResult({ module: 'a', strengths: ['S1', 'S2'] }),
      buildModuleResult({ module: 'b', strengths: ['S1', 'S3'] }),
    ];
    const strengths = engine.collectStrengths(results);
    expect(strengths).toContain('S1');
    expect(strengths).toContain('S2');
    expect(strengths).toContain('S3');
    expect(strengths.filter((s) => s === 'S1')).toHaveLength(1);
  });

  it('should collect risks and warnings', () => {
    const results = [
      buildModuleResult({ module: 'a', risks: ['R1'], warnings: ['W1'] }),
      buildModuleResult({ module: 'b', risks: ['R2'], warnings: ['W2'] }),
    ];
    expect(engine.collectRisks(results)).toHaveLength(2);
    expect(engine.collectWarnings(results)).toHaveLength(2);
  });

  it('should build supporting metrics', () => {
    const results = [
      buildModuleResult({ module: 'a', metrics: { score: 75, value: 42 } }),
    ];
    const metrics = engine.buildSupportingMetrics(results);
    expect(metrics).toHaveLength(2);
    expect(metrics[0].module).toBe('a');
  });
});

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  it('should record detections', () => {
    collector.recordDetection('STRONG', 75, 80, 20);
    collector.recordDetection('EMERGING', 60, 70, 30);
    const metrics = collector.getMetrics(50, {});
    expect(metrics.detectionCount).toBe(2);
    expect(metrics.averageScore).toBe(67.5);
  });

  it('should record rejections', () => {
    collector.recordRejection();
    collector.recordRejection();
    const metrics = collector.getMetrics(10, {});
    expect(metrics.rejectedOpportunities).toBe(2);
  });

  it('should reset', () => {
    collector.recordDetection('STRONG', 75, 80, 20);
    collector.reset();
    const metrics = collector.getMetrics(10, {});
    expect(metrics.detectionCount).toBe(0);
  });
});
