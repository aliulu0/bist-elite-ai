import { render, screen } from '@testing-library/react';
import { KpiCard } from './kpi-card';
import { Activity } from 'lucide-react';

describe('KpiCard', () => {
  it('renders label and value', () => {
    render(<KpiCard label="Test KPI" value={42} />);
    expect(screen.getByText('Test KPI')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<KpiCard label="Symbol" value="GARAN" />);
    expect(screen.getByText('GARAN')).toBeInTheDocument();
  });

  it('renders positive trend', () => {
    render(<KpiCard label="T" value={1} trend={5.5} />);
    expect(screen.getByText('+5.5%')).toBeInTheDocument();
  });

  it('renders negative trend', () => {
    render(<KpiCard label="T" value={1} trend={-3.2} />);
    expect(screen.getByText('-3.2%')).toBeInTheDocument();
  });

  it('renders zero trend', () => {
    render(<KpiCard label="T" value={1} trend={0} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('does not render trend when undefined', () => {
    render(<KpiCard label="T" value={1} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<KpiCard label="T" value={1} icon={Activity} />);
    expect(document.querySelector('.lucide-activity')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<KpiCard label="T" value={1} loading={true} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('hides value when loading', () => {
    render(<KpiCard label="T" value={42} loading={true} />);
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('applies success variant border', () => {
    const { container } = render(<KpiCard label="T" value={1} variant="success" />);
    expect(container.firstChild).toHaveClass('border-success/30');
  });

  it('applies danger variant border', () => {
    const { container } = render(<KpiCard label="T" value={1} variant="danger" />);
    expect(container.firstChild).toHaveClass('border-destructive/30');
  });

  it('applies warning variant border', () => {
    const { container } = render(<KpiCard label="T" value={1} variant="warning" />);
    expect(container.firstChild).toHaveClass('border-warning/30');
  });

  it('applies custom className', () => {
    const { container } = render(<KpiCard label="T" value={1} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('truncates long label', () => {
    render(<KpiCard label="Very Long Label That Should Be Truncated" value={1} />);
    expect(screen.getByText('Very Long Label That Should Be Truncated')).toHaveClass('truncate');
  });
});
