import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatLargeNumber,
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatScore,
  formatVolume,
  formatConfidence,
  getFormatConfig,
} from '../src/locales/format';

describe('formatCurrency', () => {
  it('formats Turkish Lira', () => {
    const result = formatCurrency(1234.56, 'tr');
    expect(result).toContain('1.234,56');
  });

  it('formats negative values', () => {
    const result = formatCurrency(-1234.56, 'tr');
    expect(result).toContain('-');
    expect(result).toContain('1.234,56');
  });

  it('formats zero', () => {
    const result = formatCurrency(0, 'tr');
    expect(result).toContain('0,00');
  });
});

describe('formatPercent', () => {
  it('formats positive percentage in Turkish', () => {
    const result = formatPercent(5.23, 'tr');
    expect(result).toBe('+%5,23');
  });

  it('formats negative percentage in Turkish', () => {
    const result = formatPercent(-3.14, 'tr');
    expect(result).toBe('-%3,14');
  });

  it('formats zero percentage', () => {
    const result = formatPercent(0, 'tr');
    expect(result).toBe('%0,00');
  });

  it('formats percentage in English', () => {
    const result = formatPercent(5.23, 'en');
    expect(result).toBe('+%5.23');
  });
});

describe('formatNumber', () => {
  it('formats number with Turkish separators', () => {
    const result = formatNumber(1234567.89, 'tr');
    expect(result).toBe('1.234.567,89');
  });

  it('formats number with English separators', () => {
    const result = formatNumber(1234567.89, 'en');
    expect(result).toBe('1,234,567.89');
  });

  it('formats zero', () => {
    expect(formatNumber(0, 'tr')).toBe('0,00');
  });

  it('formats negative numbers', () => {
    const result = formatNumber(-1234.56, 'tr');
    expect(result).toContain('-1.234,56');
  });

  it('formats with specified decimals', () => {
    const result = formatNumber(1234.5, 'tr', 4);
    expect(result).toBe('1.234,5000');
  });
});

describe('formatLargeNumber', () => {
  it('formats billions', () => {
    const result = formatLargeNumber(1_500_000_000, 'tr');
    expect(result).toContain('Milyar');
  });

  it('formats millions', () => {
    const result = formatLargeNumber(2_500_000, 'tr');
    expect(result).toContain('M');
  });

  it('formats thousands', () => {
    const result = formatLargeNumber(45_000, 'tr');
    expect(result).toContain('K');
  });

  it('formats small numbers as-is', () => {
    const result = formatLargeNumber(42, 'tr');
    expect(result).toBe('42');
  });
});

describe('formatDate', () => {
  it('formats date in Turkish format DD.MM.YYYY', () => {
    const date = new Date(2026, 6, 21);
    const result = formatDate(date, 'tr');
    expect(result).toBe('21.07.2026');
  });

  it('formats date string', () => {
    const result = formatDate('2026-07-21', 'tr');
    expect(result).toBe('21.07.2026');
  });
});

describe('formatDateTime', () => {
  it('formats date and time', () => {
    const date = new Date(2026, 6, 21, 14, 30);
    const result = formatDateTime(date, 'tr');
    expect(result).toBe('21.07.2026 14:30');
  });
});

describe('formatTime', () => {
  it('formats time', () => {
    const date = new Date(2026, 6, 21, 14, 30, 45);
    const result = formatTime(date, 'tr');
    expect(result).toBe('14:30:45');
  });
});

describe('formatRelativeTime', () => {
  it('returns now for very recent', () => {
    const now = new Date();
    const result = formatRelativeTime(now, 'tr');
    expect(result).toBe('şimdi');
  });

  it('returns minutes ago', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    const result = formatRelativeTime(d, 'tr');
    expect(result).toContain('dakika önce');
  });

  it('returns hours ago', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const result = formatRelativeTime(d, 'tr');
    expect(result).toContain('saat önce');
  });
});

describe('formatScore', () => {
  it('formats score', () => {
    expect(formatScore(85.67, 'tr')).toBe('85,7');
  });
});

describe('formatVolume', () => {
  it('formats millions', () => {
    expect(formatVolume(2_500_000, 'tr')).toBe('2.50M');
  });

  it('formats thousands', () => {
    expect(formatVolume(45_000, 'tr')).toBe('45.0K');
  });

  it('formats small volumes', () => {
    expect(formatVolume(500, 'tr')).toBe('500');
  });
});

describe('formatConfidence', () => {
  it('formats confidence as percentage', () => {
    expect(formatConfidence(0.856, 'tr')).toBe('+%85,6');
  });
});

describe('getFormatConfig', () => {
  it('returns Turkish config by default', () => {
    const config = getFormatConfig();
    expect(config.locale).toBe('tr');
    expect(config.dateFormat).toBe('DD.MM.YYYY');
  });

  it('returns English config', () => {
    const config = getFormatConfig('en');
    expect(config.locale).toBe('en');
    expect(config.dateFormat).toBe('MM/DD/YYYY');
  });
});
