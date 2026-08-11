import { render, screen } from '@testing-library/react';
import { PerformanceCard } from './performance-card';
import type { PerformanceMetrics } from './performance-card';

const mockData: PerformanceMetrics = {
  metrics: [
    { name: 'api_response_test', category: 'api_response', avg: 45, rollingAvg: 45 },
    { name: 'engine_financial', category: 'engine_execution', avg: 12, rollingAvg: 12 },
  ],
  system: { uptimeMs: 99700, memoryUsageBytes: 68157440, cpuUsagePercent: 8 },
};

describe('PerformanceCard', () => {
  it('renders title', () => {
    render(<PerformanceCard data={null} />);
    expect(screen.getByText('Performans')).toBeInTheDocument();
  });

  it('renders uptime', () => {
    render(<PerformanceCard data={mockData} />);
    expect(screen.getByText('1dk 39s')).toBeInTheDocument();
  });

  it('renders memory usage in MB when < 1 GB', () => {
    render(<PerformanceCard data={mockData} />);
    expect(screen.getByText('65 MB')).toBeInTheDocument();
  });

  it('renders uptime label', () => {
    render(<PerformanceCard data={mockData} />);
    expect(screen.getByText('Çalışma Süresi')).toBeInTheDocument();
  });

  it('renders memory label', () => {
    render(<PerformanceCard data={mockData} />);
    expect(screen.getByText('Bellek')).toBeInTheDocument();
  });

  it('shows loading', () => {
    render(<PerformanceCard data={null} loading={true} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error', () => {
    render(<PerformanceCard data={null} error="Hata" />);
    expect(screen.getByText('Hata')).toBeInTheDocument();
  });

  it('shows null state when no data', () => {
    render(<PerformanceCard data={null} />);
    expect(screen.getByText('Veri yok')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<PerformanceCard data={mockData} />);
    expect(screen.getByText('Sistem metrikleri')).toBeInTheDocument();
  });

  it('renders memory in GB when >= 1 GB', () => {
    const bigMemory: PerformanceMetrics = {
      ...mockData,
      system: { uptimeMs: 99700, memoryUsageBytes: 2684354560, cpuUsagePercent: 8 },
    };
    render(<PerformanceCard data={bigMemory} />);
    expect(screen.getByText('2.5 GB')).toBeInTheDocument();
  });
});
