import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditSummary } from '../audit-summary';
import type { AuditSnapshot } from '../audit-types';
import { EMPTY_SNAPSHOT } from '@/stores/audit-store';

const mockSnapshot: AuditSnapshot = { ...EMPTY_SNAPSHOT, totalCount: 150, todayCount: 12, severityCounts: { INFO: 100, WARNING: 30, ERROR: 15, CRITICAL: 5 }, activeModules: 8, lastEntry: '2026-01-15T12:00:00Z' };

describe('AuditSummary', () => {
  it('renders nothing when null', () => { const { container } = render(<AuditSummary snapshot={null} />); expect(container.innerHTML).toBe(''); });
  it('renders all summary cards', () => { render(<AuditSummary snapshot={mockSnapshot} />); expect(screen.getByText('Toplam Kayıt')).toBeDefined(); expect(screen.getByText('Bugünkü Kayıt')).toBeDefined(); expect(screen.getByText('Bilgi')).toBeDefined(); expect(screen.getByText('Uyarı')).toBeDefined(); expect(screen.getByText('Hata')).toBeDefined(); expect(screen.getByText('Kritik')).toBeDefined(); expect(screen.getByText('Aktif Modül')).toBeDefined(); expect(screen.getByText('Son Kayıt')).toBeDefined(); });
  it('shows correct counts', () => { render(<AuditSummary snapshot={mockSnapshot} />); expect(screen.getByText('150')).toBeDefined(); expect(screen.getByText('12')).toBeDefined(); expect(screen.getByText('100')).toBeDefined(); });
  it('shows last entry time', () => { render(<AuditSummary snapshot={mockSnapshot} />); expect(screen.getByText(/\d{2}:\d{2}/)).toBeDefined(); });
  it('shows dashes for null lastEntry', () => { render(<AuditSummary snapshot={{ ...EMPTY_SNAPSHOT, lastEntry: null }} />); expect(screen.getByText('—')).toBeDefined(); });
});
