import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditDetail } from '../audit-detail';
import type { AuditLogEntry } from '../audit-types';

const mockLog: AuditLogEntry = { id: '1', timestamp: '2026-01-15T10:00:00Z', module: 'Workflow', action: 'STARTED', severity: 'INFO', details: 'Test details', user: 'admin', targetType: 'workflow', targetId: 'wf-1', oldValue: '{"status":"pending"}', newValue: '{"status":"running"}' };

describe('AuditDetail', () => {
  const onClose = vi.fn();

  it('renders null when log is null', () => { const { container } = render(<AuditDetail log={null} onClose={onClose} />); expect(container.innerHTML).toBe(''); });
  it('renders detail card when log provided', () => { render(<AuditDetail log={mockLog} onClose={onClose} />); expect(screen.getByText('Kayıt Detayı')).toBeDefined(); });
  it('shows log id', () => { render(<AuditDetail log={mockLog} onClose={onClose} />); expect(screen.getByText(/ID: 1/)).toBeDefined(); });
  it('shows module name', () => { render(<AuditDetail log={mockLog} onClose={onClose} />); expect(screen.getByText('İş Akışı')).toBeDefined(); });
  it('shows details text', () => { render(<AuditDetail log={mockLog} onClose={onClose} />); expect(screen.getByText('Test details')).toBeDefined(); });
  it('shows user', () => { render(<AuditDetail log={mockLog} onClose={onClose} />); expect(screen.getByText('admin')).toBeDefined(); });
  it('shows target type and id', () => { render(<AuditDetail log={mockLog} onClose={onClose} />); expect(screen.getByText('workflow')).toBeDefined(); expect(screen.getByText('wf-1')).toBeDefined(); });
  it('shows old and new values', () => { render(<AuditDetail log={mockLog} onClose={onClose} />); expect(screen.getByText('Eski Değer')).toBeDefined(); expect(screen.getByText('Yeni Değer')).toBeDefined(); });
  it('calls onClose when close button clicked', () => { const fn = vi.fn(); render(<AuditDetail log={mockLog} onClose={fn} />); fireEvent.click(screen.getByLabelText('Kapat')); expect(fn).toHaveBeenCalledTimes(1); });
  it('renders without optional fields', () => { const log: AuditLogEntry = { id: '2', timestamp: '2026-01-15T11:00:00Z', module: 'Config', action: 'UPDATED', severity: 'WARNING', details: 'Simple log' }; render(<AuditDetail log={log} onClose={onClose} />); expect(screen.getByText('Kayıt Detayı')).toBeDefined(); expect(screen.queryByText('Kullanıcı')).toBeNull(); });
});
