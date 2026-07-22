import { Injectable } from '@nestjs/common';
import {
  OpportunityRecord,
  OpportunityTimeline,
  LifecycleSummary,
  OpportunityStage,
} from './types';
import {
  OPPORTUNITY_STAGE_TURKISH,
  REPORT_HEADER_TURKISH,
  REPORT_FOOTER_TURKISH,
  formatScoreTurkish,
  formatPercentageTurkish,
  formatDurationTurkish,
  getStageIconTurkish,
  HEALTH_LEVEL_TURKISH,
  EVOLUTION_TREND_TURKISH,
  EARLY_DETECTION_RESULT_TURKISH,
} from './turkish-terms';
import { ScoreEvolution } from './types';

@Injectable()
export class LifecycleReportGeneratorService {
  generateTimelineReport(timeline: OpportunityTimeline): string {
    const lines: string[] = [];
    lines.push(REPORT_HEADER_TURKISH);
    lines.push('');
    lines.push(`Firsat Zaman Cizelgesi: ${timeline.stockSymbol}`);
    lines.push(`Toplam Sure: ${formatDurationTurkish(timeline.totalDuration)}`);
    lines.push(`Tespit: ${timeline.detectedAt}`);
    if (timeline.completedAt) {
      lines.push(`Tamamlanma: ${timeline.completedAt}`);
    }
    if (timeline.outcome) {
      lines.push(`Sonuc: ${timeline.outcome}`);
    }
    lines.push('');

    for (const stage of timeline.stages) {
      const icon = getStageIconTurkish(stage.stage);
      lines.push(`  ${icon} ${OPPORTUNITY_STAGE_TURKISH[stage.stage]}`);
      lines.push(`    Baslangic: ${stage.enteredAt}`);
      if (stage.exitedAt) {
        lines.push(`    Bitis: ${stage.exitedAt}`);
      }
      lines.push(`    Sure: ${formatDurationTurkish(stage.duration)}`);
      if (stage.reason) {
        lines.push(`    Neden: ${stage.reason}`);
      }
      lines.push('');
    }

    lines.push(REPORT_FOOTER_TURKISH);
    return lines.join('\n');
  }

  generateLifecycleSummaryReport(summary: LifecycleSummary): string {
    const lines: string[] = [];
    lines.push(REPORT_HEADER_TURKISH);
    lines.push('');
    lines.push('Yasam Dongusu Ozeti');
    lines.push('');
    lines.push(`Toplam Firsat: ${summary.totalOpportunities}`);
    lines.push(`Aktif Firsat: ${summary.activeOpportunities}`);
    lines.push(`Tamamlanan: ${summary.completedOpportunities}`);
    lines.push(`Iptal Edilen: ${summary.cancelledOpportunities}`);
    lines.push(`Basari Orani: ${formatPercentageTurkish(summary.successRate)}`);
    lines.push(`Ortalama Saglik: ${formatScoreTurkish(summary.avgHealthIndex)}`);
    lines.push(`Ortalama Omur: ${formatDurationTurkish(summary.avgLifetime)}`);
    lines.push(`Ortalama Liderlik: ${formatDurationTurkish(summary.avgLeadTime)}`);
    lines.push('');

    lines.push('Asama Dagilimi:');
    for (const [stage, count] of Object.entries(summary.stageDistribution)) {
      if (count > 0) {
        lines.push(`  ${getStageIconTurkish(stage as OpportunityStage)} ${OPPORTUNITY_STAGE_TURKISH[stage as OpportunityStage]}: ${count}`);
      }
    }

    lines.push('');
    lines.push(`Rapor Zamanı: ${summary.generatedAt}`);
    lines.push('');
    lines.push(REPORT_FOOTER_TURKISH);
    return lines.join('\n');
  }

  generateEvolutionReport(evolution: ScoreEvolution[]): string {
    const lines: string[] = [];
    lines.push(REPORT_HEADER_TURKISH);
    lines.push('');
    lines.push('Skor Evrim Raporu');
    lines.push('');

    for (const e of evolution) {
      lines.push(`${e.metric}:`);
      lines.push(`  Baslangic: ${formatScoreTurkish(e.startValue)}`);
      lines.push(`  Guncel: ${formatScoreTurkish(e.currentValue)}`);
      lines.push(`  Degisim: ${formatScoreTurkish(e.change)} (${e.changePercent.toFixed(1)}%)`);
      lines.push(`  Trend: ${EVOLUTION_TREND_TURKISH[e.trend]}`);
      lines.push(`  Volatilite: ${formatScoreTurkish(e.volatility)}`);
      lines.push('');
    }

    lines.push(REPORT_FOOTER_TURKISH);
    return lines.join('\n');
  }

  generateHealthReport(record: OpportunityRecord): string {
    const lines: string[] = [];
    lines.push(REPORT_HEADER_TURKISH);
    lines.push('');
    lines.push(`Saglik Raporu: ${record.stockSymbol}`);
    lines.push('');
    lines.push(`Genel Saglik: ${record.healthIndex.overall}/100 - ${HEALTH_LEVEL_TURKISH[record.healthIndex.level]}`);
    lines.push(`Stabilite: ${formatScoreTurkish(record.healthIndex.stability)}`);
    lines.push(`Momentum: ${formatScoreTurkish(record.healthIndex.momentum)}`);
    lines.push(`Risk Seviyesi: ${formatScoreTurkish(record.healthIndex.riskLevel)}`);
    lines.push(`Kalite: ${formatScoreTurkish(record.healthIndex.quality)}`);
    lines.push('');

    if (record.healthIndex.factors.length > 0) {
      lines.push('Faktorler:');
      for (const f of record.healthIndex.factors) {
        lines.push(`  ${f.factor}: ${formatScoreTurkish(f.value)} (Agirlik: ${formatPercentageTurkish(f.weight)})`);
      }
    }

    lines.push('');
    lines.push(`Hesaplama Zamanı: ${record.healthIndex.calculatedAt}`);
    lines.push('');
    lines.push(REPORT_FOOTER_TURKISH);
    return lines.join('\n');
  }

  generateEarlyDetectionReport(record: OpportunityRecord): string {
    const lines: string[] = [];
    lines.push(REPORT_HEADER_TURKISH);
    lines.push('');
    lines.push(`Erken Tespit Raporu: ${record.stockSymbol}`);
    lines.push('');
    lines.push(`Tespit Sonucu: ${EARLY_DETECTION_RESULT_TURKISH[record.earlyDetection.result]}`);
    lines.push(`Ilk Tespit: ${record.earlyDetection.firstDetectionTime}`);
    lines.push(`Dogrulama Gecikmesi: ${record.earlyDetection.timeToConfirm.toFixed(1)} saat`);
    lines.push(`Liderlik Suresi: ${record.earlyDetection.leadTime.toFixed(1)} saat`);
    lines.push(`Sinyal Dayanikliligi: ${formatPercentageTurkish(record.earlyDetection.signalPersistence)}`);
    lines.push(`Sinyal Tazeligi: ${formatPercentageTurkish(record.earlyDetection.signalFreshness)}`);
    lines.push(`Basarili Erken Tespit: ${record.earlyDetection.earlyDetectionSuccess ? 'Evet' : 'Hayir'}`);
    lines.push('');
    lines.push(`Aciklama: ${record.earlyDetection.description}`);
    lines.push('');
    lines.push(REPORT_FOOTER_TURKISH);
    return lines.join('\n');
  }
}
