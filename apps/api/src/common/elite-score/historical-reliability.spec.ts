import { HistoricalReliabilityAnalyzer } from './historical-reliability.service';

describe('HistoricalReliabilityAnalyzer', () => {
  let analyzer: HistoricalReliabilityAnalyzer;

  beforeEach(() => {
    analyzer = new HistoricalReliabilityAnalyzer();
  });

  describe('analyze', () => {
    it('should return medium reliability for empty input', () => {
      const result = analyzer.analyze({});
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.overallReliability).toBeDefined();
    });

    it('should score high win rate positively', () => {
      const result = analyzer.analyze({ winRate: 75 });
      expect(result.winRateScore).toBeGreaterThanOrEqual(80);
    });

    it('should score low win rate negatively', () => {
      const result = analyzer.analyze({ winRate: 30 });
      expect(result.winRateScore).toBeLessThanOrEqual(40);
    });

    it('should score low drawdown positively', () => {
      const result = analyzer.analyze({ maxDrawdown: 3 });
      expect(result.drawdownScore).toBeGreaterThanOrEqual(80);
    });

    it('should score high drawdown negatively', () => {
      const result = analyzer.analyze({ maxDrawdown: 35 });
      expect(result.drawdownScore).toBeLessThanOrEqual(40);
    });

    it('should score positive returns', () => {
      const result = analyzer.analyze({ avgReturn: 15 });
      expect(result.returnScore).toBeGreaterThanOrEqual(70);
    });

    it('should score negative returns negatively', () => {
      const result = analyzer.analyze({ avgReturn: -10 });
      expect(result.returnScore).toBeLessThanOrEqual(40);
    });

    it('should score high Sharpe ratio positively', () => {
      const result = analyzer.analyze({ sharpeRatio: 2.5 });
      expect(result.consistencyScore).toBeGreaterThanOrEqual(60);
    });

    it('should score negative Sharpe ratio negatively', () => {
      const result = analyzer.analyze({ sharpeRatio: -0.5 });
      expect(result.consistencyScore).toBeLessThanOrEqual(50);
    });

    it('should score high profit factor positively', () => {
      const result = analyzer.analyze({ profitFactor: 3.5 });
      expect(result.profitFactorScore).toBeGreaterThanOrEqual(80);
    });

    it('should score low profit factor negatively', () => {
      const result = analyzer.analyze({ profitFactor: 0.5 });
      expect(result.profitFactorScore).toBeLessThanOrEqual(40);
    });

    it('should return appropriate reliability label', () => {
      const high = analyzer.analyze({
        winRate: 75,
        maxDrawdown: 3,
        avgReturn: 20,
        sharpeRatio: 2.5,
        profitFactor: 3.0,
      });
      expect(high.overallReliability).toContain('Yüksek');

      const low = analyzer.analyze({
        winRate: 25,
        maxDrawdown: 40,
        avgReturn: -15,
        sharpeRatio: -1,
        profitFactor: 0.4,
      });
      expect(low.overallReliability).toContain('Düşük');
    });
  });
});
