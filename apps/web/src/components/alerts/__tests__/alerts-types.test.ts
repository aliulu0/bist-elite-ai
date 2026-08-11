import { describe, it, expect } from 'vitest';
import {
  ALERT_TABS,
  ALERT_TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  GROUP_LABELS,
  DEFAULT_ALERT_SETTINGS,
} from '../alerts-types';
import type { AlertType, AlertPriority, AlertStatus, AlertGroup } from '../alerts-types';

describe('Alerts Types', () => {
  it('has 7 alert tabs', () => {
    expect(ALERT_TABS).toHaveLength(7);
    expect(ALERT_TABS[0].key).toBe('TUMU');
  });

  it('has 12 alert types', () => {
    expect(Object.keys(ALERT_TYPE_LABELS)).toHaveLength(12);
  });

  it('has 5 priorities', () => {
    expect(Object.keys(PRIORITY_LABELS)).toHaveLength(5);
  });

  it('has 4 statuses', () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(4);
  });

  it('has 5 priority colors', () => {
    expect(Object.keys(PRIORITY_COLORS)).toHaveLength(5);
  });

  it('has 4 status colors', () => {
    expect(Object.keys(STATUS_COLORS)).toHaveLength(4);
  });

  it('has 6 groups', () => {
    expect(Object.keys(GROUP_LABELS)).toHaveLength(6);
  });

  it('default settings all true', () => {
    expect(Object.values(DEFAULT_ALERT_SETTINGS).every((v) => v === true)).toBe(true);
  });

  it('all type labels are Turkish', () => {
    expect(ALERT_TYPE_LABELS.ERKEN_FIRSAT).toBe('Yeni Erken Fırsat');
    expect(ALERT_TYPE_LABELS.WORKFLOW_HATA).toBe('Workflow Hata Verdi');
    expect(ALERT_TYPE_LABELS.SISTEM_UYARISI).toBe('Sistem Uyarısı');
  });

  it('all priority labels are Turkish', () => {
    expect(PRIORITY_LABELS.KRITIK).toBe('Kritik');
    expect(PRIORITY_LABELS.YUKSEK).toBe('Yüksek');
    expect(PRIORITY_LABELS.ORTA).toBe('Orta');
    expect(PRIORITY_LABELS.DUSUK).toBe('Düşük');
    expect(PRIORITY_LABELS.BILGI).toBe('Bilgi');
  });

  it('all status labels are Turkish', () => {
    expect(STATUS_LABELS.YENI).toBe('Yeni');
    expect(STATUS_LABELS.OKUNDU).toBe('Okundu');
    expect(STATUS_LABELS.COZULDU).toBe('Çözüldü');
    expect(STATUS_LABELS.ATLADI).toBe('Atlandı');
  });

  it('all group labels are Turkish', () => {
    expect(GROUP_LABELS.PIYASA).toBe('Piyasa');
    expect(GROUP_LABELS.WORKFLOW).toBe('Workflow');
    expect(GROUP_LABELS.PROVIDER).toBe('Provider');
    expect(GROUP_LABELS.SISTEM).toBe('Sistem');
    expect(GROUP_LABELS.PORTFOY).toBe('Portföy');
    expect(GROUP_LABELS.WATCHLIST).toBe('Watchlist');
  });
});
