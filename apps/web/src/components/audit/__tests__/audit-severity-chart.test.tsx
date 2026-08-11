import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditSeverityChart } from '../audit-severity-chart';
import type { AuditSnapshot } from '../audit-types';
import { EMPTY_SNAPSHOT } from '@/stores/audit-store';

const mockSnapshot: AuditSnapshot = { ...EMPTY_SNAPSHOT, severityCounts: { INFO: 50, WARNING: 20, ERROR: 5, CRITICAL: 2 }, totalCount: 77 };

describe('AuditSeverityChart', () => {
  it('renders nothing when null', () => { const { container } = render(<AuditSeverityChart snapshot={null} />); expect(container.innerHTML).toBe(''); });
  it('renders chart card', () => { render(<AuditSeverityChart snapshot={mockSnapshot} />); expect(screen.getByText('Önem Dağılımı')).toBeDefined(); });
  it('shows all severity labels', () => { render(<AuditSeverityChart snapshot={mockSnapshot} />); expect(screen.getByText('Bilgi')).toBeDefined(); expect(screen.getByText('Uyarı')).toBeDefined(); expect(screen.getByText('Hata')).toBeDefined(); expect(screen.getByText('Kritik')).toBeDefined(); });
  it('shows counts', () => { render(<AuditSeverityChart snapshot={mockSnapshot} />); expect(screen.getByText('50')).toBeDefined(); expect(screen.getByText('20')).toBeDefined(); expect(screen.getByText('5')).toBeDefined(); expect(screen.getByText('2')).toBeDefined(); });
  it('renders progress bars', () => { render(<AuditSeverityChart snapshot={mockSnapshot} />); const bars = document.querySelectorAll('[role="progressbar"],.bg-success,.bg-warning,.bg-destructive'); expect(bars.length).toBeGreaterThanOrEqual(1); });
});
