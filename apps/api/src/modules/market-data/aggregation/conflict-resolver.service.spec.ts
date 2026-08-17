import { ConflictResolver } from './conflict-resolver.service';

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  describe('resolve', () => {
    it('should return null for empty sources', () => {
      expect(resolver.resolve('field', [])).toBeNull();
    });

    it('should return single source', () => {
      const result = resolver.resolve('name', [
        {
          provider: 'fintables',
          value: 'Turkish Airlines',
          priority: 1,
          timestamp: '2026-01-01T00:00:00Z',
        },
      ]);
      expect(result).toEqual({ value: 'Turkish Airlines', resolution: 'single_source' });
    });

    it('should use majority vote when available', () => {
      const result = resolver.resolve('sector', [
        {
          provider: 'fintables',
          value: 'Aviation',
          priority: 1,
          timestamp: '2026-01-01T00:00:00Z',
        },
        {
          provider: 'yahoo',
          value: 'Transportation',
          priority: 2,
          timestamp: '2026-01-01T00:00:00Z',
        },
        { provider: 'kap', value: 'Aviation', priority: 3, timestamp: '2026-01-01T00:00:00Z' },
      ]);
      expect(result).not.toBeNull();
      expect(result!.value).toBe('Aviation');
      expect(result!.resolution).toBe('majority');
    });

    it('should prefer latest timestamp when no majority', () => {
      const result = resolver.resolve('name', [
        {
          provider: 'fintables',
          value: 'THY A.O.',
          priority: 1,
          timestamp: '2026-01-01T00:00:00Z',
        },
        {
          provider: 'yahoo',
          value: 'Turk Hava Yollari',
          priority: 2,
          timestamp: '2026-06-01T00:00:00Z',
        },
      ]);
      expect(result).not.toBeNull();
      expect(result!.value).toBe('Turk Hava Yollari');
      expect(result!.resolution).toBe('latest_timestamp');
    });

    it('should skip null/undefined/empty values', () => {
      const result = resolver.resolve('name', [
        { provider: 'fintables', value: null, priority: 1, timestamp: '2026-01-01T00:00:00Z' },
        { provider: 'yahoo', value: undefined, priority: 2, timestamp: '2026-01-01T00:00:00Z' },
        { provider: 'kap', value: '', priority: 3, timestamp: '2026-01-01T00:00:00Z' },
      ]);
      expect(result).toBeNull();
    });

    it('should fall back to earliest timestamp when timestamps are equal', () => {
      const result = resolver.resolve('name', [
        { provider: 'kap', value: 'KAP Value', priority: 3, timestamp: '2026-01-01T00:00:00Z' },
        {
          provider: 'fintables',
          value: 'Fintables Value',
          priority: 1,
          timestamp: '2026-01-01T00:00:00Z',
        },
      ]);
      expect(result).not.toBeNull();
      expect(result!.value).toBe('KAP Value');
      expect(result!.resolution).toBe('latest_timestamp');
    });
  });

  describe('resolveNumeric', () => {
    it('should return null for empty sources', () => {
      expect(resolver.resolveNumeric('revenue', [])).toBeNull();
    });

    it('should return single numeric source', () => {
      const result = resolver.resolveNumeric('revenue', [
        { provider: 'fintables', value: 1000000, priority: 1, timestamp: '2026-01-01T00:00:00Z' },
      ]);
      expect(result).toEqual({ value: 1000000, resolution: 'single_source' });
    });

    it('should average numeric values when no majority', () => {
      const result = resolver.resolveNumeric('revenue', [
        { provider: 'fintables', value: 100, priority: 1, timestamp: '2026-01-01T00:00:00Z' },
        { provider: 'yahoo', value: 200, priority: 2, timestamp: '2026-01-01T00:00:00Z' },
      ]);
      expect(result).not.toBeNull();
      expect(result!.value).toBe(150);
      expect(result!.resolution).toBe('average');
    });

    it('should use majority for numeric values', () => {
      const result = resolver.resolveNumeric('revenue', [
        { provider: 'fintables', value: 100, priority: 1, timestamp: '2026-01-01T00:00:00Z' },
        { provider: 'yahoo', value: 200, priority: 2, timestamp: '2026-01-01T00:00:00Z' },
        { provider: 'kap', value: 100, priority: 3, timestamp: '2026-01-01T00:00:00Z' },
      ]);
      expect(result).not.toBeNull();
      expect(result!.value).toBe(100);
      expect(result!.resolution).toBe('majority');
    });

    it('should ignore NaN values', () => {
      const result = resolver.resolveNumeric('revenue', [
        { provider: 'fintables', value: NaN, priority: 1, timestamp: '2026-01-01T00:00:00Z' },
        { provider: 'yahoo', value: 100, priority: 2, timestamp: '2026-01-01T00:00:00Z' },
      ]);
      expect(result).not.toBeNull();
      expect(result!.value).toBe(100);
    });

    it('should round averages to 2 decimal places', () => {
      const result = resolver.resolveNumeric('revenue', [
        { provider: 'fintables', value: 100, priority: 1, timestamp: '2026-01-01T00:00:00Z' },
        { provider: 'yahoo', value: 101, priority: 2, timestamp: '2026-01-01T00:00:00Z' },
      ]);
      expect(result).not.toBeNull();
      expect(result!.value).toBe(100.5);
    });
  });

  describe('resolveList', () => {
    it('should return empty for empty lists', () => {
      expect(resolver.resolveList('items', [])).toEqual([]);
    });

    it('should return single list', () => {
      const items = [{ title: 'Item 1' }, { title: 'Item 2' }];
      const result = resolver.resolveList('items', [
        { provider: 'fintables', items, priority: 1, timestamp: '2026-01-01T00:00:00Z' },
      ]);
      expect(result).toEqual(items);
    });

    it('should merge and deduplicate lists', () => {
      const result = resolver.resolveList('disclosures', [
        {
          provider: 'fintables',
          items: [
            { title: 'Item 1', date: '2026-01-01' },
            { title: 'Item 2', date: '2026-01-02' },
          ],
          priority: 1,
          timestamp: '2026-01-01T00:00:00Z',
        },
        {
          provider: 'yahoo',
          items: [
            { title: 'Item 2', date: '2026-01-02' },
            { title: 'Item 3', date: '2026-01-03' },
          ],
          priority: 2,
          timestamp: '2026-01-01T00:00:00Z',
        },
      ]);
      expect(result).toHaveLength(3);
      expect(result.map((r: { title: string }) => r.title)).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    it('should prefer higher priority provider items first', () => {
      const result = resolver.resolveList('disclosures', [
        {
          provider: 'kap',
          items: [{ title: 'KAP Item', date: '2026-01-01' }],
          priority: 3,
          timestamp: '2026-01-01T00:00:00Z',
        },
        {
          provider: 'fintables',
          items: [{ title: 'Fintables Item', date: '2026-01-01' }],
          priority: 1,
          timestamp: '2026-01-01T00:00:00Z',
        },
      ]);
      expect(result[0]).toEqual({ title: 'Fintables Item', date: '2026-01-01' });
    });
  });

  describe('buildConflictRecord', () => {
    it('should build a conflict record', () => {
      const sources = [
        { provider: 'fintables', value: 'Value A', priority: 1, timestamp: '2026-01-01T00:00:00Z' },
        { provider: 'yahoo', value: 'Value B', priority: 2, timestamp: '2026-01-01T00:00:00Z' },
      ];
      const record = resolver.buildConflictRecord('name', sources, 'Value A', 'highest_priority');
      expect(record.field).toBe('name');
      expect(record.values).toHaveLength(2);
      expect(record.chosenValue).toBe('Value A');
      expect(record.resolution).toBe('highest_priority');
    });
  });
});
