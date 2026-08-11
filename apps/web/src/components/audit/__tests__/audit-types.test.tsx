import { describe, it, expect } from 'vitest';
import { AUDIT_TABS, SEVERITY_LABELS, SEVERITY_COLORS, SEVERITY_BADGE, ACTION_LABELS, MODULE_TAB_MAP, AUDIT_MODULES, PAGE_SIZE_OPTIONS } from '../audit-types';

describe('audit-types', () => {
  it('has 14 tabs', () => { expect(AUDIT_TABS).toHaveLength(14); expect(AUDIT_TABS[0].key).toBe('all'); expect(AUDIT_TABS[0].label).toBe('Tümü'); });
  it('has all severity labels', () => { expect(SEVERITY_LABELS.INFO).toBe('Bilgi'); expect(SEVERITY_LABELS.WARNING).toBe('Uyarı'); expect(SEVERITY_LABELS.ERROR).toBe('Hata'); expect(SEVERITY_LABELS.CRITICAL).toBe('Kritik'); });
  it('has all severity colors', () => { expect(SEVERITY_COLORS.INFO).toBe('text-success'); expect(SEVERITY_COLORS.WARNING).toBe('text-warning'); expect(SEVERITY_COLORS.ERROR).toBe('text-destructive'); });
  it('has all severity badge variants', () => { expect(SEVERITY_BADGE.INFO).toBe('success'); expect(SEVERITY_BADGE.WARNING).toBe('warning'); expect(SEVERITY_BADGE.ERROR).toBe('danger'); });
  it('has all action labels', () => { expect(ACTION_LABELS.CREATED).toBe('Oluşturuldu'); expect(ACTION_LABELS.STARTED).toBe('Başlatıldı'); expect(ACTION_LABELS.FAILED).toBe('Hata Verdi'); expect(ACTION_LABELS.CUSTOM).toBe('Özel'); });
  it('maps modules to tabs', () => { expect(MODULE_TAB_MAP['Workflow']).toBe('workflow'); expect(MODULE_TAB_MAP['Scheduler']).toBe('scheduler'); expect(MODULE_TAB_MAP['Config']).toBe('config'); expect(MODULE_TAB_MAP['Provider']).toBe('providers'); expect(MODULE_TAB_MAP['Event Bus']).toBe('eventbus'); });
  it('has audit modules array', () => { expect(AUDIT_MODULES.length).toBeGreaterThan(5); expect(AUDIT_MODULES[0].name).toBe('İş Akışı'); });
  it('has page size options', () => { expect(PAGE_SIZE_OPTIONS).toEqual([10, 25, 50, 100]); });
});
