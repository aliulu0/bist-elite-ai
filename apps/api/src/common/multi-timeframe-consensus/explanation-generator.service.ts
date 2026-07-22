import { Injectable } from '@nestjs/common';
import {
  ConsensusEngineOutput,
  ConsensusSummary,
  ConsensusStrength,
  ConflictDetail,
  EarlyAlignment,
  TrendInfo,
  TimeframeConsensusScore,
  TrendDirection,
} from './types';
import {
  getConsensusDescription,
  getConflictDescription,
  getSuggestedObservation,
  getDisclaimer,
  getFalseConfirmWarning,
  TREND_DIRECTION_TR,
  getTimeframeLabel,
  getStrengthLabel,
  CONSENSUS_STRENGTH_TR,
} from './turkish-terms';

@Injectable()
export class ExplanationGenerator {
  generateExplanation(output: ConsensusEngineOutput): string {
    const sections: string[] = [];

    sections.push(this.buildHeader(output));
    sections.push(this.buildConsensusSummary(output.consensusSummary));
    sections.push(this.buildTrendAnalysis(output.dominantTrend, output.secondaryTrend));
    sections.push(this.buildTimeframeScores(output.timeframeScores));
    sections.push(this.buildConflictAnalysis(output.conflicts));
    sections.push(this.buildEarlyAlignments(output.earlyAlignments));
    sections.push(this.buildSuggestedAction(output));
    sections.push(getDisclaimer());

    return sections.join('\n\n');
  }

  generateSummary(output: ConsensusEngineOutput): string {
    const parts: string[] = [];

    parts.push(`${output.stockSymbol} - ${output.stockName} Multi-Zaman Dilimi Analizi:`);
    parts.push(`Genel Skor: ${output.consensusSummary.overallScore.toFixed(1)}/100`);
    parts.push(`Guc: ${CONSENSUS_STRENGTH_TR[output.consensusSummary.consensusStrength]}`);

    if (output.conflicts.length > 0) {
      parts.push(`${output.conflicts.length} celiski tespit edildi.`);
    }

    parts.push(`Oneri: ${output.suggestedObservationTr}`);

    return parts.join(' ');
  }

  private buildHeader(output: ConsensusEngineOutput): string {
    return `=== ${output.stockSymbol} - ${output.stockName} Multi-Zaman Dilimi Konsensus Analizi ===\nFiyat: ${output.currentPrice}\nTarih: ${output.generatedAt}`;
  }

  private buildConsensusSummary(summary: ConsensusSummary): string {
    const lines: string[] = [];
    lines.push(`--- Konsensus Ozeti ---`);
    lines.push(`Genel Skor: ${summary.overallScore.toFixed(1)}/100`);
    lines.push(`Konsensus Gucu: ${CONSENSUS_STRENGTH_TR[summary.consensusStrength]}`);
    lines.push(`Guven Seviyesi: ${(summary.consensusConfidence * 100).toFixed(0)}%`);
    lines.push(`Celiski Seviyesi: ${(summary.conflictLevel * 100).toFixed(0)}%`);
    lines.push(`Trend Gucu: ${getStrengthLabel(summary.trendStrength)}`);
    lines.push(`Baskin Yon: ${TREND_DIRECTION_TR[summary.dominantDirection]}`);
    lines.push(summary.descriptionTr);
    return lines.join('\n');
  }

  private buildTrendAnalysis(dominant: TrendInfo, secondary: TrendInfo): string {
    const lines: string[] = [];
    lines.push(`--- Trend Analizi ---`);
    lines.push(`Birincil Trend: ${TREND_DIRECTION_TR[dominant.direction]} (Guven: ${(dominant.confidence * 100).toFixed(0)}%)`);
    lines.push(`  Destekleyen Gostergeler: ${dominant.indicators.join(', ') || 'Yok'}`);
    lines.push(`Ikincil Trend: ${TREND_DIRECTION_TR[secondary.direction]} (Guven: ${(secondary.confidence * 100).toFixed(0)}%)`);
    lines.push(`  Destekleyen Gostergeler: ${secondary.indicators.join(', ') || 'Yok'}`);
    return lines.join('\n');
  }

  private buildTimeframeScores(scores: TimeframeConsensusScore[]): string {
    const lines: string[] = [];
    lines.push(`--- Zaman Dilimi Skorlari ---`);
    for (const score of scores) {
      lines.push(`[${getTimeframeLabel(score.timeframe)}] Skor: ${score.score.toFixed(1)} | Trend: ${(score.trendAgreement * 100).toFixed(0)}% | Momentum: ${(score.momentumAgreement * 100).toFixed(0)}% | Hacim: ${(score.volumeConfirmation * 100).toFixed(0)}% | Guven: ${(score.confidence * 100).toFixed(0)}%`);
    }
    return lines.join('\n');
  }

  private buildConflictAnalysis(conflicts: ConflictDetail[]): string {
    if (conflicts.length === 0) {
      return `--- Celiski Analizi ---\nHerhangi bir celiski tespit edilmedi. Tum zaman dilimleri uyumlu.`;
    }

    const lines: string[] = [];
    lines.push(`--- Celiski Analizi ---`);
    lines.push(`${conflicts.length} celiski tespit edildi:`);
    for (const conflict of conflicts) {
      lines.push(`  - ${conflict.descriptionTr}`);
    }
    return lines.join('\n');
  }

  private buildEarlyAlignments(alignments: EarlyAlignment[]): string {
    if (alignments.length === 0) {
      return `--- Erken Firsat Analizi ---\nBelirgin erken firsat sinyali tespit edilmedi.`;
    }

    const lines: string[] = [];
    lines.push(`--- Erken Firsat Analizi ---`);
    for (const alignment of alignments) {
      lines.push(`  [${getTimeframeLabel(alignment.timeframe)}] Skor: ${(alignment.alignmentScore * 100).toFixed(0)}% | Onay: ${(alignment.confirmationLevel * 100).toFixed(0)}%`);
      if (alignment.isLeading) {
        lines.push(`    >> ON LIDER GOSTERGE`);
      }
      if (alignment.potentialFalseConfirm) {
        lines.push(`    >> ${getFalseConfirmWarning()}`);
      }
      if (alignment.emergingIndicators.length > 0) {
        lines.push(`    >> Osmekte Olan Gostergeler: ${alignment.emergingIndicators.join(', ')}`);
      }
    }
    return lines.join('\n');
  }

  private buildSuggestedAction(output: ConsensusEngineOutput): string {
    const lines: string[] = [];
    lines.push(`--- Oneri ---`);
    lines.push(`Islem: ${output.suggestedAction}`);
    lines.push(`Guven: ${(output.suggestedConfidence * 100).toFixed(0)}%`);
    lines.push(output.suggestedObservationTr);
    return lines.join('\n');
  }
}
