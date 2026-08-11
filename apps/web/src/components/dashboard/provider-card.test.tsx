import { render, screen } from '@testing-library/react';
import { ProviderCard } from './provider-card';
import type { Provider } from './provider-card';

const mockProviders: Provider[] = [
  { name: 'Yahoo Finance', status: 'healthy', reliability: 98.5, lastCheck: '2025-01-01T12:00:00Z' },
  { name: 'Fintables', status: 'degraded', reliability: 75.2, lastCheck: '2025-01-01T11:00:00Z' },
  { name: 'Central Bank', status: 'down', reliability: 12.0, lastCheck: '2025-01-01T10:00:00Z' },
];

describe('ProviderCard', () => {
  it('renders title', () => {
    render(<ProviderCard providers={[]} />);
    expect(screen.getByText('Veri Sağlayıcıları')).toBeInTheDocument();
  });

  it('renders providers', () => {
    render(<ProviderCard providers={mockProviders} />);
    expect(screen.getByText('Yahoo Finance')).toBeInTheDocument();
    expect(screen.getByText('Fintables')).toBeInTheDocument();
    expect(screen.getByText('Central Bank')).toBeInTheDocument();
  });

  it('renders progress bars for reliability', () => {
    const { container } = render(<ProviderCard providers={mockProviders} />);
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(3);
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '98.5');
    expect(progressBars[1]).toHaveAttribute('aria-valuenow', '75.2');
    expect(progressBars[2]).toHaveAttribute('aria-valuenow', '12');
  });

  it('shows healthy badge', () => {
    render(<ProviderCard providers={[mockProviders[0]]} />);
    expect(screen.getByText('Sağlıklı')).toBeInTheDocument();
  });

  it('shows degraded badge', () => {
    render(<ProviderCard providers={[mockProviders[1]]} />);
    expect(screen.getByText('Düşük')).toBeInTheDocument();
  });

  it('shows down badge', () => {
    render(<ProviderCard providers={[mockProviders[2]]} />);
    expect(screen.getByText('Hatalı')).toBeInTheDocument();
  });

  it('shows empty message', () => {
    render(<ProviderCard providers={[]} />);
    expect(screen.getByText('Sağlayıcı bulunamadı')).toBeInTheDocument();
  });

  it('shows loading', () => {
    render(<ProviderCard providers={[]} loading={true} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error', () => {
    render(<ProviderCard providers={[]} error="Hata" />);
    expect(screen.getByText('Hata')).toBeInTheDocument();
  });

  it('renders description with healthy count', () => {
    render(<ProviderCard providers={mockProviders} />);
    expect(screen.getByText('1/3 sağlıklı')).toBeInTheDocument();
  });

  it('renders last check time', () => {
    render(<ProviderCard providers={[mockProviders[0]]} />);
    expect(screen.getByText(/Son kontrol/)).toBeInTheDocument();
  });
});
