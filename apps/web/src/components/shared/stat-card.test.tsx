import { render, screen } from '@testing-library/react';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Test Stat" value={42} />);
    expect(screen.getByText('Test Stat')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatCard title="Score" value="AAA" />);
    expect(screen.getByText('AAA')).toBeInTheDocument();
  });

  it('renders positive change', () => {
    render(<StatCard title="Test" value={100} change={5.5} />);
    expect(screen.getByText('+5.5%')).toBeInTheDocument();
  });

  it('renders negative change', () => {
    render(<StatCard title="Test" value={100} change={-3.2} />);
    expect(screen.getByText('-3.2%')).toBeInTheDocument();
  });

  it('renders zero change', () => {
    render(<StatCard title="Test" value={100} change={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<StatCard title="Test" value={1} description="Last 24h" />);
    expect(screen.getByText('Last 24h')).toBeInTheDocument();
  });

  it('renders icon', () => {
    const MockIcon = () => <svg data-testid="icon" />;
    const Icon = MockIcon as unknown as React.FC<React.SVGProps<SVGSVGElement>>;
    render(<StatCard title="Test" value={1} icon={Icon} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies default variant class', () => {
    const { container } = render(<StatCard title="Test" value={1} />);
    expect(container.firstChild).toHaveClass('bg-card');
  });

  it('applies success variant', () => {
    const { container } = render(<StatCard title="Test" value={1} variant="success" />);
    expect(container.firstChild).toHaveClass('border-success/20');
  });

  it('applies danger variant', () => {
    const { container } = render(<StatCard title="Test" value={1} variant="danger" />);
    expect(container.firstChild).toHaveClass('border-destructive/20');
  });

  it('applies custom className', () => {
    const { container } = render(<StatCard title="Test" value={1} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
