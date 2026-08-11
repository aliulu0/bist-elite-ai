import { describe, it, expect } from 'vitest';
import { exportAuditCSV, exportAuditJSON } from '../audit-export';
import type { AuditLogEntry } from '../audit-types';

const sampleLogs: AuditLogEntry[] = [
  { id: '1', timestamp: '2026-01-15T10:00:00Z', module: 'Workflow', action: 'STARTED', severity: 'INFO', details: 'Started' },
  { id: '2', timestamp: '2026-01-15T11:00:00Z', module: 'Scheduler', action: 'FAILED', severity: 'ERROR', details: 'Failed' },
];

describe('audit-export', () => {
  describe('exportAuditCSV', () => {
    it('generates CSV with header', () => { const csv = exportAuditCSV(sampleLogs); expect(csv).toContain('ID,Zaman,Modül'); });
    it('includes log data', () => { const csv = exportAuditCSV(sampleLogs); expect(csv).toContain('Workflow'); expect(csv).toContain('Scheduler'); });
    it('escapes quotes in details', () => { const logs: AuditLogEntry[] = [{ id: '1', timestamp: '2026-01-15T10:00:00Z', module: 'X', action: 'CREATED', severity: 'INFO', details: 'Say "hello"' }]; const csv = exportAuditCSV(logs); expect(csv).toContain('Say ""hello""'); });
    it('handles empty logs', () => { const csv = exportAuditCSV([]); expect(csv).toBe('ID,Zaman,Modül,İşlem,Öncelik,Kullanıcı,Açıklama'); });
  });

  describe('exportAuditJSON', () => {
    it('generates valid JSON', () => { const json = exportAuditJSON(sampleLogs); const parsed = JSON.parse(json); expect(parsed).toHaveLength(2); });
    it('preserves data', () => { const json = exportAuditJSON(sampleLogs); expect(json).toContain('Workflow'); expect(json).toContain('STARTED'); });
    it('handles empty logs', () => { const json = exportAuditJSON([]); expect(JSON.parse(json)).toEqual([]); });
  });
});
