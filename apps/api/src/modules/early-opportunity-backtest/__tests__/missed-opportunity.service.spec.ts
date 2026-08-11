import { MissedOpportunityService } from '../missed-opportunity.service';

describe('MissedOpportunityService', () => {
  let service: MissedOpportunityService;

  beforeEach(() => {
    service = new MissedOpportunityService();
  });

  it('should identify missed opportunities with high later return and low score', () => {
    const laterReturns = [
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15', laterReturn: 25 },
    ];
    const decisions = [
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15', score: 30, confidence: 25 },
    ];
    const result = service.identify(laterReturns, decisions);
    expect(result.totalMissed).toBe(1);
    expect(result.missedOpportunities[0].filterFailures).toContain('Düşük karar skoru');
  });

  it('should return empty when no opportunities missed', () => {
    const laterReturns = [
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15', laterReturn: 5 },
    ];
    const decisions = [
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15', score: 80, confidence: 75 },
    ];
    const result = service.identify(laterReturns, decisions);
    expect(result.totalMissed).toBe(0);
  });

  it('should handle missing decisions', () => {
    const laterReturns = [
      { ticker: 'THYAO.IS', decisionDate: '2024-01-15', laterReturn: 20 },
    ];
    const result = service.identify(laterReturns, []);
    expect(result.totalMissed).toBe(1);
    expect(result.missedOpportunities[0].filterFailures).toContain('Karar üretilmedi');
  });
});