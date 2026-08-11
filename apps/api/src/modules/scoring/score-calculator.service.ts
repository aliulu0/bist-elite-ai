import {
  ScoreDimension,
  ScoreResult,
  ScorePipelineInput,
  HistoricalPricePoint,
  FinancialSnapshot,
  VerificationSnapshot,
  CatalystSnapshot,
  IndicatorSnapshot,
} from './scoring-types';

export class ScoreCalculator {
  calculateTechnical(input: ScorePipelineInput): ScoreResult {
    const indicators = input.indicators;
    const prices = input.historicalPrices;

    if (indicators?.sma20 != null && indicators?.sma50 != null && input.price != null) {
      const deviationFromSma20 = (input.price - indicators.sma20) / indicators.sma20;
      const score = Math.max(0, Math.min(100, 50 + deviationFromSma20 * 200));
      return {
        dimension: 'technical',
        score: Math.round(score),
        label: 'Teknik Puan',
        details: { price: input.price, sma20: indicators.sma20, sma50: indicators.sma50, deviationFromSma20: Math.round(deviationFromSma20 * 1000) / 1000, source: 'indicators' },
      };
    }

    if (prices && prices.length >= 2) {
      const current = prices[prices.length - 1].close;
      const sma20 = this.sma(prices.map((p) => p.close), 20);
      const sma50 = this.sma(prices.map((p) => p.close), 50);
      if (sma20 != null && sma50 != null) {
        const deviationFromSma20 = (current - sma20) / sma20;
        const score = Math.max(0, Math.min(100, 50 + deviationFromSma20 * 200));
        return {
          dimension: 'technical',
          score: Math.round(score),
          label: 'Teknik Puan',
          details: { currentPrice: current, sma20, sma50, deviationFromSma20: Math.round(deviationFromSma20 * 1000) / 1000, source: 'historical' },
        };
      }
    }

    return this.nullScore('technical', 'Teknik veri mevcut değil (geçmiş fiyat veya indikatör gerekli)');
  }

  calculateFundamental(input: ScorePipelineInput): ScoreResult {
    const f = input.financials;
    if (!f) {
      return this.nullScore('fundamental', 'Temel veri mevcut değil (finansal tablolar gerekli)');
    }
    const factors: number[] = [];
    if (f.peRatio != null && f.peRatio > 0 && f.peRatio < 100) {
      factors.push(Math.max(0, 100 - Math.abs(f.peRatio - 20) * 3));
    }
    if (f.debtToEquity != null && f.debtToEquity >= 0) {
      factors.push(Math.max(0, 100 - f.debtToEquity * 5));
    }
    if (f.revenueGrowth != null) {
      factors.push(Math.max(0, Math.min(100, 50 + f.revenueGrowth * 5)));
    }
    if (f.netMargin != null) {
      factors.push(Math.max(0, Math.min(100, f.netMargin * 5)));
    }
    if (f.roe != null && f.roe > 0) {
      factors.push(Math.min(100, f.roe * 5));
    }
    if (f.ebitda != null && f.ebitda > 0) {
      factors.push(Math.min(100, Math.log10(f.ebitda + 1) / 10 * 100));
    }
    if (f.freeCashFlow != null && f.freeCashFlow > 0) {
      factors.push(Math.min(100, Math.log10(f.freeCashFlow + 1) / 10 * 100));
    }
    if (f.revenue != null && f.revenue > 0) {
      factors.push(Math.min(100, Math.log10(f.revenue + 1) / 10 * 100));
    }
    if (factors.length === 0) {
      return this.nullScore('fundamental', 'Hesaplanacak temel gösterge yok');
    }
    const score = factors.reduce((a, b) => a + b, 0) / factors.length;
    return {
      dimension: 'fundamental',
      score: Math.round(score),
      label: 'Temel Puan',
      details: { factorsCount: factors.length, avgFactorScore: Math.round(score), source: 'aggregation' },
    };
  }

