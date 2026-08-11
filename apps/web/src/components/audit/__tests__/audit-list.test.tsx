import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditList } from '../audit-list';
import type { AuditLogEntry } from '../audit-types';

const sampleLogs: AuditLogEntry[] = [
  { id: '1', timestamp: '2026-01-15T10:00:00Z', module: 'Workflow', action: 'STARTED', severity: 'INFO', details: 'Workflow started' },
  { id: '2', timestamp: '2026-01-15T11:00:00Z', module: 'Scheduler', action: 'FAILED', severity: 'ERROR', details: 'Scheduler error' },
];

describe('AuditList', () => {
  const defaultProps = { logs: sampleLogs, sortKey: 'timestamp', sortDir: 'desc' as const, onSort: vi.fn(), page: 0, pageSize: 25, onPageChange: vi.fn(), totalCount: 2, onSelectLog: vi.fn(), selectedLogId: null };

  it('shows empty state when no logs', () => { render(<AuditList {...defaultProps} logs={[]} />); expect(screen.getByText('Filtrelere uygun kayıt yok')).toBeDefined(); });
  it('renders table headers', () => { render(<AuditList {...defaultProps} />); expect(screen.getByText('Zaman')).toBeDefined(); expect(screen.getByText('Modül')).toBeDefined(); expect(screen.getByText('İşlem')).toBeDefined(); expect(screen.getByText('Öncelik')).toBeDefined(); expect(screen.getByText('Açıklama')).toBeDefined(); });
  it('renders log rows', () => { render(<AuditList {...defaultProps} />); expect(screen.getByText('İş Akışı')).toBeDefined(); expect(screen.getByText('Zamanlayıcı')).toBeDefined(); });
  it('shows action labels', () => { render(<AuditList {...defaultProps} />); expect(screen.getByText('Başlatıldı')).toBeDefined(); expect(screen.getByText('Hata Verdi')).toBeDefined(); });
  it('shows severity labels', () => { render(<AuditList {...defaultProps} />); expect(screen.getByText('Bilgi')).toBeDefined(); expect(screen.getByText('Hata')).toBeDefined(); });
  it('calls onSort when header clicked', () => { const fn = vi.fn(); render(<AuditList {...defaultProps} onSort={fn} />); fireEvent.click(screen.getByText('Modül')); expect(fn).toHaveBeenCalledWith('module', 'asc'); });
  it('calls onSort desc when same column clicked', () => { const fn = vi.fn(); render(<AuditList {...defaultProps} sortKey="module" sortDir="asc" onSort={fn} />); fireEvent.click(screen.getByText('Modül')); expect(fn).toHaveBeenCalledWith('module', 'desc'); });
  it('calls onSelectLog when row clicked', () => { const fn = vi.fn(); render(<AuditList {...defaultProps} onSelectLog={fn} />); fireEvent.click(screen.getByText('İş Akışı').closest('tr')!); expect(fn).toHaveBeenCalledWith('1'); });
  it('shows pagination when > 1 page', () => { render(<AuditList {...defaultProps} totalCount={50} pageSize={25} />); expect(screen.getByText('Sonraki')).toBeDefined(); expect(screen.getByText('Önceki')).toBeDefined(); });
  it('shows page info', () => { render(<AuditList {...defaultProps} totalCount={50} pageSize={25} />); expect(screen.getByText(/1–25 \/ 50/)).toBeDefined(); });
  it('calls onPageChange on next click', () => { const fn = vi.fn(); render(<AuditList {...defaultProps} totalCount={50} pageSize={25} onPageChange={fn} />); fireEvent.click(screen.getByText('Sonraki')); expect(fn).toHaveBeenCalledWith(1); });
  it('disables previous on first page', () => { render(<AuditList {...defaultProps} totalCount={50} pageSize={25} />); expect(screen.getByText('Önceki').closest('button')!.disabled).toBe(true); });
  it('disables next on last page', () => { render(<AuditList {...defaultProps} page={1} totalCount={50} pageSize={25} />); expect(screen.getByText('Sonraki').closest('button')!.disabled).toBe(true); });
  it('highlights selected row', () => { render(<AuditList {...defaultProps} selectedLogId="1" />); const row = screen.getByText('İş Akışı').closest('tr')!; expect(row.className).toContain('bg-muted'); });
});
