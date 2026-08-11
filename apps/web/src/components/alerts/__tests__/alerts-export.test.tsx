import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsExport } from '../alerts-export';

describe('AlertsExport', () => {
  it('renders export title', () => {
    render(<AlertsExport onExport={vi.fn()} />);
    expect(screen.getByText('Dışa Aktar')).toBeDefined();
  });

  it('renders CSV button', () => {
    render(<AlertsExport onExport={vi.fn()} />);
    expect(screen.getByText('CSV Olarak İndir')).toBeDefined();
  });

  it('renders JSON button', () => {
    render(<AlertsExport onExport={vi.fn()} />);
    expect(screen.getByText('JSON Olarak İndir')).toBeDefined();
  });

  it('calls onExport with csv', () => {
    const onExport = vi.fn();
    render(<AlertsExport onExport={onExport} />);
    screen.getByText('CSV Olarak İndir').click();
    expect(onExport).toHaveBeenCalledWith('csv');
  });

  it('calls onExport with json', () => {
    const onExport = vi.fn();
    render(<AlertsExport onExport={onExport} />);
    screen.getByText('JSON Olarak İndir').click();
    expect(onExport).toHaveBeenCalledWith('json');
  });
});
