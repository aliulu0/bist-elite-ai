import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditModuleCards } from '../audit-module-cards';
import type { AuditSnapshot } from '../audit-types';
import { EMPTY_SNAPSHOT } from '@/stores/audit-store';

const mockSnapshot: AuditSnapshot = { ...EMPTY_SNAPSHOT, moduleStats: [{ module: 'Workflow', count: 10, lastActivity: '2026-01-15T10:00:00Z' }, { module: 'Scheduler', count: 5, lastActivity: '2026-01-15T09:00:00Z' }] };

describe('AuditModuleCards', () => {
  it('renders nothing when null', () => { const { container } = render(<AuditModuleCards snapshot={null} />); expect(container.innerHTML).toBe(''); });
  it('renders nothing when empty moduleStats', () => { const { container } = render(<AuditModuleCards snapshot={{ ...EMPTY_SNAPSHOT, moduleStats: [] }} />); expect(container.innerHTML).toBe(''); });
  it('renders module cards', () => { render(<AuditModuleCards snapshot={mockSnapshot} />); expect(screen.getByText('Modüllere Göre Dağılım')).toBeDefined(); });
  it('shows module names', () => { render(<AuditModuleCards snapshot={mockSnapshot} />); expect(screen.getByText('İş Akışı')).toBeDefined(); expect(screen.getByText('Zamanlayıcı')).toBeDefined(); });
  it('shows count', () => { render(<AuditModuleCards snapshot={mockSnapshot} />); expect(screen.getByText(/10 kayıt/)).toBeDefined(); expect(screen.getByText(/5 kayıt/)).toBeDefined(); });
  it('calls onFilterModule when clicked', () => { const fn = vi.fn(); render(<AuditModuleCards snapshot={mockSnapshot} onFilterModule={fn} />); screen.getByText('İş Akışı').click(); expect(fn).toHaveBeenCalledWith('Workflow'); });
});
