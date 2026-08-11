import { Injectable, Optional } from '@nestjs/common';
import { PortfolioEngine } from '../../portfolio/engine/portfolio-engine.service';

export interface AdvisorRecommendation {
  type: 'reduce' | 'increase' | 'watch' | 'hold' | 'rebalance';
  symbol?: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  details: string;
}

export interface PortfolioAdvice {
  portfolioId: string;
  portfolioName: string;
  concentrationRisk: number;
  sectorImbalance: string[];
  correlationNotes: string[];
  cashRatio: number;
  cashSuggestion: string;
  volatility: number;
  expectedReturn: number;
  riskScore: number;
  riskReward: number;
  diversificationScore: number;
  recommendations: AdvisorRecommendation[];
}

@Injectable()
export class PortfolioAdvisorService {
  constructor(
    @Optional() private readonly portfolioEngine?: PortfolioEngine,
  ) {}

  async analyze(portfolioId?: string): Promise<PortfolioAdvice[]> {
    const results: PortfolioAdvice[] = [];

    if (!this.portfolioEngine) {
      return results;
    }

    try {
      const portfolios = portfolioId
        ? (() => { try { const p = this.portfolioEngine.getPortfolio(portfolioId); return p ? [p] : []; } catch { return []; } })()
        : this.portfolioEngine.getPortfolios();

      if (!portfolios || portfolios.length === 0) return results;

      for (const portfolio of portfolios) {
        const advice = await this.analyzePortfolio(portfolio.id, portfolio.name);
        results.push(advice);
      }
    } catch { /* ignore */ }

    return results;
  }

