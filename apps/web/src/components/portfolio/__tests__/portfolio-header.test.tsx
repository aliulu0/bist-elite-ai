import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PortfolioHeader } from '../portfolio-header';

describe('PortfolioHeader', () => {
  const defaultProps = {
    onAddPortfolio: vi.fn(),
    onAddTransaction: vi.fn(),
    onRefresh: vi.fn(),
    onExport: vi.fn(),
    onToggleCompact: vi.fn(),
    compactMode: false,
    loading: false,
  };

  it('renders title', () => {
    render(<PortfolioHeader {...defaultProps} />);
    expect(screen.getByText('Portföy Yönetimi')).toBeDefined();
  });

  it('calls onAddPortfolio when clicked', () => {
    render(<PortfolioHeader {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Portföy ekle'));
    expect(defaultProps.onAddPortfolio).toHaveBeenCalledOnce();
  });

  it('calls onAddTransaction when clicked', () => {
    render(<PortfolioHeader {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('İşlem ekle'));
    expect(defaultProps.onAddTransaction).toHaveBeenCalledOnce();
  });

  it('calls onRefresh when clicked', () => {
    render(<PortfolioHeader {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Yenile'));
    expect(defaultProps.onRefresh).toHaveBeenCalledOnce();
  });

  it('calls onExport when clicked', () => {
    render(<PortfolioHeader {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Dışa aktar'));
    expect(defaultProps.onExport).toHaveBeenCalledOnce();
  });

  it('calls onToggleCompact when clicked', () => {
    render(<PortfolioHeader {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Kompakt görünüm'));
    expect(defaultProps.onToggleCompact).toHaveBeenCalledOnce();
  });

  it('shows Normal text when compactMode is true', () => {
    render(<PortfolioHeader {...defaultProps} compactMode={true} />);
    expect(screen.getByText('Normal')).toBeDefined();
  });

  it('shows Kompakt text when compactMode is false', () => {
    render(<PortfolioHeader {...defaultProps} compactMode={false} />);
    expect(screen.getByText('Kompakt')).toBeDefined();
  });

  it('disables refresh button when loading', () => {
    render(<PortfolioHeader {...defaultProps} loading={true} />);
    const refreshBtn = screen.getByLabelText('Yenile');
    expect(refreshBtn.hasAttribute('disabled')).toBe(true);
  });

  it('enables refresh button when not loading', () => {
    render(<PortfolioHeader {...defaultProps} loading={false} />);
    const refreshBtn = screen.getByLabelText('Yenile');
    expect(refreshBtn.hasAttribute('disabled')).toBe(false);
  });
});