  calculateVerification(input: ScorePipelineInput): ScoreResult {
    const v = input.verificationData;
    if (!v) {
      return this.nullScore('verification', 'Doğrulama verisi mevcut değil (Verification Engine gerekli)');
    }
    if (v.sourceCount === 0) {
      return this.nullScore('verification', 'Kaynak yok');
    }
    const coverageRatio = v.verifiedCount / Math.max(1, v.sourceCount);
    const confidenceBonus = (v.confidence ?? 0.5) * 20;
    const score = Math.max(0, Math.min(100, coverageRatio * 70 + confidenceBonus + Math.min(10, v.verifiedCount) * 2));
    return {
      dimension: 'verification',
      score: Math.round(score),
      label: 'Doğrulama Puanı',
      details: { sourceCount: v.sourceCount, verifiedCount: v.verifiedCount, coverageRatio: Math.round(coverageRatio * 100) / 100, confidence: v.confidence, source: 'verification-engine' },
    };
  }

  calculateCatalyst(input: ScorePipelineInput): ScoreResult {
    const c = input.catalystData;
    if (!c) {
      return this.nullScore('catalyst', 'Katalizör verisi mevcut değil (Catalyst Engine gerekli)');
    }
    if (c.count === 0) {
      return { dimension: 'catalyst', score: 0, label: 'Katalizör Puanı', details: { count: 0, message: 'Katalizör bulunamadı', source: 'catalyst-engine' } };
    }
    const bullishRatio = c.bullishCount / Math.max(1, c.count);
    const baseScore = Math.min(100, c.count * 10 + bullishRatio * 40);
    return {
      dimension: 'catalyst',
      score: Math.round(baseScore),
      label: 'Katalizör Puanı',
      details: { count: c.count, bullishCount: c.bullishCount, bearishCount: c.bearishCount, bullishRatio: Math.round(bullishRatio * 100) / 100, strongestType: c.strongestType, source: 'catalyst-engine' },
    };
  }

  calculateLiquidity(input: ScorePipelineInput): ScoreResult {
    if (input.volume == null && input.marketCap == null) {
      return this.nullScore('liquidity', 'Likidite verisi mevcut değil (hacim veya piyasa değeri gerekli)');
    }
    const factors: number[] = [];
    if (input.volume != null && input.volume > 0) {
      factors.push(Math.min(100, Math.log10(input.volume + 1) / 6 * 100));
    }
    if (input.marketCap != null && input.marketCap > 0) {
      factors.push(Math.min(100, Math.log10(input.marketCap + 1) / 12 * 100));
    }
    if (factors.length === 0) {
      return this.nullScore('liquidity', 'Likidite hesaplanamadı');
    }
    const score = factors.reduce((a, b) => a + b, 0) / factors.length;
    return {
      dimension: 'liquidity',
      score: Math.round(score),
      label: 'Likidite Puanı',
      details: { volume: input.volume, marketCap: input.marketCap, factorsCount: factors.length, source: 'market-data' },
    };
  }

  calculateRisk(input: ScorePipelineInput): ScoreResult {
    const f = input.financials;
    const indicators = input.indicators;
    const factors: number[] = [];
    if (f?.debtToEquity != null && f.debtToEquity >= 0) {
      factors.push(Math.max(0, 100 - f.debtToEquity * 4));
    }
    if (f?.peRatio != null && f.peRatio > 0) {
      factors.push(Math.max(0, 100 - Math.abs(f.peRatio - 25) * 2));
    }
    if (indicators?.atr != null && input.price != null && input.price > 0) {
      const atrRatio = indicators.atr / input.price;
      factors.push(Math.max(0, 100 - atrRatio * 500));
    }
    if (input.historicalPrices && input.historicalPrices.length >= 2) {
      const returns = this.calculateReturns(input.historicalPrices.map((p) => p.close));
      if (returns.length > 1) {
        const volatility = this.standardDeviation(returns);
        factors.push(Math.max(0, 100 - volatility * 500));
      }
    }
    if (factors.length === 0) {
      return this.nullScore('risk', 'Risk verisi mevcut değil');
    }
    const score = factors.reduce((a, b) => a + b, 0) / factors.length;
    return {
      dimension: 'risk',
      score: Math.round(score),
      label: 'Risk Puanı',
      details: { factorsCount: factors.length, avgRiskScore: Math.round(score), source: 'financials+indicators' },
    };
  }

