import { Injectable } from '@nestjs/common';
import {
  MarketRegimeType,
  RegimeClassification,
  RegimeTransition,
  RegimeHistoricalData,
  RegimeContext,
  MultiTimeframeRegime,
  RegimeTimeframe,
} from './types';
import {
  MARKET_REGIME_TYPE_TURKISH,
  REGIME_CONFIDENCE_TURKISH,
  REGIME_TIMEFRAME_TURKISH,
  TRANSITION_TYPE_TURKISH,
  formatPercentageTurkish,
  formatScoreTurkish,
  REPORT_HEADER_TURKISH,
  REPORT_FOOTER_TURKISH,
} from './turkish-terms';

@Injectable()
export class RegimeReportGeneratorService {
  generateSummaryReport(regime: MultiTimeframeRegime): string {
    const lines: string[] = [];
    lines.push(REPORT_HEADER_TURKISH);
    lines.push('');
    lines.push(`Rejim Ozeti: ${MARKET_REGIME_TYPE_TURKISH[regime.overall]}`);
    lines.push(`Guvenilirlik: ${formatPercentageTurkish(regime.overallConfidence)}`);
    lines.push(`Zaman Dilimi Uyumu: ${formatPercentageTurkish(regime.timeframeAgreement)}`);
    lines.push(`Cakisma Durumu: ${regime.hasConflict ? 'Var' : 'Yok'}`);
    lines.push('');

    for (const tf of Object.keys(regime.regimes) as RegimeTimeframe[]) {
      const r = regime.regimes[tf];
      if (r) {
        lines.push(`  [${REGIME_TIMEFRAME_TURKISH[tf]}] ${MARKET_REGIME_TYPE_TURKISH[r.type]} - Guvenilirlik: ${formatPercentageTurkish(r.confidence)}`);
      }
    }

    lines.push('');
    lines.push(`Tespit Zamanı: ${regime.detectedAt}`);
    lines.push('');
    lines.push(REPORT_FOOTER_TURKISH);
    return lines.join('\n');
  }

  generateConfidenceReport(classification: RegimeClassification): string {
    const lines: string[] = [];
    lines.push(REPORT_HEADER_TURKISH);
    lines.push('');
    lines.push(`Rejim: ${MARKET_REGIME_TYPE_TURKISH[classification.type]}`);
    lines.push(`Guvenilirlik: ${formatPercentageTurkish(classification.confidence)}`);
    lines.push(`Anlasma Skoru: ${formatPercentageTurkish(classification.agreementScore)}`);
    lines.push(`Cakisma Skoru: ${formatPercentageTurkish(classification.conflictScore)}`);
    lines.push(`Kararlılık Skoru: ${formatScoreTurkish(classification.stabilityScore)}`);
    lines.push('');

    if (classification.factors.length > 0) {
      lines.push('Faktorler:');
      for (const f of classification.factors) {
        lines.push(`  ${f.factor}: ${formatScoreTurkish(f.value)} (Agirlik: ${formatPercentageTurkish(f.weight)}) - ${f.description}`);
      }
    }

    lines.push('');
    lines.push(`Sınıflandırma Zamanı: ${classification.classifiedAt}`);
    lines.push('');
    lines.push(REPORT_FOOTER_TURKISH);
    return lines.join('\n');
  }

  generateTransitionReport(transitions: RegimeTransition[]): string {
    const lines: string[] = [];
    lines.push(REPORT_HEADER_TURKISH);
    lines.push('');
    lines.push(`Gecis Analiz Raporu (${transitions.length} gecis algilandi)`);
    lines.push('');

    if (transitions.length === 0) {
      lines.push('Aktif gecis algilanmadi.');
    } else {
      for (const t of transitions) {
        lines.push(`${MARKET_REGIME_TYPE_TURKISH[t.from]} -> ${MARKET_REGIME_TYPE_TURKISH[t.to]}`);
        lines.push(`  Olasilik: ${formatPercentageTurkish(t.probability)}`);
        lines.push(`  Zaman Dilimi: ${REGIME_TIMEFRAME_TURKISH[t.timeframe]}`);
        lines.push(`  Gostergeler: ${t.indicators.join(', ')}`);
        lines.push(`  Tespit Zamanı: ${t.detectedAt}`);
        lines.push('');
      }
    }

    lines.push(REPORT_FOOTER_TURKISH);
    return lines.join('\n');
  }

  generateHistoricalReport(history: RegimeHistoricalData[]): string {
    const lines: string[] = [];
    lines.push(REPORT_HEADER_TURKISH);
    lines.push('');
    lines.push('Tarihsel Rejim Analiz Raporu');
    lines.push('');

    if (history.length === 0) {
      lines.push('Tarihsel veri bulunamadi.');
    } else {
      for (const h of history) {
        lines.push(`${MARKET_REGIME_TYPE_TURKISH[h.regime]}:`);
        lines.push(`  Gorunme Sayisi: ${h.occurrences}`);
        lines.push(`  Ortalama Sure: ${h.avgDuration.toFixed(1)} gun`);
        lines.push(`  Toplam Sure: ${h.totalDuration} gun`);
        lines.push(`  Ilk Gorunme: ${h.firstSeen}`);
        lines.push(`  Son Gorunme: ${h.lastSeen}`);
        lines.push('');
      }
    }

    lines.push(REPORT_FOOTER_TURKISH);
    return lines.join('\n');
  }

  generateRiskContextReport(context: RegimeContext): string {
    const lines: string[] = [];
    lines.push(REPORT_HEADER_TURKISH);
    lines.push('');
    lines.push('Risk Baglami Raporu');
    lines.push('');
    lines.push(`Aktif Rejim: ${MARKET_REGIME_TYPE_TURKISH[context.currentRegime]}`);
    lines.push(`Guvenilirlik: ${formatPercentageTurkish(context.confidence)}`);
    lines.push(`Rejim Suresi: ${context.duration} gun`);
    lines.push(`Gecis Riski: ${formatPercentageTurkish(context.transitionRisk)}`);
    lines.push('');

    if (context.recommendedAdjustments.length > 0) {
      lines.push('Onerilen Ayarlamalar:');
      for (const adj of context.recommendedAdjustments) {
        lines.push(`  ${adj.parameter}: ${adj.currentValue} -> ${adj.recommendedValue} (${adj.reason})`);
      }
    }

    if (context.riskFactors.length > 0) {
      lines.push('');
      lines.push('Risk Faktorleri:');
      for (const rf of context.riskFactors) {
        lines.push(`  - ${rf}`);
      }
    }

    lines.push('');
    lines.push(REPORT_FOOTER_TURKISH);
    return lines.join('\n');
  }
}
