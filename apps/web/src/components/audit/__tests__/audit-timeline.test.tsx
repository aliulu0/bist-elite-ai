import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditTimeline } from '../audit-timeline';
import type { AuditLogEntry } from '../audit-types';

const sampleLogs: AuditLogEntry[] = [
  { id: '1', timestamp: '2026-01-15T10:00:00Z', module: 'Workflow', action: 'STARTED', severity: 'INFO', details: 'Started' },
  { id: '2', timestamp: '2026-01-15T11:00:00Z', module: 'Scheduler', action: 'FAILED', severity: 'ERROR', details: 'Failed' },
];

describe('AuditTimeline', () => {
  it('renders nothing when empty', () => { const { container } = render(<AuditTimeline logs={[]} />); expect(container.innerHTML).toBe(''); });
  it('renders timeline card', () => { render(<AuditTimeline logs={sampleLogs} />); expect(screen.getByText('Zaman Çizelgesi')).toBeDefined(); });
  it('shows module names', () => { render(<AuditTimeline logs={sampleLogs} />); expect(screen.getByText('İş Akışı')).toBeDefined(); expect(screen.getByText('Zamanlayıcı')).toBeDefined(); });
  it('shows severity labels', () => { render(<AuditTimeline logs={sampleLogs} />); expect(screen.getByText('Bilgi')).toBeDefined(); expect(screen.getByText('Hata')).toBeDefined(); });
  it('shows action labels', () => { render(<AuditTimeline logs={sampleLogs} />); expect(screen.getByText('Başlatıldı')).toBeDefined(); expect(screen.getByText('Hata Verdi')).toBeDefined(); });
  it('renders max 20 items', () => { const many = Array.from({ length: 25 }, (_, i) => ({ id: String(i), timestamp: `2026-01-15T${String(i).padStart(2, '0')}:00:00Z`, module: 'Workflow', action: 'STARTED', severity: 'INFO' as const, details: '' })); render(<AuditTimeline logs={many} />); expect(screen.getAllByText('İş Akışı').length).toBe(20); });
  it('calls onSelectLog when item clicked', () => { const fn = vi.fn(); render(<AuditTimeline logs={sampleLogs} onSelectLog={fn} />); screen.getAllByText('İş Akışı')[0].click(); expect(fn).toHaveBeenCalledWith('1'); });
});