  calculateVolume(input: ScorePipelineInput): ScoreResult {
    if (input.volume == null) {
      return this.nullScore('volume', 'Hacim verisi mevcut değil');
    }
    const prices = input.historicalPrices;
    const indicators = input.indicators;

    if (indicators?.obv != null && input.volume > 0) {
      const obvScore = Math.min(100, Math.log10(Math.abs(indicators.obv) + 1) / 6 * 100);
      return {
        dimension: 'volume',
        score: Math.round(obvScore),
        label: 'Hacim Puanı',
        details: { volume: input.volume, obv: indicators.obv, source: 'indicator-engine' },
      };
    }

    if (prices && prices.length >= 5) {
      const avgVol = prices.slice(-20).reduce((s, p) => s + p.volume, 0) / Math.min(20, prices.length);
      const ratio = avgVol > 0 ? input.volume / avgVol : 0;
      const score = Math.max(0, Math.min(100, 50 + (ratio - 1) * 50));
      return {
        dimension: 'volume',
        score: Math.round(score),
        label: 'Hacim Puanı',
        details: { volume: input.volume, avgVolume: Math.round(avgVol), ratio: Math.round(ratio * 100) / 100, source: 'historical' },
      };
    }

    const score = Math.min(100, Math.log10(input.volume + 1) / 5 * 100);
    return { dimension: 'volume', score: Math.round(score), label: 'Hacim Puanı', details: { volume: input.volume, note: 'Tarihsel veri yok, log ölçekli', source: 'market-data' } };
  }

  calculateMomentum(input: ScorePipelineInput): ScoreResult {
    const indicators = input.indicators;
    const prices = input.historicalPrices;

    if (indicators?.roc != null) {
      const rocScore = Math.max(0, Math.min(100, 50 + indicators.roc * 5));
      return {
        dimension: 'momentum',
        score: Math.round(rocScore),
        label: 'Momentum Puanı',
        details: { roc: indicators.roc, source: 'indicator-engine' },
      };
    }

    if (indicators?.macd != null && indicators?.macdSignal != null) {
      const macdDiff = indicators.macd - indicators.macdSignal;
      const macdScore = Math.max(0, Math.min(100, 50 + macdDiff * 100));
      return {
        dimension: 'momentum',
        score: Math.round(macdScore),
        label: 'Momentum Puanı',
        details: { macd: indicators.macd, macdSignal: indicators.macdSignal, histogram: indicators.macdHistogram, source: 'indicator-engine' },
      };
    }

    if (prices && prices.length >= 5) {
      const current = prices[prices.length - 1].close;
      const past10 = prices.length >= 10 ? prices[prices.length - 10].close : prices[0].close;
      const past20 = prices.length >= 20 ? prices[prices.length - 20].close : prices[0].close;
      const change10 = past10 > 0 ? (current - past10) / past10 : 0;
      const change20 = past20 > 0 ? (current - past20) / past20 : 0;
      const momentum = (change10 * 0.6 + change20 * 0.4) * 100;
      const score = Math.max(0, Math.min(100, 50 + momentum));
      return {
        dimension: 'momentum',
        score: Math.round(score),
        label: 'Momentum Puanı',
        details: { change10d: Math.round(change10 * 1000) / 1000, change20d: Math.round(change20 * 1000) / 1000, momentum: Math.round(momentum * 10) / 10, source: 'historical' },
      };
    }

    return this.nullScore('momentum', 'Momentum hesaplanmak için tarihsel veri veya indikatör gerekli');
  }

