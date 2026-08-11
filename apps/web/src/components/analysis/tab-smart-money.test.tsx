import { render, screen } from '@testing-library/react';
import { TabSmartMoney } from './tab-smart-money';
import { mockAnalysisResult } from './mock-data';

describe('TabSmartMoney', () => {
  it('renders Akıllı Para Analizi title', () => {
    render(<TabSmartMoney data={mockAnalysisResult} />);
    expect(screen.getByText('Akıllı Para Analizi')).toBeInTheDocument();
  });

  it('renders Birikim Dağılım', () => {
    render(<TabSmartMoney data={mockAnalysisResult} />);
    expect(screen.getByText('Birikim Dağılım')).toBeInTheDocument();
  });

  it('renders accumulation score', () => {
    render(<TabSmartMoney data={mockAnalysisResult} />);
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('renders distribution score', () => {
    render(<TabSmartMoney data={mockAnalysisResult} />);
    expect(screen.getByText('28%')).toBeInTheDocument();
  });

  it('renders institutional activity', () => {
    render(<TabSmartMoney data={mockAnalysisResult} />);
    expect(screen.getByText('Toparlama')).toBeInTheDocument();
  });

  it('renders trend alignment', () => {
    render(<TabSmartMoney data={mockAnalysisResult} />);
    expect(screen.getByText('Yükseliş')).toBeInTheDocument();
  });

  it('renders signals', () => {
    render(<TabSmartMoney data={mockAnalysisResult} />);
    expect(screen.getByText('Sinyaller')).toBeInTheDocument();
    expect(screen.getByText('accumulation')).toBeInTheDocument();
  });

  it('renders signal strength', () => {
    render(<TabSmartMoney data={mockAnalysisResult} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders validity', () => {
    render(<TabSmartMoney data={mockAnalysisResult} />);
    expect(screen.getByText('Geçerli')).toBeInTheDocument();
  });

  it('renders confidence', () => {
    render(<TabSmartMoney data={mockAnalysisResult} />);
    expect(screen.getByText('Güven: 65%')).toBeInTheDocument();
  });

  it('renders signals card', () => {
    render(<TabSmartMoney data={mockAnalysisResult} />);
    expect(screen.getByText('Sinyaller')).toBeInTheDocument();
    expect(screen.getByText('volume_confirmation')).toBeInTheDocument();
  });
});
