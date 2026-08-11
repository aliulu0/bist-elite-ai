import { render, screen, fireEvent } from '@testing-library/react';
import { BacktestSettings } from './backtest-settings';
import { DEFAULT_BACKTEST_CONFIG } from './backtest-types';
import type { BacktestConfig, EntryRule, ExitRule } from './backtest-types';

const defaultProps = {
  config: DEFAULT_BACKTEST_CONFIG,
  onUpdate: vi.fn(),
  onAddEntryRule: vi.fn(),
  onRemoveEntryRule: vi.fn(),
  onUpdateEntryRule: vi.fn(),
  onAddExitRule: vi.fn(),
  onRemoveExitRule: vi.fn(),
  onUpdateExitRule: vi.fn(),
};

describe('BacktestSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders collapsed by default', () => {
    render(<BacktestSettings {...defaultProps} />);
    expect(screen.getByText('Backtest Ayarları')).toBeInTheDocument();
    expect(screen.queryByLabelText('Başlangıç Sermayesi (₺)')).not.toBeInTheDocument();
  });

  it('expands when clicked', () => {
    render(<BacktestSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    expect(screen.getByLabelText('Başlangıç Sermayesi (₺)')).toBeInTheDocument();
  });

  it('shows initial capital value', () => {
    render(<BacktestSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    expect(screen.getByLabelText('Başlangıç Sermayesi (₺)')).toHaveValue(100000);
  });

  it('shows position size value', () => {
    render(<BacktestSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    expect(screen.getByLabelText('Pozisyon Büyüklüğü (%)')).toHaveValue(100);
  });

  it('calls onUpdate when capital changes', () => {
    render(<BacktestSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    fireEvent.change(screen.getByLabelText('Başlangıç Sermayesi (₺)'), { target: { value: '200000' } });
    expect(defaultProps.onUpdate).toHaveBeenCalledWith({ initialCapital: 200000 });
  });

  it('calls onUpdate when position size changes', () => {
    render(<BacktestSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    fireEvent.change(screen.getByLabelText('Pozisyon Büyüklüğü (%)'), { target: { value: '50' } });
    expect(defaultProps.onUpdate).toHaveBeenCalledWith({ positionSizePercent: 50 });
  });

  it('renders entry rules section', () => {
    render(<BacktestSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    expect(screen.getByText('Giriş Kuralları')).toBeInTheDocument();
  });

  it('renders exit rules section', () => {
    render(<BacktestSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    expect(screen.getByText('Çıkış Kuralları')).toBeInTheDocument();
  });

  it('calls onAddEntryRule when add entry clicked', () => {
    render(<BacktestSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    const addButtons = screen.getAllByText('Ekle');
    fireEvent.click(addButtons[0]);
    expect(defaultProps.onAddEntryRule).toHaveBeenCalledTimes(1);
  });

  it('calls onAddExitRule when add exit clicked', () => {
    render(<BacktestSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    const addButtons = screen.getAllByText('Ekle');
    fireEvent.click(addButtons[1]);
    expect(defaultProps.onAddExitRule).toHaveBeenCalledTimes(1);
  });

  it('does not show remove button when only 1 entry rule', () => {
    render(<BacktestSettings {...defaultProps} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    expect(screen.queryByTestId('remove-entry-0')).not.toBeInTheDocument();
  });

  it('shows remove button when more than 1 entry rule', () => {
    const config = {
      ...DEFAULT_BACKTEST_CONFIG,
      entryRules: [
        { signal: 'ALWAYS', threshold: 0, lookback: 0 },
        { signal: 'RSI_OVERSOLD', threshold: 30, lookback: 14 },
      ],
    };
    render(<BacktestSettings {...defaultProps} config={config} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    expect(screen.getByTestId('remove-entry-1')).toBeInTheDocument();
  });

  it('calls onRemoveEntryRule with correct index', () => {
    const config = {
      ...DEFAULT_BACKTEST_CONFIG,
      entryRules: [
        { signal: 'ALWAYS', threshold: 0, lookback: 0 },
        { signal: 'RSI_OVERSOLD', threshold: 30, lookback: 14 },
      ],
    };
    render(<BacktestSettings {...defaultProps} config={config} />);
    fireEvent.click(screen.getByText('Backtest Ayarları'));
    fireEvent.click(screen.getByTestId('remove-entry-1'));
    expect(defaultProps.onRemoveEntryRule).toHaveBeenCalledWith(1);
  });
});
