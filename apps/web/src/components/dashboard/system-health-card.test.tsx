import { render, screen } from '@testing-library/react';
import { SystemHealthCard } from './system-health-card';
import type { DiagnosticCheck } from './system-health-card';

const mockChecks: DiagnosticCheck[] = [
  { name: 'PostgreSQL', status: 'pass', message: 'Bağlantı aktif', duration: 12 },
  { name: 'Redis', status: 'pass', message: 'Önbellek çalışıyor', duration: 5 },
  { name: 'EventBus', status: 'warning', message: 'Yüksek gecikme', duration: 85 },
  { name: 'WorkflowEngine', status: 'fail', message: 'Bağlantı kesildi', duration: 250 },
];

describe('SystemHealthCard', () => {
  it('renders title', () => {
    render(<SystemHealthCard checks={[]} />);
    expect(screen.getByText('Sistem Durumu')).toBeInTheDocument();
  });

  it('renders checks', () => {
    render(<SystemHealthCard checks={mockChecks} />);
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('Redis')).toBeInTheDocument();
    expect(screen.getByText('EventBus')).toBeInTheDocument();
    expect(screen.getByText('WorkflowEngine')).toBeInTheDocument();
  });

  it('renders messages', () => {
    render(<SystemHealthCard checks={mockChecks} />);
    expect(screen.getByText('Bağlantı aktif')).toBeInTheDocument();
    expect(screen.getByText('Yüksek gecikme')).toBeInTheDocument();
  });

  it('shows empty message', () => {
    render(<SystemHealthCard checks={[]} />);
    expect(screen.getByText('Kontrol sonucu yok')).toBeInTheDocument();
  });

  it('shows loading', () => {
    render(<SystemHealthCard checks={[]} loading={true} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error', () => {
    render(<SystemHealthCard checks={[]} error="Hata" />);
    expect(screen.getByText('Hata')).toBeInTheDocument();
  });

  it('renders health progress bar', () => {
    const { container } = render(<SystemHealthCard checks={mockChecks} />);
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBe(1);
  });

  it('renders summary counts', () => {
    render(<SystemHealthCard checks={mockChecks} />);
    expect(screen.getByText('2 geçti')).toBeInTheDocument();
    expect(screen.getByText('1 uyarı')).toBeInTheDocument();
    expect(screen.getByText('1 başarısız')).toBeInTheDocument();
  });

  it('renders health percentage', () => {
    render(<SystemHealthCard checks={mockChecks} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders duration', () => {
    render(<SystemHealthCard checks={[mockChecks[0]]} />);
    expect(screen.getByText('12ms')).toBeInTheDocument();
  });

  it('renders status icons for each check', () => {
    const { container } = render(<SystemHealthCard checks={mockChecks} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(4);
  });

  it('renders all pass summary', () => {
    const allPass: DiagnosticCheck[] = [
      { name: 'A', status: 'pass', message: 'ok', duration: 1 },
      { name: 'B', status: 'pass', message: 'ok', duration: 2 },
    ];
    render(<SystemHealthCard checks={allPass} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('2 geçti')).toBeInTheDocument();
  });
});
