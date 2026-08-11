import { render, screen, fireEvent } from '@testing-library/react';
import { BacktestWorkflow } from './backtest-workflow';
import type { WorkflowItem } from './backtest-types';

const mockWorkflows: WorkflowItem[] = [
  {
    id: 'wf-1', type: 'backtest', status: 'COMPLETED', symbol: 'GARAN',
    steps: [], currentStep: 'done', progress: 100,
    startedAt: '2024-01-01T10:00:00Z', completedAt: '2024-01-01T10:02:30Z',
    durationMs: 150000, createdAt: '2024-01-01T09:59:00Z',
  },
  {
    id: 'wf-2', type: 'backtest', status: 'RUNNING', symbol: 'THYAO',
    steps: [], currentStep: 'processing', progress: 45,
    createdAt: '2024-01-01T11:00:00Z',
  },
  {
    id: 'wf-3', type: 'backtest', status: 'FAILED', symbol: 'ASELS',
    steps: [], currentStep: 'error', progress: 30,
    createdAt: '2024-01-01T12:00:00Z',
  },
  {
    id: 'wf-4', type: 'analysis', status: 'COMPLETED', symbol: 'GARAN',
    steps: [], currentStep: 'done', progress: 100,
    createdAt: '2024-01-01T13:00:00Z',
  },
];

describe('BacktestWorkflow', () => {
  const defaultProps = {
    workflows: mockWorkflows,
    onTrigger: vi.fn(),
    loading: false,
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders title', () => {
    render(<BacktestWorkflow {...defaultProps} />);
    expect(screen.getByText('Backtest İş Akışları')).toBeInTheDocument();
  });

  it('renders trigger button', () => {
    render(<BacktestWorkflow {...defaultProps} />);
    expect(screen.getByText('Yeni Backtest Başlat')).toBeInTheDocument();
  });

  it('calls onTrigger when button clicked', () => {
    render(<BacktestWorkflow {...defaultProps} />);
    fireEvent.click(screen.getByText('Yeni Backtest Başlat'));
    expect(defaultProps.onTrigger).toHaveBeenCalledTimes(1);
  });

  it('disables trigger when loading', () => {
    render(<BacktestWorkflow {...defaultProps} loading={true} />);
    expect(screen.getByText('Yeni Backtest Başlat')).toBeDisabled();
  });

  it('only shows backtest workflows', () => {
    render(<BacktestWorkflow {...defaultProps} />);
    expect(screen.getByText('GARAN')).toBeInTheDocument();
    expect(screen.getByText('THYAO')).toBeInTheDocument();
    expect(screen.getByText('ASELS')).toBeInTheDocument();
    expect(screen.queryByText(/analysis/)).not.toBeInTheDocument();
  });

  it('displays completed status', () => {
    render(<BacktestWorkflow {...defaultProps} />);
    expect(screen.getByText('Tamamlandı')).toBeInTheDocument();
  });

  it('displays running status', () => {
    render(<BacktestWorkflow {...defaultProps} />);
    expect(screen.getByText('Çalışıyor')).toBeInTheDocument();
  });

  it('displays failed status', () => {
    render(<BacktestWorkflow {...defaultProps} />);
    expect(screen.getByText('Başarısız')).toBeInTheDocument();
  });

  it('displays duration for completed workflows', () => {
    render(<BacktestWorkflow {...defaultProps} />);
    expect(screen.getByText(/150\.0s/)).toBeInTheDocument();
  });

  it('displays progress percentage', () => {
    render(<BacktestWorkflow {...defaultProps} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('shows empty state when no backtest workflows', () => {
    render(<BacktestWorkflow {...defaultProps} workflows={[]} />);
    expect(screen.getByText('Henüz backtest çalıştırılmadı')).toBeInTheDocument();
  });

  it('displays creation timestamp', () => {
    render(<BacktestWorkflow {...defaultProps} />);
    const dates = screen.getAllByText(/01\.01\.2024/);
    expect(dates.length).toBeGreaterThanOrEqual(1);
  });

  it('renders progress bars', () => {
    const { container } = render(<BacktestWorkflow {...defaultProps} />);
    const progressBars = container.querySelectorAll('.bg-primary');
    expect(progressBars.length).toBeGreaterThanOrEqual(2);
  });
});