  calculateTrend(input: ScorePipelineInput): ScoreResult {
    const indicators = input.indicators;
    const prices = input.historicalPrices;

    if (indicators?.sma20 != null && indicators?.sma50 != null && input.price != null) {
      const aboveSma20 = input.price > indicators.sma20 ? 1 : 0;
      const aboveSma50 = input.price > indicators.sma50 ? 1 : 0;
      const smaDirection = indicators.sma20 > indicators.sma50 ? 1 : indicators.sma20 < indicators.sma50 ? -1 : 0;
      const trendStrength = (aboveSma20 + aboveSma50 + (smaDirection > 0 ? 1 : smaDirection < 0 ? -1 : 0) + 3) / 6;
      const score = Math.max(0, Math.min(100, trendStrength * 100));
      return {
        dimension: 'trend',
        score: Math.round(score),
        label: 'Trend Puanı',
        details: { aboveSma20, aboveSma50, smaDirection, trendStrength: Math.round(trendStrength * 100) / 100, source: 'indicator-engine' },
      };
    }

    if (prices && prices.length >= 10) {
      const closes = prices.map((p) => p.close);
      const sma10 = this.sma(closes, 10);
      const sma30 = this.sma(closes, 30);
      if (sma10 != null && sma30 != null) {
        const current = closes[closes.length - 1];
        const aboveSma10 = current > sma10 ? 1 : 0;
        const aboveSma30 = current > sma30 ? 1 : 0;
        const smaDirection = sma10 > sma30 ? 1 : sma10 < sma30 ? -1 : 0;
        const trendStrength = (aboveSma10 + aboveSma30 + (smaDirection > 0 ? 1 : smaDirection < 0 ? -1 : 0) + 3) / 6;
        const score = Math.max(0, Math.min(100, trendStrength * 100));
        return {
          dimension: 'trend',
          score: Math.round(score),
          label: 'Trend Puanı',
          details: { aboveSma10, aboveSma30, smaDirection, trendStrength: Math.round(trendStrength * 100) / 100, source: 'historical' },
        };
      }
    }

    return this.nullScore('trend', 'Trend hesaplanmak için tarihsel veri veya indikatör gerekli');
  }

  calculateQuality(input: ScorePipelineInput): ScoreResult {
    const f = input.financials;
    const factors: number[] = [];
    if (f?.roe != null && f.roe > 0) {
      factors.push(Math.min(100, f.roe * 4));
    }
    if (f?.netMargin != null) {
      factors.push(Math.max(0, Math.min(100, f.netMargin * 5)));
    }
    if (f?.revenueGrowth != null) {
      factors.push(Math.max(0, Math.min(100, f.revenueGrowth * 3)));
    }
    if (f?.pbRatio != null && f.pbRatio > 0) {
      factors.push(Math.max(0, 100 - f.pbRatio * 10));
    }
    if (f?.dividendYield != null && f.dividendYield >= 0) {
      factors.push(Math.min(100, f.dividendYield * 10));
    }
    if (f?.ebitda != null && f.ebitda > 0) {
      factors.push(Math.min(100, Math.log10(f.ebitda + 1) / 10 * 100));
    }
    if (f?.freeCashFlow != null && f.freeCashFlow > 0) {
      factors.push(Math.min(100, Math.log10(f.freeCashFlow + 1) / 10 * 100));
    }
    if (factors.length === 0) {
      return this.nullScore('quality', 'Kalite göstergesi mevcut değil');
    }
    const score = factors.reduce((a, b) => a + b, 0) / factors.length;
    return {
      dimension: 'quality',
      score: Math.round(score),
      label: 'Kalite Puanı',
      details: { factorsCount: factors.length, avgQualityScore: Math.round(score), source: 'aggregation' },
    };
  }

  calculateAll(input: ScorePipelineInput): ScoreResult[] {
    return [
      this.calculateTechnical(input),
      this.calculateFundamental(input),
      this.calculateVerification(input),
      this.calculateCatalyst(input),
      this.calculateLiquidity(input),
      this.calculateRisk(input),
      this.calculateVolume(input),
      this.calculateMomentum(input),
      this.calculateTrend(input),
      this.calculateQuality(input),
    ];
  }

  private nullScore(dimension: ScoreDimension, reason: string): ScoreResult {
    return { dimension, score: null, label: this.dimensionLabel(dimension), details: { reason } };
  }

  private dimensionLabel(d: ScoreDimension): string {
    const labels: Record<ScoreDimension, string> = {
      technical: 'Teknik Puan',
      fundamental: 'Temel Puan',
      verification: 'Doğrulama Puanı',
      catalyst: 'Katalizör Puanı',
      liquidity: 'Likidite Puanı',
      risk: 'Risk Puanı',
      volume: 'Hacim Puanı',
      momentum: 'Momentum Puanı',
      trend: 'Trend Puanı',
      quality: 'Kalite Puanı',
    };
    return labels[d];
  }

  private sma(values: number[], period: number): number | null {
    if (values.length < period) return null;
    const slice = values.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  private calculateReturns(closes: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      const prev = closes[i - 1];
      if (prev > 0) returns.push((closes[i] - prev) / prev);
    }
    return returns;
  }

  private standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sqDiffs = values.map((v) => (v - mean) ** 2);
    return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
  }
}