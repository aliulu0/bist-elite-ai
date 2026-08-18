import { Injectable, Logger, Optional } from '@nestjs/common';
import { TelegramClient } from '../alerts/telegram-client';
import { getTelegramRadarConfig, TelegramRadarConfig } from '../alerts/telegram-daily-radar.config';
import {
  DailyScanResponse,
  OpportunityRadarEvent,
  ScannerRankingResultEntry,
} from './daily-scan.types';

/**
 * R2-078 — Daily scan Telegram notifier.
 *
 * Telegram is a DELIVERY CHANNEL only: this service never computes or modifies
 * scan/radar results. It formats the completed DailyScanResponse in Turkish and
 * delivers it through the existing official Bot API client.
 *
 * Failures are always isolated — notifyScanComplete never throws, so a Telegram
 * outage can never fail a scan.
 */
export interface DailyScanNotificationResult {
  sent: boolean;
  status: 'SENT' | 'PARTIAL' | 'FAILED' | 'SKIPPED_DISABLED' | 'SKIPPED_NOT_CONFIGURED';
  messageIds: string[];
  error?: string;
}

const MAX_MESSAGE_LENGTH = 4000;

@Injectable()
export class DailyScanNotifierService {
  private readonly logger = new Logger(DailyScanNotifierService.name);
  private readonly client: TelegramClient;
  private readonly config: TelegramRadarConfig;

  constructor(@Optional() client?: TelegramClient, @Optional() config?: TelegramRadarConfig) {
    this.client = client ?? new TelegramClient();
    this.config = config ?? getTelegramRadarConfig();
  }

  async notifyScanComplete(response: DailyScanResponse): Promise<DailyScanNotificationResult> {
    if (!this.config.enabled) {
      return { sent: false, status: 'SKIPPED_DISABLED', messageIds: [] };
    }
    if (!this.client.isConfigured()) {
      return { sent: false, status: 'SKIPPED_NOT_CONFIGURED', messageIds: [] };
    }

    try {
      const message = this.buildMessage(response);
      const chunks = this.chunk(message);
      const messageIds: string[] = [];
      let allSent = true;

      for (const chunk of chunks) {
        const result = await this.client.sendMessage(chunk);
        if (result.status === 'VERIFIED' && result.messageId) {
          messageIds.push(result.messageId);
        } else {
          allSent = false;
          this.logger.warn(`Telegram daily scan delivery failed: ${result.status}`);
        }
      }

      return {
        sent: allSent && chunks.length > 0,
        status: allSent ? 'SENT' : 'PARTIAL',
        messageIds,
        error: allSent ? undefined : 'One or more Telegram chunks were not delivered',
      };
    } catch (error) {
      this.logger.warn(
        `Telegram daily scan notification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        sent: false,
        status: 'FAILED',
        messageIds: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Formatting (Turkish, deterministic, only real data)
  // ---------------------------------------------------------------------------

  buildMessage(response: DailyScanResponse): string {
    const s = response.summary;
    const lines: string[] = [
      '📊 BIST ELITE AI — Günlük Tarama Raporu',
      '──────────────────────────────',
      `⏱ Tarama ID: ${response.scanId}`,
      `📅 Zaman: ${s.timestamp}`,
      `🔄 Durum: ${this.statusLabel(s.status)}`,
      '',
      `🌐 Evren: ${s.universeSize} | Hisseler: ${s.equityCount}`,
      `🔍 Değerlendirilen: ${s.evaluatedCount} | Başarılı: ${s.availableCount}`,
      `⚠️ Kullanılamayan: ${s.unavailableCount} | Hata: ${s.failedCount} | Sınırlı: ${s.rateLimitedCount}`,
      `🎯 Uygun (TOP): ${s.eligibleCount} | Sinyal: ${s.signalCount}`,
    ];

    const top10 = s.top10;
    if (top10.length > 0) {
      lines.push('', '🏆 TOP 10');
      top10.forEach((entry, index) => {
        lines.push(this.formatEntry(index + 1, entry));
      });
    } else {
      lines.push('', '🏆 TOP 10: veri yok (tarama tamamlanamadı)');
    }

    const highlights = this.collectHighlights(response);
    if (highlights.length > 0) {
      lines.push('', '📡 Fırsat Radarı');
      highlights.forEach((event) => {
        lines.push(`• ${event.type} — ${event.symbol}: ${event.reason}`);
      });
    } else {
      lines.push('', '📡 Fırsat Radarı: yeni olay yok');
    }

    lines.push('', '⚠️ Yatırım tavsiyesi değildir. Veriler gerçek zamanlı olmayabilir.');
    return lines.join('\n');
  }

  private formatEntry(rank: number, entry: ScannerRankingResultEntry): string {
    const price =
      entry.currentPrice !== null
        ? entry.currentPrice.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
        : 'Veri Yok';
    const score =
      entry.eliteScore !== null && entry.eliteScore !== undefined
        ? String(entry.eliteScore)
        : 'Veri Yok';
    const classification = entry.earlyOpportunityClassification
      ? this.classificationLabel(entry.earlyOpportunityClassification)
      : 'Veri Yok';
    return `#${rank} ${entry.symbol} — Skor: ${score} | ${classification} | Fiyat: ${price}`;
  }

  private collectHighlights(response: DailyScanResponse): OpportunityRadarEvent[] {
    const s = response.summary;
    const all = [
      ...s.newOpportunities,
      ...s.scoreSurges,
      ...s.strengtheningSignals,
      ...s.breakoutDevelopments,
      ...s.multiTimeframeAlignments,
      ...s.rankImprovements,
      ...s.volumeExpansions,
      ...s.momentumAccelerations,
    ];
    const seen = new Set<string>();
    const unique: OpportunityRadarEvent[] = [];
    for (const event of all) {
      const key = `${event.type}:${event.symbol}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(event);
      }
    }
    return unique.slice(0, 10);
  }

  private chunk(message: string): string[] {
    const chunks: string[] = [];
    if (message.length <= MAX_MESSAGE_LENGTH) {
      return [message];
    }
    const lines = message.split('\n');
    let current = '';
    for (const line of lines) {
      if ((current + '\n' + line).length > MAX_MESSAGE_LENGTH) {
        chunks.push(current);
        current = line;
      } else {
        current = current ? current + '\n' + line : line;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  private statusLabel(status: DailyScanResponse['status']): string {
    switch (status) {
      case 'COMPLETE':
        return 'Tamamlandı';
      case 'PARTIAL':
        return 'Kısmen Tamamlandı';
      case 'DEGRADED':
        return 'Düşük Veri Kalitesi';
      case 'FAILED':
        return 'Başarısız';
      default:
        return status;
    }
  }

  private classificationLabel(
    classification: ScannerRankingResultEntry['earlyOpportunityClassification'],
  ): string {
    switch (classification) {
      case 'EARLY_ACCUMULATION':
        return 'Erken Birikim';
      case 'PRE_BREAKOUT':
        return 'Kırılım Öncesi';
      case 'BREAKOUT':
        return 'Kırılım';
      case 'MOMENTUM':
        return 'Momentum';
      case 'EXTENDED':
        return 'Yükseliş Genişlemesi';
      case 'WEAKENING':
        return 'Zayıflama';
      case 'NO_SIGNAL':
        return 'Sinyal Yok';
      case 'UNAVAILABLE':
        return 'Veri Yok';
      default:
        return String(classification);
    }
  }
}
