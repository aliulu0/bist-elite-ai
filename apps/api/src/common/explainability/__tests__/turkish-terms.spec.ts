import {
  TREND_TRANSLATIONS,
  MOMENTUM_TRANSLATIONS,
  VOLUME_TRANSLATIONS,
  RISK_TRANSLATIONS,
  RISK_SEVERITY_TRANSLATIONS,
  SIGNAL_TRANSLATIONS,
  STRENGTH_TRANSLATIONS,
  INDICATOR_NAMES,
  getTrendDescription,
  getMomentumDescription,
  getVolumeDescription,
  getRiskDescription,
  getSignalDescription,
  getAgreementDescription,
  getConfidenceDescription,
  getRiskRewardDescription,
  getDisclaimer,
} from '../turkish-terms';
import {
  TrendDirection,
  MomentumState,
  VolumeState,
  RiskType,
  RiskSeverity,
  SignalAction,
  SignalStrength,
} from '../types';

describe('Turkish Terms', () => {
  describe('TREND_TRANSLATIONS', () => {
    it('has Turkish translations for all trend directions', () => {
      expect(TREND_TRANSLATIONS[TrendDirection.STRONG_UPTREND]).toBe('Güçlü yükseliş trendi');
      expect(TREND_TRANSLATIONS[TrendDirection.UPTREND]).toBe('Yükseliş trendi');
      expect(TREND_TRANSLATIONS[TrendDirection.WEAK_UPTREND]).toBe('Zayıf yükseliş eğilimi');
      expect(TREND_TRANSLATIONS[TrendDirection.SIDEWAYS]).toBe('Yatay hareket');
      expect(TREND_TRANSLATIONS[TrendDirection.WEAK_DOWNTREND]).toBe('Zayıf düşüş eğilimi');
      expect(TREND_TRANSLATIONS[TrendDirection.DOWNTREND]).toBe('Düşüş trendi');
      expect(TREND_TRANSLATIONS[TrendDirection.STRONG_DOWNTREND]).toBe('Güçlü düşüş trendi');
    });
  });

  describe('MOMENTUM_TRANSLATIONS', () => {
    it('has Turkish translations for all momentum states', () => {
      expect(MOMENTUM_TRANSLATIONS[MomentumState.OVERBOUGHT]).toBe('Aşırı alım bölgesi');
      expect(MOMENTUM_TRANSLATIONS[MomentumState.BULLISH_MOMENTUM]).toBe('Yükseliş momentumu');
      expect(MOMENTUM_TRANSLATIONS[MomentumState.NEUTRAL]).toBe('Nötr bölge');
      expect(MOMENTUM_TRANSLATIONS[MomentumState.BEARISH_MOMENTUM]).toBe('Düşüş momentumu');
      expect(MOMENTUM_TRANSLATIONS[MomentumState.OVERSOLD]).toBe('Aşırı satım bölgesi');
    });
  });

  describe('VOLUME_TRANSLATIONS', () => {
    it('has Turkish translations for all volume states', () => {
      expect(VOLUME_TRANSLATIONS[VolumeState.HIGH_VOLUME]).toBe('Yüksek işlem hacmi');
      expect(VOLUME_TRANSLATIONS[VolumeState.NORMAL_VOLUME]).toBe('Normal işlem hacmi');
      expect(VOLUME_TRANSLATIONS[VolumeState.LOW_VOLUME]).toBe('Düşük işlem hacmi');
      expect(VOLUME_TRANSLATIONS[VolumeState.DECLINING]).toBe('Azalan işlem hacmi');
      expect(VOLUME_TRANSLATIONS[VolumeState.INCREASING]).toBe('Artan işlem hacmi');
    });
  });

  describe('RISK_TRANSLATIONS', () => {
    it('has Turkish translations for all risk types', () => {
      expect(RISK_TRANSLATIONS[RiskType.TREND_RISK]).toBe('Trend Riski');
      expect(RISK_TRANSLATIONS[RiskType.VOLATILITY_RISK]).toBe('Volatilite Riski');
      expect(RISK_TRANSLATIONS[RiskType.LIQUIDITY_RISK]).toBe('Likidite Riski');
      expect(RISK_TRANSLATIONS[RiskType.FALSE_BREAKOUT_RISK]).toBe('Yanlış Kırılma Riski');
      expect(RISK_TRANSLATIONS[RiskType.FALSE_SIGNAL_RISK]).toBe('Yanlış Sinyal Riski');
      expect(RISK_TRANSLATIONS[RiskType.TIMEFRAME_CONFLICT]).toBe('Zaman Uyumsuzluğu');
      expect(RISK_TRANSLATIONS[RiskType.MARKET_UNCERTAINTY]).toBe('Piyasa Belirsizliği');
    });
  });

  describe('RISK_SEVERITY_TRANSLATIONS', () => {
    it('has Turkish translations for all severity levels', () => {
      expect(RISK_SEVERITY_TRANSLATIONS[RiskSeverity.LOW]).toBe('Düşük');
      expect(RISK_SEVERITY_TRANSLATIONS[RiskSeverity.MEDIUM]).toBe('Orta');
      expect(RISK_SEVERITY_TRANSLATIONS[RiskSeverity.HIGH]).toBe('Yüksek');
      expect(RISK_SEVERITY_TRANSLATIONS[RiskSeverity.CRITICAL]).toBe('Kritik');
    });
  });

  describe('SIGNAL_TRANSLATIONS', () => {
    it('has Turkish translations for all signal actions', () => {
      expect(SIGNAL_TRANSLATIONS[SignalAction.BUY]).toBe('Alım');
      expect(SIGNAL_TRANSLATIONS[SignalAction.SELL]).toBe('Satım');
      expect(SIGNAL_TRANSLATIONS[SignalAction.HOLD]).toBe('Bekleme');
      expect(SIGNAL_TRANSLATIONS[SignalAction.WATCH]).toBe('İzleme');
    });
  });

  describe('STRENGTH_TRANSLATIONS', () => {
    it('has Turkish translations for all signal strengths', () => {
      expect(STRENGTH_TRANSLATIONS[SignalStrength.WEAK]).toBe('Zayıf');
      expect(STRENGTH_TRANSLATIONS[SignalStrength.MODERATE]).toBe('Orta');
      expect(STRENGTH_TRANSLATIONS[SignalStrength.STRONG]).toBe('Güçlü');
      expect(STRENGTH_TRANSLATIONS[SignalStrength.VERY_STRONG]).toBe('Çok Güçlü');
    });
  });

  describe('INDICATOR_NAMES', () => {
    it('has Turkish names for all indicators', () => {
      expect(INDICATOR_NAMES['RSI']).toContain('RSI');
      expect(INDICATOR_NAMES['MACD']).toContain('MACD');
      expect(INDICATOR_NAMES['EMA']).toContain('EMA');
      expect(INDICATOR_NAMES['SMA']).toContain('SMA');
      expect(INDICATOR_NAMES['BollingerBands']).toContain('Bollinger');
      expect(INDICATOR_NAMES['ATR']).toContain('ATR');
      expect(INDICATOR_NAMES['ADX']).toContain('ADX');
      expect(INDICATOR_NAMES['VWAP']).toContain('VWAP');
      expect(INDICATOR_NAMES['Stochastic']).toContain('Stochastic');
      expect(INDICATOR_NAMES['Ichimoku']).toContain('Ichimoku');
    });
  });

  describe('getTrendDescription', () => {
    it('generates Turkish description for strong uptrend', () => {
      const desc = getTrendDescription(TrendDirection.STRONG_UPTREND, 85);
      expect(desc).toContain('Güçlü yükseliş trendi');
      expect(desc).toContain('Teknik göstergelerin çoğunluğu');
      expect(desc).toContain('yükseliş yönünde sinyal üretiyor');
    });

    it('generates Turkish description for strong downtrend', () => {
      const desc = getTrendDescription(TrendDirection.STRONG_DOWNTREND, 20);
      expect(desc).toContain('Güçlü düşüş trendi');
      expect(desc).toContain('Güçlü satış baskısı');
    });

    it('generates Turkish description for sideways', () => {
      const desc = getTrendDescription(TrendDirection.SIDEWAYS, 50);
      expect(desc).toContain('Yatay hareket');
      expect(desc).toContain('Belirgin bir yön yok');
    });

    it('generates Turkish description for weak uptrend', () => {
      const desc = getTrendDescription(TrendDirection.WEAK_UPTREND, 40);
      expect(desc).toContain('Zayıf yükseliş eğilimi');
    });
  });

  describe('getMomentumDescription', () => {
    it('generates Turkish description for overbought with RSI', () => {
      const desc = getMomentumDescription(MomentumState.OVERBOUGHT, 75);
      expect(desc).toContain('Aşırı alım bölgesi');
      expect(desc).toContain('RSI 75');
      expect(desc).toContain('Kar satışları');
    });

    it('generates Turkish description for oversold with RSI', () => {
      const desc = getMomentumDescription(MomentumState.OVERSOLD, 25);
      expect(desc).toContain('Aşırı satım bölgesi');
      expect(desc).toContain('RSI 25');
    });

    it('generates Turkish description for neutral', () => {
      const desc = getMomentumDescription(MomentumState.NEUTRAL);
      expect(desc).toContain('Nötr bölge');
    });

    it('includes MACD value when provided', () => {
      const desc = getMomentumDescription(MomentumState.BULLISH_MOMENTUM, 60, 1.25);
      expect(desc).toContain('MACD 1,25');
    });
  });

  describe('getVolumeDescription', () => {
    it('returns Turkish translation for volume state', () => {
      expect(getVolumeDescription(VolumeState.HIGH_VOLUME)).toBe('Yüksek işlem hacmi');
      expect(getVolumeDescription(VolumeState.LOW_VOLUME)).toBe('Düşük işlem hacmi');
      expect(getVolumeDescription(VolumeState.INCREASING)).toBe('Artan işlem hacmi');
    });
  });

  describe('getRiskDescription', () => {
    it('generates Turkish description for each risk type', () => {
      const trendRisk = getRiskDescription(RiskType.TREND_RISK, RiskSeverity.HIGH);
      expect(trendRisk).toContain('Trend Riski');
      expect(trendRisk).toContain('Yüksek');

      const volRisk = getRiskDescription(RiskType.VOLATILITY_RISK, RiskSeverity.MEDIUM);
      expect(volRisk).toContain('Volatilite Riski');
      expect(volRisk).toContain('Orta');
    });

    it('includes mitigation guidance', () => {
      const falseBreakout = getRiskDescription(RiskType.FALSE_BREAKOUT_RISK, RiskSeverity.HIGH);
      expect(falseBreakout).toContain('Onay beklendiğinde');
    });
  });

  describe('getSignalDescription', () => {
    it('generates Turkish description for buy signal', () => {
      const desc = getSignalDescription(SignalAction.BUY, SignalStrength.STRONG);
      expect(desc).toContain('Güçlü');
      expect(desc).toContain('Alım');
      expect(desc).toContain('Giriş fiyatı');
    });

    it('generates Turkish description for sell signal', () => {
      const desc = getSignalDescription(SignalAction.SELL, SignalStrength.MODERATE);
      expect(desc).toContain('Orta');
      expect(desc).toContain('Satım');
    });

    it('generates Turkish description for hold signal', () => {
      const desc = getSignalDescription(SignalAction.HOLD, SignalStrength.WEAK);
      expect(desc).toContain('Bekleme');
      expect(desc).toContain('Mevcut pozisyon korunmalı');
    });

    it('generates Turkish description for watch signal', () => {
      const desc = getSignalDescription(SignalAction.WATCH, SignalStrength.MODERATE);
      expect(desc).toContain('İzleme');
      expect(desc).toContain('izleme listesine');
    });
  });

  describe('getAgreementDescription', () => {
    it('describes strong agreement', () => {
      const desc = getAgreementDescription(0.90);
      expect(desc).toContain('güçlü uyum');
    });

    it('describes moderate agreement', () => {
      const desc = getAgreementDescription(0.70);
      expect(desc).toContain('genel uyum');
    });

    it('describes conflict', () => {
      const desc = getAgreementDescription(0.50);
      expect(desc).toContain('çelişkiler');
    });

    it('describes strong conflict', () => {
      const desc = getAgreementDescription(0.30);
      expect(desc).toContain('güçlü çelişkiler');
    });
  });

  describe('getConfidenceDescription', () => {
    it('describes high confidence', () => {
      const desc = getConfidenceDescription(0.85);
      expect(desc).toContain('Yüksek güven');
      expect(desc).toContain('güçlü uyum');
    });

    it('describes medium confidence', () => {
      const desc = getConfidenceDescription(0.60);
      expect(desc).toContain('Orta güven');
    });

    it('describes low confidence', () => {
      const desc = getConfidenceDescription(0.35);
      expect(desc).toContain('Düşük güven');
    });

    it('describes very low confidence', () => {
      const desc = getConfidenceDescription(0.15);
      expect(desc).toContain('Çok düşük güven');
    });
  });

  describe('getRiskRewardDescription', () => {
    it('describes excellent risk/reward', () => {
      const desc = getRiskRewardDescription(3.5);
      expect(desc).toContain('3,50');
      expect(desc).toContain('çok cazip');
    });

    it('describes good risk/reward', () => {
      const desc = getRiskRewardDescription(2.2);
      expect(desc).toContain('2,20');
      expect(desc).toContain('kabul edilebilir');
    });

    it('describes balanced risk/reward', () => {
      const desc = getRiskRewardDescription(1.2);
      expect(desc).toContain('1,20');
      expect(desc).toContain('dengeli');
    });

    it('describes poor risk/reward', () => {
      const desc = getRiskRewardDescription(0.8);
      expect(desc).toContain('0,80');
      expect(desc).toContain('düşük');
    });

    it('returns empty string for undefined ratio', () => {
      expect(getRiskRewardDescription(undefined)).toBe('');
    });
  });

  describe('getDisclaimer', () => {
    it('returns Turkish disclaimer text', () => {
      const disclaimer = getDisclaimer();
      expect(disclaimer).toContain('yatırım tavsiyesi');
      expect(disclaimer).toContain('bilgilendirme');
      expect(disclaimer).toContain('Geçmiş performans');
    });
  });
});
