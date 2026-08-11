import { render, screen } from '@testing-library/react';
import { BacktestHeader } from './backtest-header';
import { DEFAULT_BACKTEST_CONFIG } from './backtest-types';

const defaultProps = {
  symbol: 'GARAN',
  onSymbolChange: vi.fn(),
  timeframe: '1d',
  onTimeframeChange: vi.fn(),
  config: DEFAULT_BACKTEST_CONFIG,
  onRun: vi.fn(),
  onReset: vi.fn(),
  loading: false,
};

describe('BacktestHeader', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders title', () => {
    render(<BacktestHeader {...defaultProps} />);
    expect(screen.getByText('Backtest Motoru')).toBeInTheDocument();
  });

  it('displays symbol in input', () => {
    render(<BacktestHeader {...defaultProps} />);
    expect(screen.getByLabelText('Hisse kodu')).toHaveValue('GARAN');
  });

  it('calls onSymbolChange when typing', () => {
    render(<BacktestHeader {...defaultProps} />);
    const input = screen.getByLabelText('Hisse kodu');
    (input as HTMLInputElement).value = '';
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    nativeInputValueSetter.call(input, 'THYAO');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(defaultProps.onSymbolChange).toHaveBeenCalledWith('THYAO');
  });

  it('renders timeframe buttons', () => {
    render(<BacktestHeader {...defaultProps} />);
    expect(screen.getByText('Günlük')).toBeInTheDocument();
    expect(screen.getByText('Haftalık')).toBeInTheDocument();
    expect(screen.getByText('Aylık')).toBeInTheDocument();
  });

  it('calls onTimeframeChange when clicking timeframe', () => {
    render(<BacktestHeader {...defaultProps} />);
    screen.getByText('Haftalık').click();
    expect(defaultProps.onTimeframeChange).toHaveBeenCalledWith('1w');
  });

  it('shows run button with correct text', () => {
    render(<BacktestHeader {...defaultProps} />);
    expect(screen.getByText('Backtest Çalıştır')).toBeInTheDocument();
  });

  it('disables run button when loading', () => {
    render(<BacktestHeader {...defaultProps} loading={true} />);
    expect(screen.getByText('Çalıştırılıyor...')).toBeInTheDocument();
    expect(screen.getByLabelText('Backtest çalıştır')).toBeDisabled();
  });

  it('disables run button when no symbol', () => {
    render(<BacktestHeader {...defaultProps} symbol="" />);
    expect(screen.getByLabelText('Backtest çalıştır')).toBeDisabled();
  });

  it('calls onRun when clicking run button', () => {
    render(<BacktestHeader {...defaultProps} />);
    screen.getByText('Backtest Çalıştır').click();
    expect(defaultProps.onRun).toHaveBeenCalledTimes(1);
  });

  it('calls onReset when clicking reset button', () => {
    render(<BacktestHeader {...defaultProps} />);
    screen.getByText('Sıfırla').click();
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
  });

  it('displays initial capital', () => {
    render(<BacktestHeader {...defaultProps} />);
    expect(screen.getByText(/100.000 ₺ başlangıç/)).toBeInTheDocument();
  });

  it('renders active timeframe with correct styling', () => {
    render(<BacktestHeader {...defaultProps} />);
    const gunluk = screen.getByText('Günlük');
    expect(gunluk).toHaveClass('bg-primary');
  });

  it('renders non-active timeframe without primary class', () => {
    render(<BacktestHeader {...defaultProps} />);
    const haftalik = screen.getByText('Haftalık');
    expect(haftalik).not.toHaveClass('bg-primary');
  });
});
