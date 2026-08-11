import { render, screen } from '@testing-library/react';
import { WorkflowCard } from './workflow-card';
import type { WorkflowJob } from './workflow-card';

const mockJobs: WorkflowJob[] = [
  { id: '1', workflowId: 'wf-1', status: 'RUNNING', priority: 'HIGH', createdAt: '2025-01-01T10:00:00Z' },
  { id: '2', workflowId: 'wf-2', status: 'QUEUED', priority: 'NORMAL', createdAt: '2025-01-01T09:00:00Z' },
  { id: '3', workflowId: 'wf-3', status: 'COMPLETED', priority: 'CRITICAL', createdAt: '2025-01-01T08:00:00Z' },
  { id: '4', workflowId: 'wf-4', status: 'FAILED', priority: 'LOW', createdAt: '2025-01-01T07:00:00Z' },
];

describe('WorkflowCard', () => {
  it('renders title', () => {
    render(<WorkflowCard jobs={[]} />);
    expect(screen.getByText('İş Akışları')).toBeInTheDocument();
  });

  it('renders jobs', () => {
    render(<WorkflowCard jobs={mockJobs} />);
    expect(screen.getByText('wf-1')).toBeInTheDocument();
    expect(screen.getByText('wf-2')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<WorkflowCard jobs={mockJobs} />);
    expect(screen.getByText('Çalışıyor')).toBeInTheDocument();
    expect(screen.getByText('Kuyrukta')).toBeInTheDocument();
    expect(screen.getByText('Tamamlandı')).toBeInTheDocument();
    expect(screen.getByText('Başarısız')).toBeInTheDocument();
  });

  it('shows empty message', () => {
    render(<WorkflowCard jobs={[]} />);
    expect(screen.getByText('İş akışı bulunamadı')).toBeInTheDocument();
  });

  it('shows loading', () => {
    render(<WorkflowCard jobs={[]} loading={true} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error', () => {
    render(<WorkflowCard jobs={[]} error="Bağlantı hatası" />);
    expect(screen.getByText('Bağlantı hatası')).toBeInTheDocument();
  });

  it('renders job count in description', () => {
    render(<WorkflowCard jobs={mockJobs} />);
    expect(screen.getByText('4 iş akışı')).toBeInTheDocument();
  });

  it('renders summary stats', () => {
    render(<WorkflowCard jobs={mockJobs} />);
    expect(screen.getByText('1 tamamlandı')).toBeInTheDocument();
    expect(screen.getByText('1 çalışıyor')).toBeInTheDocument();
    expect(screen.getByText('1 bekliyor')).toBeInTheDocument();
    expect(screen.getByText('1 başarısız')).toBeInTheDocument();
  });

  it('renders progress bar', () => {
    const { container } = render(<WorkflowCard jobs={mockJobs} />);
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(1);
  });

  it('sorts by priority - CRITICAL first', () => {
    render(<WorkflowCard jobs={mockJobs} />);
    const jobItems = document.querySelectorAll('.truncate.text-xs.font-medium');
    expect(jobItems[0]).toHaveTextContent('wf-3');
  });

  it('limits to 5 displayed jobs', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      id: String(i),
      workflowId: `wf-${i}`,
      status: 'RUNNING',
      priority: 'NORMAL',
      createdAt: '2025-01-01T10:00:00Z',
    }));
    render(<WorkflowCard jobs={many} />);
    expect(screen.getByText('wf-0')).toBeInTheDocument();
    const jobItems = document.querySelectorAll('.truncate.text-xs.font-medium');
    expect(jobItems.length).toBe(5);
  });

  it('renders creation time element', () => {
    const { container } = render(<WorkflowCard jobs={[mockJobs[0]]} />);
    const timeElements = container.querySelectorAll('.text-\\[10px\\]');
    expect(timeElements.length).toBeGreaterThanOrEqual(1);
  });
});
