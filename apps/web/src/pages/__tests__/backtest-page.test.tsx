import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BacktestPage from '../backtest';

vi.mock('@/lib/sdk', () => ({
  sdkClient: {
    backtestCreate: vi.fn(),
    backtestWorkflows: vi.fn().mockResolvedValue({ data: [] }),
    backtestHistory: vi.fn().mockResolvedValue({ data: [] }),
    backtestStats: vi.fn().mockResolvedValue({}),
    workflow: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('BacktestPage', () => {
  it('renders page header', () => {
    render(<MemoryRouter><BacktestPage /></MemoryRouter>);
    expect(screen.getByText('Geri Test')).toBeInTheDocument();
  });

  it('renders symbol input', () => {
    render(<MemoryRouter><BacktestPage /></MemoryRouter>);
    expect(screen.getByLabelText('Hisse kodu')).toBeInTheDocument();
  });

  it('renders run button', () => {
    render(<MemoryRouter><BacktestPage /></MemoryRouter>);
    expect(screen.getByText('Backtest Çalıştır')).toBeInTheDocument();
  });

  it('empty state before run', () => {
    render(<MemoryRouter><BacktestPage /></MemoryRouter>);
    expect(screen.getByText('Backtest başlatın')).toBeInTheDocument();
  });

  it('page has proper structure', () => {
    const { container } = render(<MemoryRouter><BacktestPage /></MemoryRouter>);
    expect(container.firstChild).toBeTruthy();
  });

  it('shows description text', () => {
    render(<MemoryRouter><BacktestPage /></MemoryRouter>);
    expect(screen.getByText('Stratejileri geçmiş verilerle test edin')).toBeInTheDocument();
  });

  it('settings section renders', () => {
    render(<MemoryRouter><BacktestPage /></MemoryRouter>);
    expect(screen.getByText('Backtest Ayarları')).toBeInTheDocument();
  });

  it('tab navigation renders', () => {
    render(<MemoryRouter><BacktestPage /></MemoryRouter>);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('export button renders', () => {
    render(<MemoryRouter><BacktestPage /></MemoryRouter>);
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('symbol input accepts text', () => {
    render(<MemoryRouter><BacktestPage /></MemoryRouter>);
    const input = screen.getByLabelText('Hisse kodu');
    fireEvent.change(input, { target: { value: 'GARAN' } });
    expect(input).toHaveValue('GARAN');
  });
});
