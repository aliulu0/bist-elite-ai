import { Injectable, Logger } from '@nestjs/common';

export type TCMBSentiment = 'hawkish' | 'dovish' | 'neutral' | 'hawkish_leaning' | 'dovish_leaning';

export type TCMBLiquidity = 'tight' | 'loose' | 'neutral';

export interface TCMBDecisionAnalysis {
  hawkishScore: number;
  dovishScore: number;
  confidence: number;
  detectedKeywords: string[];
  sentiment: TCMBSentiment;
  liquidity: TCMBLiquidity;
  marketImpact: 'positive' | 'negative' | 'neutral';
  risk: 'low' | 'moderate' | 'high' | 'extreme';
  summary: string;
  analyzedAt: string;
}

interface WeightedKeyword {
  text: string;
  weight: number;
}

const HAWKISH_KEYWORDS: WeightedKeyword[] = [
  { text: 'sıkı duruş', weight: 12 },
  { text: 'parasal sıkılaşma', weight: 12 },
  { text: 'sıkılaştırma', weight: 12 },
  { text: 'sıkılaşmanın devamı', weight: 10 },
  { text: 'ek sıkılaşma', weight: 10 },
  { text: 'yukarı yönlü risk', weight: 10 },
  { text: 'enflasyon riski', weight: 8 },
  { text: 'enflasyon beklentileri', weight: 8 },
  { text: 'aşırı ısınma', weight: 8 },
  { text: 'kalıcı', weight: 6 },
  { text: 'yüksek seviyede', weight: 4 },
  { text: 'sıkı', weight: 3 },
];

const DOVISH_KEYWORDS: WeightedKeyword[] = [
  { text: 'parasal genişleme', weight: 12 },
  { text: 'gevşetme', weight: 12 },
  { text: 'faiz indirimi', weight: 12 },
  { text: 'gevşeme', weight: 10 },
  { text: 'sıkılaşmanın sonuna', weight: 10 },
  { text: 'aşağı yönlü risk', weight: 10 },
  { text: 'dezenflasyon sürecinin güçlendi', weight: 8 },
  { text: 'destekleyici para politikası', weight: 8 },
  { text: 'genişleyici', weight: 8 },
  { text: 'resesyon', weight: 6 },
];

const HAWKISH_CONTEXT: WeightedKeyword[] = [
  { text: 'enflasyon', weight: 3 },
  { text: 'fiyat baskısı', weight: 4 },
  { text: 'enflasyonun yüksek', weight: 5 },
  { text: 'ücret artışları', weight: 4 },
  { text: 'talep baskısı', weight: 4 },
];

const DOVISH_CONTEXT: WeightedKeyword[] = [
  { text: 'dezenflasyon', weight: 4 },
  { text: 'geçici', weight: 3 },
  { text: 'zayıflayan talep', weight: 5 },
  { text: 'dış talep', weight: 2 },
  { text: 'ılımlı seyir', weight: 3 },
];

const STRONG_DOMESTIC_DEMAND = ['güçlü', 'güçlen', 'canlı', 'katı', 'yüksek seyir'];
const WEAK_DEMAND = ['zayıf', 'yavaş', 'sınırlı', 'kırılgan', 'ılımlı'];

@Injectable()
export class TCMBDecisionAnalyzer {
  private readonly logger = new Logger(TCMBDecisionAnalyzer.name);

  analyze(text: string): TCMBDecisionAnalysis {
    const lower = this.normalize(text);

    const hawkishMatches = this.matchKeywords(lower, HAWKISH_KEYWORDS);
    const dovishMatches = this.matchKeywords(lower, DOVISH_KEYWORDS);
    const hawkishContext = this.matchKeywords(lower, HAWKISH_CONTEXT);
    const dovishContext = this.matchKeywords(lower, DOVISH_CONTEXT);

    const pairAdjustment = this.analyzeDemandPairs(lower);

    let hawkishScore = hawkishMatches.score + hawkishContext.score + pairAdjustment.hawkish;
    let dovishScore = dovishMatches.score + dovishContext.score + pairAdjustment.dovish;

    hawkishScore = Math.min(100, Math.round(hawkishScore));
    dovishScore = Math.min(100, Math.round(dovishScore));

    const detectedKeywords = [
      ...hawkishMatches.keywords,
      ...dovishMatches.keywords,
      ...hawkishContext.keywords,
      ...dovishContext.keywords,
    ];

    const sentiment = this.determineSentiment(hawkishScore, dovishScore);
    const confidence = this.computeConfidence(detectedKeywords, text);
    const liquidity = this.determineLiquidity(sentiment);
    const marketImpact = this.determineMarketImpact(sentiment);

    return {
      hawkishScore,
      dovishScore,
      confidence,
      detectedKeywords: [...new Set(detectedKeywords)],
      sentiment,
      liquidity,
      marketImpact,
      risk: this.determineRisk(sentiment, confidence),
      summary: this.generateSummary(sentiment, hawkishScore, dovishScore, confidence),
      analyzedAt: new Date().toISOString(),
    };
  }

