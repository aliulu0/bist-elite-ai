import { render, screen } from '@testing-library/react';
import { DashboardHeader } from './dashboard-header';

describe('DashboardHeader', () => {
  it('renders greeting', () => {
    render(<DashboardHeader />);
    const hour = new Date().getHours();
    const expected = hour < 6 ? 'İyi geceler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('renders date', () => {
    render(<DashboardHeader />);
    const dateStr = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    expect(screen.getByText(new RegExp(dateStr.split(' ')[0]))).toBeInTheDocument();
  });

  it('renders refresh button when onRefresh provided', () => {
    render(<DashboardHeader onRefresh={() => {}} />);
    expect(screen.getByText('Yenile')).toBeInTheDocument();
  });

  it('does not render refresh button without onRefresh', () => {
    render(<DashboardHeader />);
    expect(screen.queryByText('Yenile')).not.toBeInTheDocument();
  });

  it('calls onRefresh when clicked', () => {
    const onRefresh = vi.fn();
    render(<DashboardHeader onRefresh={onRefresh} />);
    screen.getByText('Yenile').click();
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('shows refreshing state', () => {
    render(<DashboardHeader onRefresh={() => {}} refreshing={true} />);
    expect(screen.getByText('Yenileniyor...')).toBeInTheDocument();
    expect(screen.getByText('Yenileniyor...')).toBeDisabled();
  });

  it('disables button while refreshing', () => {
    render(<DashboardHeader onRefresh={() => {}} refreshing={true} />);
    const btn = screen.getByRole('button', { name: 'Yenile' });
    expect(btn).toBeDisabled();
  });
});
