import { Injectable, Logger } from '@nestjs/common';
import { CentralBank, CentralBankAnalysis, CentralBankTone, MarketImpact } from '../macro.types';

const HAWKISH_KEYWORDS = ['tighten', 'hike', 'inflation risk', 'overheating', 'restrictive', 'withdraw liquidity'];
const DOVISH_KEYWORDS = ['cut', 'ease', 'accommodative', 'support growth', 'stimulus', 'loosen'];
const HAWKISH_LEANING_KEYWORDS = ['cautious', 'gradual', 'monitor', 'data-dependent', 'measured'];
const DOVISH_LEANING_KEYWORDS = ['patient', 'flexible', 'optionality', 'wait-and-see', 'accommodate'];

const SECTOR_KEYWORDS: Record<string, { positive: string[]; negative: string[] }> = {
  banks: { positive: ['bank profitability', 'net interest margin', 'lending'], negative: ['credit risk', 'non-performing'] },
  exporters: { positive: ['export', 'competitive', 'external demand'], negative: ['currency risk', 'import cost'] },
  industrial: { positive: ['production', 'manufacturing', 'capacity'], negative: ['input cost', 'supply chain'] },
  construction: { positive: ['infrastructure', 'housing', 'real estate'], negative: ['construction cost', 'demand slowdown'] },
  technology: { positive: ['digital', 'innovation', 'tech investment'], negative: ['funding cost', 'valuation'] },
  energy: { positive: ['energy investment', 'renewable'], negative: ['energy cost', 'oil price'] },
};

@Injectable()
export class CentralBankNlpEngine {
  private readonly logger = new Logger(CentralBankNlpEngine.name);

  analyze(bank: CentralBank, text: string): CentralBankAnalysis {
    const lower = text.toLowerCase();
    const tone = this.determineTone(lower);
    const confidence = this.computeConfidence(lower);
    const sectorImpacts = this.determineSectorImpacts(lower);

    return {
      bank,
      tone,
      confidence,
      marketImpact: this.toneToMarketImpact(tone),
      sectorImpacts,
      expectedInflation: this.extractInflation(lower),
      expectedGrowth: this.extractGrowth(lower),
      liquidity: confidence > 0.7 && (tone === 'hawkish' || tone === 'hawkish_leaning') ? 'tight' : tone === 'dovish' || tone === 'dovish_leaning' ? 'loose' : 'neutral',
      risk: this.determineRisk(tone, confidence),
      summary: this.generateSummary(bank, tone, confidence),
      analyzedAt: new Date().toISOString(),
    };
  }

  private determineTone(text: string): CentralBankTone {
    const hawkishCount = HAWKISH_KEYWORDS.filter((k) => text.includes(k)).length;
    const dovishCount = DOVISH_KEYWORDS.filter((k) => text.includes(k)).length;
    const hawkishLeaningCount = HAWKISH_LEANING_KEYWORDS.filter((k) => text.includes(k)).length;
    const dovishLeaningCount = DOVISH_LEANING_KEYWORDS.filter((k) => text.includes(k)).length;

    if (hawkishCount > dovishCount && hawkishCount >= 2) return 'hawkish';
    if (dovishCount > hawkishCount && dovishCount >= 2) return 'dovish';
    if (hawkishLeaningCount > dovishLeaningCount && hawkishLeaningCount >= 2) return 'hawkish_leaning';
    if (dovishLeaningCount > hawkishLeaningCount && dovishLeaningCount >= 2) return 'dovish_leaning';
    return 'neutral';
  }

  private computeConfidence(text: string): number {
    const totalKeywords = HAWKISH_KEYWORDS.length + DOVISH_KEYWORDS.length
      + HAWKISH_LEANING_KEYWORDS.length + DOVISH_LEANING_KEYWORDS.length;

    const foundKeywords = [
      ...HAWKISH_KEYWORDS,
      ...DOVISH_KEYWORDS,
      ...HAWKISH_LEANING_KEYWORDS,
      ...DOVISH_LEANING_KEYWORDS,
    ].filter((k) => text.includes(k)).length;

    const ratio = foundKeywords / Math.max(1, totalKeywords);
    const lengthFactor = Math.min(1, text.length / 500);
    return Math.round(Math.min(1, ratio * 2 + lengthFactor * 0.3) * 100) / 100;
  }

  private determineSectorImpacts(text: string): Record<string, MarketImpact> {
    const impacts: Record<string, MarketImpact> = {};
    for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
      const positiveCount = keywords.positive.filter((k) => text.includes(k)).length;
      const negativeCount = keywords.negative.filter((k) => text.includes(k)).length;
      if (positiveCount > negativeCount) impacts[sector] = 'positive';
      else if (negativeCount > positiveCount) impacts[sector] = 'negative';
      else impacts[sector] = 'neutral';
    }
    return impacts;
  }

  private toneToMarketImpact(tone: CentralBankTone): MarketImpact {
    switch (tone) {
      case 'hawkish': return 'negative';
      case 'dovish': return 'positive';
      case 'hawkish_leaning': return 'negative';
      case 'dovish_leaning': return 'positive';
      default: return 'neutral';
    }
  }

  private extractInflation(text: string): number | undefined {
    const match = text.match(/inflation[:\s]*(\d+\.?\d*)/i) || text.match(/(\d+\.?\d*)\s*%/);
    return match ? parseFloat(match[1]) : undefined;
  }

  private extractGrowth(text: string): number | undefined {
    const match = text.match(/growth[:\s]*(\d+\.?\d*)/i) || text.match(/gdp[:\s]*(\d+\.?\d*)/i);
    return match ? parseFloat(match[1]) : undefined;
  }

  private determineRisk(tone: CentralBankTone, confidence: number): 'low' | 'moderate' | 'high' | 'extreme' {
    if (tone === 'hawkish' && confidence > 0.8) return 'high';
    if (tone === 'dovish' && confidence > 0.8) return 'low';
    if (tone === 'neutral') return 'moderate';
    return 'moderate';
  }

  private generateSummary(bank: CentralBank, tone: CentralBankTone, confidence: number): string {
    const toneLabel = tone.replace('_', ' ');
    return `${bank.toUpperCase()} decision analyzed as ${toneLabel} (confidence: ${(confidence * 100).toFixed(0)}%).`;
  }
}
