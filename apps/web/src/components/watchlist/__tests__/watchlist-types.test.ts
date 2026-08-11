import { describe, it, expect } from 'vitest';
import {
  STATUS_LABELS, ALERT_TYPE_LABELS, SEVERITY_COLORS, STATUS_COLORS,
} from '../watchlist-types';

describe('watchlist-types constants', () => {
  it('STATUS_LABELS has all statuses', () => {
    expect(STATUS_LABELS['AKTİF']).toBe('Aktif');
    expect(STATUS_LABELS['İZLENEN']).toBe('İzlenen');
    expect(STATUS_LABELS['BEKLEMEDE']).toBe('Beklemede');
    expect(STATUS_LABELS['PASİF']).toBe('Pasif');
  });

  it('ALERT_TYPE_LABELS has all types', () => {
    expect(ALERT_TYPE_LABELS['ERKEN_FIRSAT']).toBe('Yeni Erken Fırsat');
    expect(ALERT_TYPE_LABELS['ELITE_YUKSELDI']).toBe('Elite Skoru Yükseldi');
    expect(ALERT_TYPE_LABELS['SMART_MONEY']).toBe('Smart Money Güçlendi');
    expect(ALERT_TYPE_LABELS['DESTEK_KRILDI']).toBe('Destek Kırıldı');
    expect(ALERT_TYPE_LABELS['SIKISMA']).toBe('Sıkışma Devam Ediyor');
  });

  it('SEVERITY_COLORS has all severities', () => {
    expect(SEVERITY_COLORS['INFO']).toBe('text-info');
    expect(SEVERITY_COLORS['WARNING']).toBe('text-warning');
    expect(SEVERITY_COLORS['CRITICAL']).toBe('text-destructive');
  });

  it('STATUS_COLORS has all statuses', () => {
    expect(STATUS_COLORS['AKTİF']).toContain('success');
    expect(STATUS_COLORS['İZLENEN']).toContain('primary');
    expect(STATUS_COLORS['BEKLEMEDE']).toContain('warning');
    expect(STATUS_COLORS['PASİF']).toContain('muted');
  });

  it('STATUS_LABELS has 4 entries', () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(4);
  });

  it('ALERT_TYPE_LABELS has 5 entries', () => {
    expect(Object.keys(ALERT_TYPE_LABELS)).toHaveLength(5);
  });

  it('SEVERITY_COLORS has 3 entries', () => {
    expect(Object.keys(SEVERITY_COLORS)).toHaveLength(3);
  });

  it('STATUS_COLORS has 4 entries', () => {
    expect(Object.keys(STATUS_COLORS)).toHaveLength(4);
  });
});
