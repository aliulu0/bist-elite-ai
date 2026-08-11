import { PointInTimeDataService } from '../point-in-time-data.service';
import { OHLCV } from '../../indicators/indicator.types';

describe('Critical Look-Ahead Tests', () => {
  let pointInTime: PointInTimeDataService;

  beforeEach(() => {
    pointInTime = new PointInTimeDataService();
  });

  const makeCandle = (timestamp: string, close = 100): OHLCV => ({
    timestamp, open: close, high: close + 1, low: close - 1, close, volume: 1000000,
  });

  /**
   * Test 1: Future price artificially added.
   * Expected: Historical decision MUST remain unchanged.
   */
  it('Test 1: Future price must NOT affect historical decision', () => {
    const decisionDate = '2024-01-15T23:59:59.000Z';
    const pastCandles = [
      makeCandle('2024-01-01T00:00:00.000Z', 100),
      makeCandle('2024-01-08T00:00:00.000Z', 102),
      makeCandle('2024-01-15T00:00:00.000Z', 103),
    ];
    const futureCandles = [
      makeCandle('2024-02-01T00:00:00.000Z', 200),
      makeCandle('2024-03-01T00:00:00.000Z', 500),
    ];
    const allCandles = [...pastCandles, ...futureCandles];

    const filtered = pointInTime.filterCandles(allCandles, decisionDate);
    expect(filtered.data).toEqual(pastCandles);
    expect(filtered.rejectedCount).toBe(futureCandles.length);
    filtered.data.forEach((c) => {
      expect(new Date(c.timestamp).getTime()).toBeLessThanOrEqual(new Date(decisionDate).getTime());
    });
  });

  /**
   * Test 2: Future fundamental statement added.
   * Expected: Historical decision MUST remain unchanged.
   */
  it('Test 2: Future fundamental statement must NOT affect historical decision', () => {
    const decisionDate = '2024-01-15T23:59:59.000Z';
    const pastFundamentals = [
      { timestamp: '2023-12-01T00:00:00.000Z', revenue: 1000 },
      { timestamp: '2024-01-10T00:00:00.000Z', revenue: 1100 },
    ];
    const futureFundamentals = [
      { timestamp: '2024-06-01T00:00:00.000Z', revenue: 5000 },
    ];

    const filtered = pointInTime.filterByTimestamp(
      [...pastFundamentals, ...futureFundamentals],
      decisionDate,
    );
    expect(filtered.data).toHaveLength(2);
    expect(filtered.rejectedCount).toBe(1);
    filtered.data.forEach((f) => {
      expect(new Date(f.timestamp).getTime()).toBeLessThanOrEqual(new Date(decisionDate).getTime());
    });
  });

  /**
   * Test 3: Future catalyst added.
   * Expected: Historical decision MUST remain unchanged.
   */
  it('Test 3: Future catalyst must NOT affect historical decision', () => {
    const decisionDate = '2024-01-15T23:59:59.000Z';
    const pastCatalysts = [
      { publishedAt: '2024-01-10T00:00:00.000Z', type: 'earnings' },
    ];
    const futureCatalysts = [
      { publishedAt: '2024-06-01T00:00:00.000Z', type: 'merger' },
    ];

    const filtered = pointInTime.filterByTimestamp(
      [...pastCatalysts, ...futureCatalysts],
      decisionDate,
      'publishedAt',
    );
    expect(filtered.data).toHaveLength(1);
    expect(filtered.rejectedCount).toBe(1);
  });

  /**
   * Test 4: Future research evidence added.
   * Expected: Historical decision MUST remain unchanged.
   */
  it('Test 4: Future research evidence must NOT affect historical decision', () => {
    const decisionDate = '2024-01-15T23:59:59.000Z';
    const pastResearch = [
      { publicationDate: '2024-01-10T00:00:00.000Z', rating: 'buy' },
    ];
    const futureResearch = [
      { publicationDate: '2024-06-01T00:00:00.000Z', rating: 'strong_buy' },
    ];

    const filtered = pointInTime.filterByTimestamp(
      [...pastResearch, ...futureResearch],
      decisionDate,
      'publicationDate',
    );
    expect(filtered.data).toHaveLength(1);
    expect(filtered.rejectedCount).toBe(1);
  });

  /**
   * Test 5: Future signal added.
   * Expected: Historical decision MUST remain unchanged.
   */
  it('Test 5: Future signal must NOT affect historical decision', () => {
    const decisionDate = '2024-01-15T23:59:59.000Z';
    const pastSignals = [
      { timestamp: '2024-01-10T00:00:00.000Z', signal: 'buy' },
    ];
    const futureSignals = [
      { timestamp: '2024-06-01T00:00:00.000Z', signal: 'strong_buy' },
    ];

    const filtered = pointInTime.filterByTimestamp(
      [...pastSignals, ...futureSignals],
      decisionDate,
    );
    expect(filtered.data).toHaveLength(1);
    expect(filtered.rejectedCount).toBe(1);
  });
});