  private async analyzePortfolio(portfolioId: string, portfolioName: string): Promise<PortfolioAdvice> {
    const recommendations: AdvisorRecommendation[] = [];

    let risk: any = null;
    let allocation: any = null;
    let positionsData: any = [];
    try { risk = this.portfolioEngine!.getRisk(portfolioId); } catch {}
    try { allocation = this.portfolioEngine!.getAllocation(portfolioId); } catch {}
    try { positionsData = this.portfolioEngine!.getPositions(portfolioId); } catch {}

    const positions = positionsData as Array<{ symbol: string; name?: string; sector?: string; quantity: number; avgPrice: number; marketValue: number; weight: number; unrealizedPnl?: number; unrealizedPnlPercent?: number }>;
    const riskScore = risk?.riskScore || 0;
    const volatility = risk?.volatility || 0;
    const sharpeRatio = risk?.sharpeRatio || 0;
    const diversificationScore = risk?.diversificationScore || 0;
    const maxDrawdown = risk?.maxDrawdown || 0;
    const valueAtRisk = risk?.valueAtRisk || 0;
    const totalValue = risk?.totalValue || positions.reduce((s, p) => s + p.marketValue, 0);

    const sectors = allocation?.sectors || [];
    const sectorImbalance: string[] = [];

    if (sectors.length > 0) {
      const maxSectorWeight = Math.max(...sectors.map((s: { percentage: number }) => s.percentage));
      if (maxSectorWeight > 35) {
        const dominantSector = sectors.find((s: { percentage: number }) => s.percentage === maxSectorWeight);
        sectorImbalance.push(`${dominantSector?.sector} sektörü %${maxSectorWeight.toFixed(1)} ile çok yoğun. %20 altına çekilmesi önerilir.`);
        recommendations.push({
          type: 'rebalance',
          reason: 'Sektör yoğunlaşması',
          priority: 'high',
          details: `${dominantSector?.sector} sektörü portföyün %${maxSectorWeight.toFixed(1)}'ini oluşturuyor. Risk dağılımı için %20 altına çekilmesi önerilir.`,
        });
      }
    }

    const concentrationRisk = diversificationScore < 50 ? 100 - diversificationScore : 100 - diversificationScore;

    if (positions.length <= 3) {
      recommendations.push({
        type: 'increase',
        reason: 'Yetersiz çeşitlendirme',
        priority: 'high',
        details: `Portföyde sadece ${positions.length} pozisyon var. En az 8-10 farklı hisse ile çeşitlendirme artırılmalı.`,
      });
    }

    if (diversificationScore < 50) {
      recommendations.push({
        type: 'rebalance',
        reason: 'Düşük çeşitlendirme skoru',
        priority: 'high',
        details: `Çeşitlendirme skoru ${diversificationScore}/100. Farklı sektörlerden yeni pozisyonlar eklenmeli.`,
      });
    }

    if (volatility > 0.3) {
      recommendations.push({
        type: 'reduce',
        reason: 'Yüksek volatilite',
        priority: 'medium',
        details: `Portföy volatilitesi %${(volatility * 100).toFixed(1)} — yüksek risk iştahı gerektiriyor. Düşük beta hisselere yönelin.`,
      });
    }

    if (maxDrawdown > 20) {
      recommendations.push({
        type: 'watch',
        reason: 'Yüksek drawdown geçmişi',
        priority: 'medium',
        details: `Maksimum düşüş %${maxDrawdown.toFixed(1)}. Stop-loss seviyeleri gözden geçirilmeli.`,
      });
    }

    if (riskScore > 60) {
      recommendations.push({
        type: 'reduce',
        reason: 'Yüksek risk skoru',
        priority: 'high',
        details: `Risk skoru ${riskScore}/100 ile yüksek seviyede. Daha düşük riskli varlıklara geçiş düşünülmeli.`,
      });
    }

    const totalWeight = positions.reduce((s, p) => s + p.weight, 0);
    const cashRatio = totalValue > 0 ? Math.max(0, 1 - totalWeight) : 1;

    let cashSuggestion = '';
    if (cashRatio > 0.3) {
      cashSuggestion = `Nakit oranı %${(cashRatio * 100).toFixed(0)} ile yüksek. Piyasa fırsatları için kullanılabilir.`;
      recommendations.push({
        type: 'increase',
        reason: 'Yüksek nakit oranı',
        priority: 'medium',
        details: cashSuggestion,
      });
    } else if (cashRatio < 0.05) {
      cashSuggestion = 'Nakit oranı çok düşük. Acil durumlar için %5-10 nakit tutulması önerilir.';
      recommendations.push({
        type: 'rebalance',
        reason: 'Düşük nakit oranı',
        priority: 'low',
        details: cashSuggestion,
      });
    } else {
      cashSuggestion = `Nakit oranı %${(cashRatio * 100).toFixed(0)} ile dengeli.`;
    }

    const expectedReturn = sharpeRatio * volatility * 252;
    const riskReward = sharpeRatio;

    const correlationNotes: string[] = [];
    if (sectors.length <= 2) {
      correlationNotes.push('Az sayıda sektör — pozisyonlar arasında yüksek korelasyon beklenir.');
    }
    if (diversificationScore < 40) {
      correlationNotes.push('Düşük çeşitlendirme — varlıklar arası korelasyon muhtemelen yüksek.');
    }

    for (const pos of positions) {
      if (pos.unrealizedPnlPercent && pos.unrealizedPnlPercent > 20) {
        recommendations.push({
          type: 'watch',
          symbol: pos.symbol,
          reason: 'Yüksek kar',
          priority: 'low',
          details: `${pos.symbol} %${pos.unrealizedPnlPercent.toFixed(1)} karda. Kâr realizasyonu düşünülebilir.`,
        });
      }
      if (pos.unrealizedPnlPercent && pos.unrealizedPnlPercent < -15) {
        recommendations.push({
          type: 'reduce',
          symbol: pos.symbol,
          reason: 'Yüksek zarar',
          priority: 'medium',
          details: `${pos.symbol} %${Math.abs(pos.unrealizedPnlPercent).toFixed(1)} zararda. Stop-loss seviyesi kontrol edilmeli.`,
        });
      }
      if (pos.weight > 15) {
        recommendations.push({
          type: 'reduce',
          symbol: pos.symbol,
          reason: 'Aşırı pozisyon büyüklüğü',
          priority: 'high',
          details: `${pos.symbol} portföyün %${pos.weight.toFixed(1)}'ini oluşturuyor. Tek bir hisseye %10'dan fazla yatırım önerilmez.`,
        });
      }
    }

    return {
      portfolioId,
      portfolioName,
      concentrationRisk: Math.min(100, concentrationRisk),
      sectorImbalance,
      correlationNotes,
      cashRatio,
      cashSuggestion,
      volatility,
      expectedReturn: Math.max(-100, Math.min(100, expectedReturn)),
      riskScore,
      riskReward,
      diversificationScore,
      recommendations,
    };
  }
}
