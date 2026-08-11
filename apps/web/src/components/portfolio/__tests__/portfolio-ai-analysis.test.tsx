import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortfolioAIAnalysis } from '../portfolio-ai-analysis';
import type { AIAnalysis } from '../portfolio-types';

describe('PortfolioAIAnalysis', () => {
  const analysis: AIAnalysis = {
    portfolioQuality: 'İyi',
    riskLevel: 'Düşük',
    concentrationRisk: 'Orta',
    sectorRisk: 'Yüksek',
    liquidity: 'Yüksek',
    diversification: 'Düşük',
    recommendations: ['Portföy çeşitliliği artırılabilir', 'Risk/getiri oranı iyi'],
    warnings: ['Tek hisse ağırlığı yüksek'],
  };

  it('renders title', () => {
    render(<PortfolioAIAnalysis analysis={analysis} />);
    expect(screen.getByText('Yapay Zeka Analizi')).toBeDefined();
  });

  it('displays metric labels', () => {
    render(<PortfolioAIAnalysis analysis={analysis} />);
    expect(screen.getByText('Portföy Kalitesi')).toBeDefined();
    expect(screen.getByText('Risk Seviyesi')).toBeDefined();
    expect(screen.getByText('Yoğunlaşma Riski')).toBeDefined();
    expect(screen.getByText('Sektör Riski')).toBeDefined();
    expect(screen.getByText('Likidite')).toBeDefined();
    expect(screen.getByText('Çeşitlendirme')).toBeDefined();
  });

  it('displays all metric values', () => {
    render(<PortfolioAIAnalysis analysis={analysis} />);
    expect(screen.getAllByText('İyi').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Düşük').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Orta').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Yüksek').length).toBeGreaterThanOrEqual(1);
  });

  it('displays recommendations', () => {
    render(<PortfolioAIAnalysis analysis={analysis} />);
    expect(screen.getByText('Portföy çeşitliliği artırılabilir')).toBeDefined();
    expect(screen.getByText('Risk/getiri oranı iyi')).toBeDefined();
  });

  it('displays warnings', () => {
    render(<PortfolioAIAnalysis analysis={analysis} />);
    expect(screen.getByText('Tek hisse ağırlığı yüksek')).toBeDefined();
  });

  it('returns empty state when no data', () => {
    const empty: AIAnalysis = { portfolioQuality: '', riskLevel: '', concentrationRisk: '', sectorRisk: '', liquidity: '', diversification: '', recommendations: [], warnings: [] };
    render(<PortfolioAIAnalysis analysis={empty} />);
    expect(screen.getByText('Risk analizi için yeterli veri yok')).toBeDefined();
  });

  it('shows section headers', () => {
    render(<PortfolioAIAnalysis analysis={analysis} />);
    expect(screen.getByText('Öneriler')).toBeDefined();
    expect(screen.getByText('Uyarılar')).toBeDefined();
  });
});
