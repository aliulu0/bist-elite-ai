import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioCashCard } from '../portfolio-cash-card';
import type { CashBalance } from '../portfolio-types';

describe('PortfolioCashCard', () => {
  const cash: CashBalance = { available: 3500, reserved: 500, total: 4000 };

  it('renders title', () => {
    render(<PortfolioCashCard cash={cash} />);
    expect(screen.getByText('Nakit Durumu')).toBeDefined();
  });

  it('displays available label', () => {
    render(<PortfolioCashCard cash={cash} />);
    expect(screen.getByText('Kullanılabilir')).toBeDefined();
  });

  it('displays reserved label', () => {
    render(<PortfolioCashCard cash={cash} />);
    expect(screen.getByText('Rezerv')).toBeDefined();
  });

  it('displays total label', () => {
    render(<PortfolioCashCard cash={cash} />);
    expect(screen.getByText('Toplam')).toBeDefined();
  });

  it('displays formatted amounts using text content', () => {
    const { container } = render(<PortfolioCashCard cash={cash} />);
    const formattedAmounts = container.querySelectorAll('.font-mono');
    expect(formattedAmounts.length).toBe(3);
  });
});
