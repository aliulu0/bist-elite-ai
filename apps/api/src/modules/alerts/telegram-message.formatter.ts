import { OpportunityRadarItem, OpportunityRadarSnapshot, RadarState } from '../ai-early-opportunity/radar/radar.types';

/**
 * R2-051 — Presentation-only Turkish message formatter.
 *
 * This formatter NEVER computes scores, returns, stops or targets. It only
 * renders values already produced by the existing Radar / Decision engines.
 */
export interface TelegramOpportunityView {
  ticker: string;
  company: string;
  score: number;
  confidence: number;
  state: RadarState;
  expectedReturn: number;
  risk: string;
  entryZone: { min: number; max: number } | null;
  stop: number | null;
  target1: number | null;
  target2: number | null;
  reasons: string[];
  providerStatus: string | null;
  dataFreshness: string;
}

export const STATE_LABELS: Record<RadarState, string> = {
  NEW: 'YENİ',
  STRENGTHENING: 'GÜÇLENİYOR',
  CONFIRMED: 'GÜÇLÜ FIRSAT',
  WEAKENING: 'ZAYIFLIYOR',
  INVALIDATED: 'GEÇERSİZ',
  UNCHANGED: 'DEĞİŞMEDİ',
};

export class TelegramMessageFormatter {
  private readonly maxLength = 4096;

  formatOpportunity(item: OpportunityRadarItem): TelegramOpportunityView {
    const decision = item.decision;
    return {
      ticker: item.ticker,
      company: item.company,
      score: item.current?.earlyOpportunityScore ?? 0,
      confidence: item.current?.confidence ?? 0,
      state: item.state,
      expectedReturn: item.current?.expectedReturn ?? 0,
      risk: item.current?.risk ?? 'Belirtilmemiş',
      entryZone: decision?.entryZone ?? item.current?.entryZone ?? null,
      stop: decision?.stop ?? null,
      target1: decision?.target1 ?? null,
      target2: decision?.target2 ?? null,
      reasons: item.reasons ?? [],
      providerStatus: item.providerStatus ?? null,
      dataFreshness: item.dataFreshness ?? '',
    };
  }

  /**
   * Build the full daily radar message from an existing snapshot and a
   * deterministic, already-sorted list of selected opportunities.
   */
  buildDailyReport(
    snapshot: OpportunityRadarSnapshot | null,
    opportunities: TelegramOpportunityView[],
    options: { timezone: string; generatedAt?: string },
  ): string {
    const now = options.generatedAt ? new Date(options.generatedAt) : new Date();
    const dateStr = this.formatTrDate(now);
    const timeStr = this.formatTrTime(now, options.timezone);

    let message = '━━━━━━━━━━━━━━━━━━\n';
    message += '📡 BIST ELITE AI\n';
    message += 'GÜNLÜK FIRSAT RADARI\n';
    message += '━━━━━━━━━━━━━━━━━━\n\n';
    message += `📅 ${dateStr}\n`;
    message += `🕒 ${timeStr}\n\n`;

    if (opportunities.length === 0) {
      message += 'Bugün kriterleri karşılayan güçlü bir erken fırsat tespit edilmedi.\n\n';
      message += `Taranan: ${snapshot?.symbolsEvaluated ?? 0}\n\n`;
      message += 'Not: Radar çalıştı ancak eşik üzerinde fırsat bulunamadı.\n';
    } else {
      message += '🔥 ÖNE ÇIKAN FIRSATLAR\n\n';
      const max = 10;
      opportunities.slice(0, max).forEach((opp, index) => {
        message += `\n${this.numberEmoji(index + 1)} ${opp.ticker}\n`;
        message += `Skor: ${opp.score}/100\n`;
        message += `Güven: ${this.confidenceLabel(opp.confidence)}\n`;
        message += `Durum: ${STATE_LABELS[opp.state] ?? opp.state}\n\n`;
        message += `Beklenen getiri: ${this.formatSigned(opp.expectedReturn)}%\n`;
        message += `Risk: ${this.riskLabel(opp.risk)}\n`;
        if (opp.entryZone) {
          message += `Giriş: ${opp.entryZone.min} – ${opp.entryZone.max}\n`;
        }
        if (opp.stop != null) message += `Stop: ${opp.stop}\n`;
        if (opp.target1 != null) message += `Hedef 1: ${opp.target1}\n`;
        if (opp.target2 != null) message += `Hedef 2: ${opp.target2}\n`;
        if (opp.reasons.length > 0) {
          message += 'Neden?\n';
          opp.reasons.slice(0, 4).forEach((reason) => {
            message += `• ${reason}\n`;
          });
        }
        message += `Veri: ${this.sourceLabel(opp.providerStatus, opp.dataFreshness)}\n`;
        message += '──────────────────\n';
      });

      const strong = opportunities.filter((o) => o.state === 'CONFIRMED' || o.state === 'STRENGTHENING').length;
      const medium = opportunities.filter((o) => o.state === 'NEW').length;
      const weakening = opportunities.filter((o) => o.state === 'WEAKENING').length;

      message += '\n📊 RADAR ÖZETİ\n';
      message += `Taranan: ${snapshot?.symbolsEvaluated ?? 0}\n`;
      message += `Fırsat: ${opportunities.length}\n`;
      message += `Güçlü: ${strong}\n`;
      message += `Orta: ${medium}\n`;
      if (weakening > 0) message += `Zayıflayan: ${weakening}\n`;
    }

    message += '\n⚠️ Bu rapor yatırım tavsiyesi değildir.\n';
    message += '━━━━━━━━━━━━━━━━━━\n';

    return this.truncate(message);
  }

