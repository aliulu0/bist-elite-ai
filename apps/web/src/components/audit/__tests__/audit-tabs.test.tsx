import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditTabs } from '../audit-tabs';
import { useAuditStore } from '@/stores/audit-store';
import { AUDIT_TABS } from '../audit-types';

describe('AuditTabs', () => {
  beforeEach(() => { useAuditStore.setState({ activeTab: 'all' }); });

  it('renders all tabs', () => { render(<AuditTabs />); AUDIT_TABS.forEach((t) => { expect(screen.getByText(t.label)).toBeDefined(); }); });
  it('highlights active tab', () => { render(<AuditTabs />); const allBtn = screen.getByText('Tümü'); expect(allBtn.closest('button')!.className).toContain('bg-background'); });
  it('changes active tab on click', () => { render(<AuditTabs />); fireEvent.click(screen.getByText('İş Akışı')); expect(useAuditStore.getState().activeTab).toBe('workflow'); });
  it('renders 14 tabs', () => { render(<AuditTabs />); const buttons = screen.getAllByRole('button'); expect(buttons.length).toBe(AUDIT_TABS.length); });
  it('can switch between tabs', () => { render(<AuditTabs />); fireEvent.click(screen.getByText('Zamanlayıcı')); expect(useAuditStore.getState().activeTab).toBe('scheduler'); fireEvent.click(screen.getByText('Diğer')); expect(useAuditStore.getState().activeTab).toBe('other'); });
});
