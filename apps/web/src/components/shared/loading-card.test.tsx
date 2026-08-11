import { render, screen } from '@testing-library/react';
import { LoadingCard, LoadingOverlay } from './loading-card';

describe('LoadingCard', () => {
  it('renders spinner', () => {
    const { container } = render(<LoadingCard />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<LoadingCard title="Yükleniyor..." />);
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<LoadingCard title="A" description="Lütfen bekleyin" />);
    expect(screen.getByText('Lütfen bekleyin')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingCard className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});

describe('LoadingOverlay', () => {
  it('renders when show is true', () => {
    const { container } = render(<LoadingOverlay show={true} />);
    const overlay = container.querySelector('.absolute');
    expect(overlay).toBeInTheDocument();
  });

  it('renders nothing when show is false', () => {
    const { container } = render(<LoadingOverlay show={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders custom text', () => {
    render(<LoadingOverlay text="Lütfen bekleyin" />);
    expect(screen.getByText('Lütfen bekleyin')).toBeInTheDocument();
  });

  it('renders default text', () => {
    render(<LoadingOverlay />);
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
  });
});
