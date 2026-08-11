import { TCMBDecisionAnalyzer } from '../engines/tcmb-decision-analyzer';

describe('TCMBDecisionAnalyzer', () => {
  let analyzer: TCMBDecisionAnalyzer;

  beforeEach(() => {
    analyzer = new TCMBDecisionAnalyzer();
  });

  describe('hawkish detection', () => {
    it('should detect hawkish tone from tight stance keywords', () => {
      const text =
        'Kurul, enflasyon beklentileri ve yukarı yönlü riskleri dikkate alarak parasal sıkılaşma sürecinin devamına karar vermiştir. Sıkı para politikası duruşu kalıcı olacaktır.';
      const result = analyzer.analyze(text);
      expect(result.sentiment).toBe('hawkish');
      expect(result.hawkishScore).toBeGreaterThan(result.dovishScore);
      expect(result.liquidity).toBe('tight');
      expect(result.marketImpact).toBe('negative');
      expect(result.detectedKeywords.length).toBeGreaterThan(0);
    });

    it('should count strong hawkish keywords', () => {
      const text = 'parasal sıkılaşma sıkı duruş ek sıkılaşma enflasyon riski';
      const result = analyzer.analyze(text);
      expect(result.hawkishScore).toBeGreaterThanOrEqual(30);
    });
  });

  describe('dovish detection', () => {
    it('should detect dovish tone from easing keywords', () => {
      const text =
        'Kurul, dezenflasyon sürecinin güçlenmesiyle birlikte parasal genişleme ve faiz indirimi yol haritasını değerlendirmektedir. Sıkılaşmanın sonuna yaklaşılmıştır.';
      const result = analyzer.analyze(text);
      expect(result.sentiment).toBe('dovish');
      expect(result.dovishScore).toBeGreaterThan(result.hawkishScore);
      expect(result.liquidity).toBe('loose');
      expect(result.marketImpact).toBe('positive');
    });
  });

  describe('contextual handling', () => {
    it('should treat temporary inflation as dovish leaning', () => {
      const text = 'Enflasyondaki yükselişin geçici olduğunu değerlendiriyoruz. Kurul temkinli bir görünüm sergilemektedir.';
      const result = analyzer.analyze(text);
      expect(result.sentiment).toBe('dovish_leaning');
      expect(result.dovishScore).toBeGreaterThan(result.hawkishScore);
    });

    it('should treat strong domestic demand as hawkish', () => {
      const text = 'İç talepte güçlü seyir devam etmektedir. Fiyat baskısı sürmektedir.';
      const result = analyzer.analyze(text);
      expect(result.sentiment).toBe('hawkish_leaning');
    });

    it('should treat weak domestic demand as dovish', () => {
      const text = 'İç talep zayıf seyretmektedir. Zayıflayan talep koşulları nedeniyle riskler aşağı yönlüdür.';
      const result = analyzer.analyze(text);
      expect(result.sentiment).toBe('dovish_leaning');
    });
  });

  describe('neutral', () => {
    it('should return neutral for no strong signals', () => {
      const text = 'Kurul olağan toplantısında ekonomik gelişmeleri değerlendirmiştir.';
      const result = analyzer.analyze(text);
      expect(result.sentiment).toBe('neutral');
      expect(result.liquidity).toBe('neutral');
      expect(result.marketImpact).toBe('neutral');
    });
  });

  describe('scoring bounds', () => {
    it('should cap hawkish score at 100', () => {
      const text = Array(10).fill('parasal sıkılaşma sıkı duruş ek sıkılaşma').join(' ');
      const result = analyzer.analyze(text);
      expect(result.hawkishScore).toBeLessThanOrEqual(100);
      expect(result.hawkishScore).toBeGreaterThan(0);
    });

    it('should expose confidence between 1 and 100', () => {
      const text = 'parasal sıkılaşma dezenflasyon enflasyon';
      const result = analyzer.analyze(text);
      expect(result.confidence).toBeGreaterThanOrEqual(1);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should expose summary text', () => {
      const result = analyzer.analyze('parasal sıkılaşma');
      expect(result.summary).toBeTruthy();
      expect(result.summary).toContain('TCMB');
    });

    it('should expose analyzedAt timestamp', () => {
      const result = analyzer.analyze('parasal sıkılaşma');
      expect(new Date(result.analyzedAt).getTime()).not.toBeNaN();
    });
  });
});