  /** Build the single-message smoke test (never market advice). */
  buildSmokeTestMessage(): string {
    const now = new Date();
    return [
      '🧪 BIST ELITE AI Telegram bağlantı testi',
      '',
      'Telegram bağlantısı başarıyla doğrulandı.',
      '',
      `Timestamp: ${now.toISOString()}`,
    ].join('\n');
  }

  /** Build the empty-report variant (only used when TELEGRAM_SEND_EMPTY_REPORT=true). */
  buildEmptyReport(snapshot: OpportunityRadarSnapshot | null): string {
    const now = new Date();
    let message = '━━━━━━━━━━━━━━━━━━\n';
    message += '📡 BIST ELITE AI\n';
    message += 'Günlük Fırsat Radarı\n';
    message += '━━━━━━━━━━━━━━━━━━\n\n';
    message += `📅 ${this.formatTrDate(now)}\n\n`;
    message += 'Bugün kriterleri karşılayan güçlü bir erken fırsat tespit edilmedi.\n\n';
    message += `Taranan: ${snapshot?.symbolsEvaluated ?? 0}\n\n`;
    message += 'Not: Radar çalıştı ancak eşik üzerinde fırsat bulunamadı.\n';
    message += '\n⚠️ Bu rapor yatırım tavsiyesi değildir.\n';
    message += '━━━━━━━━━━━━━━━━━━\n';
    return this.truncate(message);
  }

  /**
   * Deterministic chunking as a safety net for very long messages. Preserves
   * order and never silently truncates critical content (truncate() is only a
   * final hard cap per chunk).
   */
  chunk(message: string, chunkSize = 4096): string[] {
    const out: string[] = [];
    let remaining = message;
    while (remaining.length > chunkSize) {
      const cut = this.lastLineBreak(remaining, chunkSize);
      out.push(this.truncateTo(remaining.slice(0, cut), chunkSize));
      remaining = remaining.slice(cut).trimStart();
    }
    if (remaining.length > 0) out.push(this.truncateTo(remaining, chunkSize));
    return out;
  }

  private truncate(message: string): string {
    if (message.length <= this.maxLength) return message;
    return this.truncateTo(message, this.maxLength);
  }

  private truncateTo(message: string, max: number): string {
    if (message.length <= max) return message;
    return message.slice(0, max - 1) + '…';
  }

  private lastLineBreak(message: string, max: number): number {
    const candidates = [message.lastIndexOf('\n', max), message.lastIndexOf('\n\n', max)];
    const found = Math.max(...candidates);
    return found > 0 ? found + 1 : max;
  }

  private formatTrDate(date: Date): string {
    return date.toLocaleDateString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatTrTime(date: Date, timezone: string): string {
    return date.toLocaleTimeString('tr-TR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private confidenceLabel(confidence: number): string {
    if (confidence >= 80) return 'YÜKSEK';
    if (confidence >= 60) return 'ORTA';
    return 'DÜŞÜK';
  }

  private riskLabel(risk: string): string {
    const normalized = (risk || '').toLowerCase();
    if (normalized.includes('yüksek') || normalized.includes('high')) return 'YÜKSEK';
    if (normalized.includes('orta') || normalized.includes('medium')) return 'ORTA';
    if (normalized.includes('düşük') || normalized.includes('low')) return 'DÜŞÜK';
    return risk || 'Belirtilmemiş';
  }

  private sourceLabel(providerStatus: string | null, dataFreshness: string): string {
    const parts: string[] = [];
    if (providerStatus) parts.push(providerStatus);
    if (dataFreshness) parts.push(dataFreshness);
    return parts.length > 0 ? parts.join(' • ') : 'Mevcut veri';
  }

  private formatSigned(value: number): string {
    if (!Number.isFinite(value)) return '0';
    return value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  }

  private numberEmoji(n: number): string {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return emojis[n - 1] ?? `${n}.`;
  }
}