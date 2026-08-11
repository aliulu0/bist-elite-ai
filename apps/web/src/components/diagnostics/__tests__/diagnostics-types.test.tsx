import { describe, it, expect } from 'vitest';
import {
  DIAGNOSTICS_TABS,
  CHECK_STATUS_LABELS,
  CHECK_STATUS_COLORS,
  CHECK_STATUS_BADGE,
  MODULE_CATEGORY_MAP,
  SERVICE_NAMES,
} from '../diagnostics-types';

describe('diagnostics-types', () => {
  it('has 10 tabs', () => {
    expect(DIAGNOSTICS_TABS).toHaveLength(10);
    expect(DIAGNOSTICS_TABS[0].key).toBe('overview');
    expect(DIAGNOSTICS_TABS[0].label).toBe('Genel');
    expect(DIAGNOSTICS_TABS[9].key).toBe('analysis');
  });

  it('has all status labels', () => {
    expect(CHECK_STATUS_LABELS.pass).toBe('Geçti');
    expect(CHECK_STATUS_LABELS.warning).toBe('Uyarı');
    expect(CHECK_STATUS_LABELS.fail).toBe('Başarısız');
    expect(CHECK_STATUS_LABELS.unknown).toBe('Bilinmiyor');
  });

  it('has all status colors', () => {
    expect(CHECK_STATUS_COLORS.pass).toBe('text-success');
    expect(CHECK_STATUS_COLORS.warning).toBe('text-warning');
    expect(CHECK_STATUS_COLORS.fail).toBe('text-destructive');
  });

  it('has all badge variants', () => {
    expect(CHECK_STATUS_BADGE.pass).toBe('success');
    expect(CHECK_STATUS_BADGE.warning).toBe('warning');
    expect(CHECK_STATUS_BADGE.fail).toBe('danger');
  });

  it('has module category map', () => {
    expect(MODULE_CATEGORY_MAP['Workflow Engine']).toBe('workflow');
    expect(MODULE_CATEGORY_MAP['Provider Health']).toBe('providers');
    expect(MODULE_CATEGORY_MAP['Event Bus Engine']).toBe('eventbus');
    expect(MODULE_CATEGORY_MAP['Audit Log Engine']).toBe('audit');
    expect(MODULE_CATEGORY_MAP['Market Scanner']).toBe('analysis');
  });

  it('has service names', () => {
    expect(SERVICE_NAMES.length).toBe(11);
    expect(SERVICE_NAMES[0].name).toBe('API');
    expect(SERVICE_NAMES[1].name).toBe('İş Akışı');
  });
});
