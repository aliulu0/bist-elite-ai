import { describe, it, expect } from 'vitest';
import {
  WORKFLOW_TABS,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_BADGE,
  TYPE_LABELS,
  STEP_STATUS_LABELS,
  STEP_STATUS_COLORS,
  QUEUE_STATUS_LABELS,
} from '../workflow-types';

describe('workflow-types', () => {
  it('has 5 tabs', () => { expect(WORKFLOW_TABS).toHaveLength(5); expect(WORKFLOW_TABS[0].key).toBe('overview'); expect(WORKFLOW_TABS[0].label).toBe('Genel'); expect(WORKFLOW_TABS[4].key).toBe('statistics'); });
  it('has all status labels', () => { expect(STATUS_LABELS.PENDING).toBe('Bekliyor'); expect(STATUS_LABELS.RUNNING).toBe('Çalışıyor'); expect(STATUS_LABELS.COMPLETED).toBe('Tamamlandı'); expect(STATUS_LABELS.FAILED).toBe('Başarısız'); expect(STATUS_LABELS.CANCELLED).toBe('İptal'); expect(STATUS_LABELS.TIMEOUT).toBe('Zaman Aşımı'); expect(STATUS_LABELS.RETRYING).toBe('Yeniden Deniyor'); });
  it('has all status colors', () => { expect(STATUS_COLORS.COMPLETED).toBe('text-success'); expect(STATUS_COLORS.FAILED).toBe('text-destructive'); expect(STATUS_COLORS.RUNNING).toBe('text-info'); });
  it('has all badge variants', () => { expect(STATUS_BADGE.COMPLETED).toBe('success'); expect(STATUS_BADGE.FAILED).toBe('danger'); expect(STATUS_BADGE.RUNNING).toBe('info'); expect(STATUS_BADGE.PENDING).toBe('default'); });
  it('has all type labels', () => { expect(TYPE_LABELS.ANALYSIS).toBe('Analiz'); expect(TYPE_LABELS.SCANNING).toBe('Tarama'); expect(TYPE_LABELS.BACKTEST).toBe('Geri Test'); expect(TYPE_LABELS.PORTFOLIO).toBe('Portföy'); expect(TYPE_LABELS.WATCHLIST).toBe('İzleme'); expect(TYPE_LABELS.CUSTOM).toBe('Özel'); });
  it('has step status labels', () => { expect(STEP_STATUS_LABELS.completed).toBe('Tamamlandı'); expect(STEP_STATUS_LABELS.running).toBe('Çalışıyor'); expect(STEP_STATUS_LABELS.waiting).toBe('Bekliyor'); expect(STEP_STATUS_LABELS.skipped).toBe('Atlandı'); expect(STEP_STATUS_LABELS.failed).toBe('Başarısız'); });
  it('has queue status labels', () => { expect(QUEUE_STATUS_LABELS.PENDING).toBe('Bekliyor'); expect(QUEUE_STATUS_LABELS.DEAD_LETTER).toBe('Ölü Mektup'); });
});