  private matchKeywords(text: string, keywords: WeightedKeyword[]): { score: number; keywords: string[] } {
    let score = 0;
    const matched: string[] = [];
    for (const keyword of keywords) {
      if (text.includes(keyword.text)) {
        score += keyword.weight;
        matched.push(keyword.text);
      }
    }
    return { score, keywords: matched };
  }

  private analyzeDemandPairs(text: string): { hawkish: number; dovish: number } {
    let hawkish = 0;
    let dovish = 0;

    if (text.includes('iç talep') || text.includes('iç talepteki')) {
      if (STRONG_DOMESTIC_DEMAND.some((w) => text.includes(w))) {
        hawkish += 6;
      } else if (WEAK_DEMAND.some((w) => text.includes(w))) {
        dovish += 6;
      } else {
        hawkish += 2;
      }
    }

    if (text.includes('dış talep')) {
      if (WEAK_DEMAND.some((w) => text.includes(w))) {
        dovish += 4;
      }
    }

    if (text.includes('enflasyon') && text.includes('geçici')) {
      dovish += 6;
      hawkish = -3;
    }

    return { hawkish, dovish };
  }

  private determineSentiment(hawkishScore: number, dovishScore: number): TCMBSentiment {
    const diff = hawkishScore - dovishScore;
    if (diff >= 20) return 'hawkish';
    if (diff <= -20) return 'dovish';
    if (diff >= 8) return 'hawkish_leaning';
    if (diff <= -8) return 'dovish_leaning';
    return 'neutral';
  }

  private computeConfidence(detectedKeywords: string[], text: string): number {
    const keywordFactor = Math.min(70, detectedKeywords.length * 10);
    const lengthFactor = Math.min(30, text.length / 20);
    return Math.min(100, Math.round(keywordFactor + lengthFactor));
  }

  private determineLiquidity(sentiment: TCMBSentiment): TCMBLiquidity {
    if (sentiment === 'hawkish' || sentiment === 'hawkish_leaning') return 'tight';
    if (sentiment === 'dovish' || sentiment === 'dovish_leaning') return 'loose';
    return 'neutral';
  }

  private determineMarketImpact(sentiment: TCMBSentiment): 'positive' | 'negative' | 'neutral' {
    switch (sentiment) {
      case 'hawkish':
      case 'hawkish_leaning':
        return 'negative';
      case 'dovish':
      case 'dovish_leaning':
        return 'positive';
      default:
        return 'neutral';
    }
  }

  private determineRisk(sentiment: TCMBSentiment, confidence: number): 'low' | 'moderate' | 'high' | 'extreme' {
    if (sentiment === 'hawkish' && confidence >= 70) return 'high';
    if (sentiment === 'dovish' && confidence >= 70) return 'low';
    if (sentiment === 'neutral') return 'moderate';
    return 'moderate';
  }

  private generateSummary(
    sentiment: TCMBSentiment,
    hawkishScore: number,
    dovishScore: number,
    confidence: number,
  ): string {
    const labelMap: Record<TCMBSentiment, string> = {
      hawkish: 'şahin',
      dovish: 'güvercin',
      neutral: 'nötr',
      hawkish_leaning: 'şahine yakın',
      dovish_leaning: 'güvercine yakın',
    };
    return `TCMB karar metni ${labelMap[sentiment]} olarak değerlendirildi (şahinlik skoru: ${hawkishScore}, güvercinlik skoru: ${dovishScore}, güven: %${confidence}).`;
  }

  private normalize(text: string): string {
    return text
      .toLocaleLowerCase('tr')
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .replace(/[^\p{L}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
