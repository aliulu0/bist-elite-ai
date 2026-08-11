import { describe, it, expect } from 'vitest';
import { exportWorkflowCSV, exportWorkflowJSON } from '../workflow-export';
import type { WorkflowItem } from '../workflow-types';

const sampleWorkflows: WorkflowItem[] = [
  { id: 'wf-1', type: 'ANALYSIS', status: 'COMPLETED', symbol: 'GARAN', steps: [], currentStep: '', progress: 100, createdAt: '2026-01-15T09:00:00Z', completedAt: '2026-01-15T10:00:00Z', durationMs: 3600000 },
  { id: 'wf-2', type: 'SCANNING', status: 'FAILED', symbol: 'THYAO', steps: [], currentStep: '', progress: 0, createdAt: '2026-01-15T08:00:00Z', retryCount: 2 },
];

describe('workflow-export', () => {
  describe('exportWorkflowCSV', () => {
    it('generates CSV with header', () => { const csv = exportWorkflowCSV(sampleWorkflows); expect(csv).toContain('ID,Tür,Hisse,Durum'); });
    it('includes log data', () => { const csv = exportWorkflowCSV(sampleWorkflows); expect(csv).toContain('ANALYSIS'); expect(csv).toContain('SCANNING'); });
    it('handles empty workflows', () => { const csv = exportWorkflowCSV([]); expect(csv).toBe('ID,Tür,Hisse,Durum,İlerleme,Başlangıç,Bitiş,Süre'); });
  });

  describe('exportWorkflowJSON', () => {
    it('generates valid JSON', () => { const json = exportWorkflowJSON(sampleWorkflows); const parsed = JSON.parse(json); expect(parsed).toHaveLength(2); });
    it('preserves data', () => { const json = exportWorkflowJSON(sampleWorkflows); expect(json).toContain('ANALYSIS'); expect(json).toContain('COMPLETED'); });
    it('handles empty workflows', () => { const json = exportWorkflowJSON([]); expect(JSON.parse(json)).toEqual([]); });
  });
});
