import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowTabs } from '../workflow-tabs';
import { useWorkflowDashboardStore } from '@/stores/workflow-dashboard-store';
import { WORKFLOW_TABS } from '../workflow-types';

describe('WorkflowTabs', () => {
  beforeEach(() => { useWorkflowDashboardStore.setState({ activeTab: 'overview' }); });

  it('renders all tabs', () => { render(<WorkflowTabs />); WORKFLOW_TABS.forEach((t) => { expect(screen.getByText(t.label)).toBeDefined(); }); });
  it('highlights active tab', () => { render(<WorkflowTabs />); const btn = screen.getByText('Genel'); expect(btn.closest('button')!.className).toContain('bg-background'); });
  it('changes active tab on click', () => { render(<WorkflowTabs />); fireEvent.click(screen.getByText('Kuyruk')); expect(useWorkflowDashboardStore.getState().activeTab).toBe('queue'); });
  it('renders 5 tabs', () => { render(<WorkflowTabs />); expect(screen.getAllByRole('button').length).toBe(WORKFLOW_TABS.length); });
  it('can switch between tabs', () => { render(<WorkflowTabs />); fireEvent.click(screen.getByText('Geçmiş')); expect(useWorkflowDashboardStore.getState().activeTab).toBe('history'); fireEvent.click(screen.getByText('İstatistikler')); expect(useWorkflowDashboardStore.getState().activeTab).toBe('statistics'); });
});
