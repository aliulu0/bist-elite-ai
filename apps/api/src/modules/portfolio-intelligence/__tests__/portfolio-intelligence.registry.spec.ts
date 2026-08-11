import { PortfolioIntelligenceRegistry } from '../portfolio-intelligence.registry';

describe('PortfolioIntelligenceRegistry', () => {
  let registry: PortfolioIntelligenceRegistry;

  beforeEach(() => {
    registry = new PortfolioIntelligenceRegistry();
  });

  describe('positions', () => {
    it('upserts and retrieves a position with normalized ticker', () => {
      const stored = registry.upsertPosition({ ticker: 'thyao', quantity: 100, averageCost: 100 });
      expect(stored.ticker).toBe('THYAO');
      expect(registry.getPosition('THYAO')?.quantity).toBe(100);
      expect(registry.hasPosition('thyao')).toBe(true);
      expect(registry.countPositions()).toBe(1);
    });

    it('updates existing position on re-upsert', () => {
      registry.upsertPosition({ ticker: 'THYAO', quantity: 100, averageCost: 100 });
      const updated = registry.upsertPosition({ ticker: 'THYAO', quantity: 200, averageCost: 110 });
      expect(updated.quantity).toBe(200);
      expect(registry.getAllPositions()).toHaveLength(1);
    });

    it('removes a position', () => {
      registry.upsertPosition({ ticker: 'THYAO', quantity: 100, averageCost: 100 });
      expect(registry.removePosition('thyao')).toBe(true);
      expect(registry.getPosition('THYAO')).toBeNull();
      expect(registry.removePosition('THYAO')).toBe(false);
    });

    it('lists all positions', () => {
      registry.upsertPosition({ ticker: 'THYAO', quantity: 1, averageCost: 10 });
      registry.upsertPosition({ ticker: 'PGSUS', quantity: 2, averageCost: 20 });
      expect(registry.getAllPositions()).toHaveLength(2);
    });
  });

  describe('snapshots', () => {
    it('saves and retrieves latest snapshot', () => {
      registry.saveSnapshot({
        generatedAt: '2025-01-01T00:00:00.000Z',
        score: 80,
        statusKey: 'STRONG',
        statusLabel: 'GÜÇLÜ',
        totalValue: 10000,
        positionScores: { THYAO: 75 },
        positionStatuses: { THYAO: 'HOLD' },
      });
      const latest = registry.getLatestSnapshot();
      expect(latest).not.toBeNull();
      expect(latest?.score).toBe(80);
      expect(latest?.id).toBeDefined();
    });

    it('returns history of snapshots', () => {
      registry.saveSnapshot({
        generatedAt: '2025-01-01T00:00:00.000Z',
        score: 60,
        statusKey: 'BALANCED',
        statusLabel: 'DENGELİ',
        totalValue: 1000,
        positionScores: { THYAO: 60 },
        positionStatuses: { THYAO: 'HOLD' },
      });
      registry.saveSnapshot({
        generatedAt: '2025-01-02T00:00:00.000Z',
        score: 70,
        statusKey: 'STRONG',
        statusLabel: 'GÜÇLÜ',
        totalValue: 1200,
        positionScores: { THYAO: 75 },
        positionStatuses: { THYAO: 'STRONG_HOLD' },
      });
      expect(registry.getHistory()).toHaveLength(2);
    });

    it('compares snapshots', () => {
      registry.saveSnapshot({
        generatedAt: '2025-01-01T00:00:00.000Z',
        score: 60,
        statusKey: 'BALANCED',
        statusLabel: 'DENGELİ',
        totalValue: 1000,
        positionScores: { THYAO: 60, PGSUS: 50 },
        positionStatuses: { THYAO: 'HOLD', PGSUS: 'HOLD' },
      });
      registry.saveSnapshot({
        generatedAt: '2025-01-02T00:00:00.000Z',
        score: 70,
        statusKey: 'STRONG',
        statusLabel: 'GÜÇLÜ',
        totalValue: 1200,
        positionScores: { THYAO: 75, PGSUS: 40 },
        positionStatuses: { THYAO: 'STRONG_HOLD', PGSUS: 'HOLD' },
      });
      const comparison = registry.compareSnapshots();
      expect(comparison).not.toBeNull();
      expect(comparison?.scoreChange).toBe(10);
      expect(comparison?.improvingPositions).toContainEqual({ ticker: 'THYAO', change: 15 });
      expect(comparison?.deterioratingPositions).toContainEqual({ ticker: 'PGSUS', change: -10 });
    });

    it('returns null comparison when fewer than 2 snapshots', () => {
      expect(registry.compareSnapshots()).toBeNull();
      registry.saveSnapshot({
        generatedAt: '2025-01-01T00:00:00.000Z',
        score: 60,
        statusKey: 'BALANCED',
        statusLabel: 'DENGELİ',
        totalValue: 1000,
        positionScores: {},
        positionStatuses: {},
      });
      expect(registry.compareSnapshots()).toBeNull();
    });

    it('clears snapshots', () => {
      registry.saveSnapshot({
        generatedAt: '2025-01-01T00:00:00.000Z',
        score: 60,
        statusKey: 'BALANCED',
        statusLabel: 'DENGELİ',
        totalValue: 1000,
        positionScores: {},
        positionStatuses: {},
      });
      registry.clearSnapshots();
      expect(registry.getHistory()).toHaveLength(0);
    });
  });
});
