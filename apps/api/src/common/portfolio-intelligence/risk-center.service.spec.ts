import { RiskCenterService } from './risk-center.service';
import { RiskLevel } from './types';

describe('RiskCenterService', () => {
  let service: RiskCenterService;

  beforeEach(() => {
    service = new RiskCenterService();
  });

  describe('getRiskWidget', () => {
    it('should return widget with correct structure', () => {
      const result = service.getRiskWidget({
        overallRiskScore: 45,
        sectorExposures: [{ sector: 'Bankacilik', weight: 30 }],
        maxDrawdown: 15,
        currentDrawdown: 5,
        volatility: 18,
        liquidityRiskLevel: RiskLevel.LOW,
        timeframeConflicts: 1,
        regimeRiskLevel: RiskLevel.MEDIUM,
      });

      expect(result).toHaveProperty('overallRiskScore');
      expect(result).toHaveProperty('overallRiskLevel');
      expect(result).toHaveProperty('riskMetrics');
      expect(result).toHaveProperty('sectorConcentration');
      expect(result).toHaveProperty('maxDrawdown');
      expect(result).toHaveProperty('currentDrawdown');
      expect(result).toHaveProperty('volatility');
      expect(result).toHaveProperty('liquidityRisk');
      expect(result).toHaveProperty('timeframeConflicts');
      expect(result).toHaveProperty('regimeRisk');
      expect(result).toHaveProperty('riskAlerts');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should set overallRiskLevel from score', () => {
      const low = service.getRiskWidget({
        overallRiskScore: 20, sectorExposures: [], maxDrawdown: 0, currentDrawdown: 0,
        volatility: 5, liquidityRiskLevel: RiskLevel.LOW, timeframeConflicts: 0, regimeRiskLevel: RiskLevel.LOW,
      });
      expect(low.overallRiskLevel).toBe(RiskLevel.LOW);

      const critical = service.getRiskWidget({
        overallRiskScore: 90, sectorExposures: [], maxDrawdown: 30, currentDrawdown: 20,
        volatility: 40, liquidityRiskLevel: RiskLevel.CRITICAL, timeframeConflicts: 5, regimeRiskLevel: RiskLevel.CRITICAL,
      });
      expect(critical.overallRiskLevel).toBe(RiskLevel.CRITICAL);
    });

    it('should build risk metrics array', () => {
      const result = service.getRiskWidget({
        overallRiskScore: 50,
        sectorExposures: [],
        maxDrawdown: 10,
        currentDrawdown: 5,
        volatility: 20,
        liquidityRiskLevel: RiskLevel.MEDIUM,
        timeframeConflicts: 2,
        regimeRiskLevel: RiskLevel.MEDIUM,
      });

      expect(result.riskMetrics.length).toBeGreaterThanOrEqual(5);
    });

    it('should build sector concentration', () => {
      const result = service.getRiskWidget({
        overallRiskScore: 30,
        sectorExposures: [
          { sector: 'Bankacilik', weight: 35 },
          { sector: 'Teknoloji', weight: 15 },
        ],
        maxDrawdown: 10, currentDrawdown: 3, volatility: 15,
        liquidityRiskLevel: RiskLevel.LOW, timeframeConflicts: 0, regimeRiskLevel: RiskLevel.LOW,
      });

      expect(result.sectorConcentration).toHaveLength(2);
      expect(result.sectorConcentration[0].riskLevel).toBe(RiskLevel.HIGH);
      expect(result.sectorConcentration[1].riskLevel).toBe(RiskLevel.LOW);
    });

    it('should include risk alerts', () => {
      const result = service.getRiskWidget({
        overallRiskScore: 70,
        sectorExposures: [],
        maxDrawdown: 20, currentDrawdown: 15, volatility: 30,
        liquidityRiskLevel: RiskLevel.HIGH, timeframeConflicts: 3, regimeRiskLevel: RiskLevel.HIGH,
        riskAlerts: ['Cekilme siniri asildi'],
      });

      expect(result.riskAlerts).toContain('Cekilme siniri asildi');
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate composite risk score', () => {
      const score = service.calculateRiskScore({
        drawdown: 10,
        volatility: 20,
        concentration: 30,
        liquidityRisk: RiskLevel.LOW,
        regimeRisk: RiskLevel.MEDIUM,
        conflicts: 1,
      });

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return higher score for worse conditions', () => {
      const good = service.calculateRiskScore({
        drawdown: 2, volatility: 5, concentration: 10,
        liquidityRisk: RiskLevel.LOW, regimeRisk: RiskLevel.LOW, conflicts: 0,
      });

      const bad = service.calculateRiskScore({
        drawdown: 20, volatility: 35, concentration: 50,
        liquidityRisk: RiskLevel.HIGH, regimeRisk: RiskLevel.HIGH, conflicts: 4,
      });

      expect(bad).toBeGreaterThan(good);
    });
  });

  describe('getRiskLevelFromScore', () => {
    it('should return LOW for score <= 30', () => {
      expect(service.getRiskLevelFromScore(25)).toBe(RiskLevel.LOW);
      expect(service.getRiskLevelFromScore(30)).toBe(RiskLevel.LOW);
    });

    it('should return MEDIUM for score 31-55', () => {
      expect(service.getRiskLevelFromScore(45)).toBe(RiskLevel.MEDIUM);
    });

    it('should return HIGH for score 56-80', () => {
      expect(service.getRiskLevelFromScore(70)).toBe(RiskLevel.HIGH);
    });

    it('should return CRITICAL for score > 80', () => {
      expect(service.getRiskLevelFromScore(85)).toBe(RiskLevel.CRITICAL);
    });
  });

  describe('detectConcentrationRisk', () => {
    it('should detect high concentration', () => {
      const results = service.detectConcentrationRisk([
        { sector: 'Bankacilik', weight: 45 },
        { sector: 'Teknoloji', weight: 10 },
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].sector).toBe('Bankacilik');
      expect(results[0].risk).toBe(RiskLevel.CRITICAL);
    });

    it('should detect medium concentration', () => {
      const results = service.detectConcentrationRisk([
        { sector: 'Sanayi', weight: 18 },
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].risk).toBe(RiskLevel.MEDIUM);
    });

    it('should return empty for well-diversified', () => {
      const results = service.detectConcentrationRisk([
        { sector: 'A', weight: 10 },
        { sector: 'B', weight: 10 },
        { sector: 'C', weight: 10 },
      ]);

      expect(results).toHaveLength(0);
    });
  });
});
