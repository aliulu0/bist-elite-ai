import { Injectable } from '@nestjs/common';

export interface Intent {
  category: 'stock_analysis' | 'portfolio' | 'macro' | 'sector' | 'risk' | 'scanner' | 'ranking' | 'opportunity' | 'general';
  symbol?: string;
  confidence: number;
  rawQuery: string;
}

@Injectable()
export class QuestionAnalyzerService {
  private readonly borsaSymbols = new Set([
    'ASELS', 'THYAO', 'GARAN', 'AKBNK', 'YKBNK', 'ISCTR', 'SAHOL', 'KCHOL',
    'EREGL', 'BIMAS', 'TCELL', 'SISE', 'KOZAA', 'KOZAL', 'TUPRS', 'PETKM',
    'HEKTS', 'FROTO', 'OTKAR', 'TOASO', 'TTRAK', 'SOKM', 'ULKER', 'MGROS',
    'VESTL', 'ARCLK', 'KRDMD', 'EKGYO', 'TRGYO', 'AKSEN', 'ZOREN',
  ]);

  analyze(message: string): Intent {
    const lower = message.toLowerCase();
    const words = lower.split(/\s+/);

    const symbol = this.extractSymbol(lower);

    if (symbol && (lower.includes('analiz') || lower.includes('neden') || lower.includes('değer') || lower.includes('yorum') || lower.includes('ne düşünüyorsun'))) {
      return { category: 'stock_analysis', symbol, confidence: 0.9, rawQuery: message };
    }

    if (lower.includes('portföy') || lower.includes('portfoy') || lower.includes('portf') || lower.includes('hesap')) {
      return { category: 'portfolio', confidence: 0.85, rawQuery: message };
    }

    if (lower.includes('makro') || lower.includes('ekonomi') || lower.includes('faiz') || lower.includes('enflasyon') || lower.includes('enflasyon') || lower.includes('merkez bankası') || lower.includes('tcmb') || lower.includes('fed') || lower.includes('vi') || lower.includes('cds')) {
      return { category: 'macro', confidence: 0.9, rawQuery: message };
    }

    if (lower.includes('sektör') || lower.includes('sektor') || lower.includes('sektorel') || lower.includes('bankacılık') || lower.includes('teknoloji') || lower.includes('savunma')) {
      return { category: 'sector', confidence: 0.85, rawQuery: message };
    }

    if (lower.includes('risk') || lower.includes('tehlike') || lower.includes('oynaklık') || lower.includes('volatilite')) {
      return { category: 'risk', confidence: 0.8, rawQuery: message };
    }

    if (lower.includes('tara') || lower.includes('taram') || lower.includes('fırsat') || lower.includes('en iyi') || lower.includes('öner')) {
      return { category: 'scanner', confidence: 0.85, rawQuery: message };
    }

    if (lower.includes('sırala') || lower.includes('siral') || lower.includes('sıralama') || lower.includes('en yüksek') || lower.includes('en düşük') || lower.includes('not')) {
      return { category: 'ranking', confidence: 0.8, rawQuery: message };
    }

    if (lower.includes('fırsat') || lower.includes('firsat') || lower.includes('yükseliş') || lower.includes('potansiyel') || lower.includes('al sinyali')) {
      return { category: 'opportunity', confidence: 0.75, rawQuery: message };
    }

    if (symbol) {
      return { category: 'stock_analysis', symbol, confidence: 0.7, rawQuery: message };
    }

    return { category: 'general', confidence: 1.0, rawQuery: message };
  }

  extractSymbol(message: string): string | undefined {
    const cleaned = message.replace(/[^\w\s]/g, ' ').toUpperCase();
    const words = cleaned.split(/\s+/);
    return words.find((w) => this.borsaSymbols.has(w));
  }
}
