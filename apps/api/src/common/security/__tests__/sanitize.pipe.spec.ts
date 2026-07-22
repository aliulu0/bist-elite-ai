import { BadRequestException } from '@nestjs/common';
import { SanitizePipe, SqlInjectionDetector } from '../pipes/sanitize.pipe';

class MockLogger {
  log() {}
  debug() {}
  warn() {}
  error() {}
  trace() {}
  fatal() {}
  logRequest() {}
  logResponse() {}
  logEvent() {}
  getConfig() {
    return { level: 'info', maskSensitiveFields: [] };
  }
}

describe('SanitizePipe', () => {
  let pipe: SanitizePipe;

  beforeEach(() => {
    pipe = new SanitizePipe(new MockLogger() as any);
  });

  it('passes through null', () => {
    expect(pipe.transform(null)).toBeNull();
  });

  it('passes through undefined', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it('passes through numbers', () => {
    expect(pipe.transform(42)).toBe(42);
  });

  it('sanitizes HTML tags from strings', () => {
    const result = pipe.transform('<script>alert("xss")</script>Hello');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('sanitizes event handlers', () => {
    const result = pipe.transform('<div onclick="alert(1)">test</div>');
    expect(result).not.toContain('onclick');
  });

  it('sanitizes javascript URLs', () => {
    const result = pipe.transform('javascript:alert(1)');
    expect(result).not.toContain('javascript:');
  });

  it('escapes HTML entities in remaining text', () => {
    const result = pipe.transform('a & b');
    expect(result).toContain('&amp;');
  });

  it('sanitizes arrays', () => {
    const result = pipe.transform(['<b>bold</b>', 'normal']);
    expect(result[0]).not.toContain('<b>');
    expect(result[1]).toBe('normal');
  });

  it('sanitizes nested objects', () => {
    const result = pipe.transform({
      name: '<script>xss</script>John',
      age: 30,
      nested: {
        value: '<img onerror="alert(1)">test',
      },
    });
    expect(result.name).not.toContain('<script>');
    expect(result.age).toBe(30);
    expect(result.nested.value).not.toContain('onerror');
  });
});

describe('SqlInjectionDetector', () => {
  let pipe: SqlInjectionDetector;

  beforeEach(() => {
    pipe = new SqlInjectionDetector(new MockLogger() as any);
  });

  it('allows normal strings', () => {
    expect(pipe.transform('hello world')).toBe('hello world');
  });

  it('allows normal numbers', () => {
    expect(pipe.transform(42)).toBe(42);
  });

  it('detects SELECT statements', () => {
    expect(() => pipe.transform('SELECT * FROM users')).toThrow(BadRequestException);
  });

  it('detects DROP statements', () => {
    expect(() => pipe.transform('DROP TABLE users')).toThrow(BadRequestException);
  });

  it('detects UNION attacks', () => {
    expect(() => pipe.transform('1 UNION SELECT password FROM admins')).toThrow(BadRequestException);
  });

  it('detects comment injection', () => {
    expect(() => pipe.transform('admin\'--')).toThrow(BadRequestException);
  });

  it('detects OR 1=1 patterns', () => {
    expect(() => pipe.transform('\' OR 1=1 --')).toThrow(BadRequestException);
  });

  it('scans object values', () => {
    expect(() =>
      pipe.transform({ search: 'SELECT password FROM users' }),
    ).toThrow(BadRequestException);
  });

  it('allows normal object values', () => {
    const input = { name: 'John', city: 'Istanbul' };
    expect(pipe.transform(input)).toEqual(input);
  });
});
