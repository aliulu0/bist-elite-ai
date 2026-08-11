import { cn, formatCurrency, formatNumber, formatPercent, formatCompact } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  it('deduplicates tailwind classes', () => {
    const result = cn('p-2 p-4');
    expect(result).toContain('p-4');
  });
});

describe('formatCurrency', () => {
  it('formats Turkish Lira', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1.234');
    expect(result).toContain('56');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('formats negative values', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500');
  });
});

describe('formatNumber', () => {
  it('formats with dot separator', () => {
    const result = formatNumber(1234567);
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('567');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatPercent', () => {
  it('formats positive percent', () => {
    const result = formatPercent(12.5);
    expect(result).toContain('12');
    expect(result).toContain('%');
  });

  it('formats negative percent', () => {
    const result = formatPercent(-5.3);
    expect(result).toContain('5');
    expect(result).toContain('%');
  });
});

describe('formatCompact', () => {
  it('formats large numbers compactly', () => {
    const result = formatCompact(1500000);
    expect(result).toMatch(/\d/);
  });

  it('formats small numbers', () => {
    const result = formatCompact(500);
    expect(result).toMatch(/\d/);
  });
});
