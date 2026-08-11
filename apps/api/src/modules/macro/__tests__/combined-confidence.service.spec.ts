import { CombinedConfidenceService } from '../combined-confidence.service';

describe('CombinedConfidenceService', () => {
  let service: CombinedConfidenceService;

  beforeEach(() => {
    service = new CombinedConfidenceService();
  });

  it('should combine confidence within 0-100 using default 50/50 weights', () => {
    const result = service.calculate(70, 60);
    expect(result.combined).toBe(65);
    expect(result.eliteConfidence).toBe(70);
    expect(result.macroConfidence).toBe(60);
    expect(result.weightElite).toBe(0.5);
    expect(result.weightMacro).toBe(0.5);
  });

  it('should accept elite confidence in 0-1 scale and normalize to 0-100', () => {
    const result = service.calculate(0.7, 60);
    expect(result.eliteConfidence).toBe(70);
    expect(result.combined).toBe(65);
  });

  it('should accept custom weights', () => {
    const result = service.calculate(80, 40, { weightElite: 0.6, weightMacro: 0.4 });
    expect(result.combined).toBe(64);
    expect(result.weightElite).toBe(0.6);
    expect(result.weightMacro).toBe(0.4);
  });

  it('should clamp the combined confidence to 0-100', () => {
    expect(service.calculate(100, 100).combined).toBe(100);
    expect(service.calculate(0, 0).combined).toBe(0);
  });

  it('should only merge confidence, never scores', () => {
    const result = service.calculate(90, 50);
    expect(result).not.toHaveProperty('macroScore');
    expect(result).not.toHaveProperty('eliteScore');
    expect(result).toHaveProperty('combined');
  });

  it('should always return a calculatedAt timestamp', () => {
    const result = service.calculate(70, 70);
    expect(typeof result.calculatedAt).toBe('string');
    expect(Date.parse(result.calculatedAt)).not.toBeNaN();
  });
});
