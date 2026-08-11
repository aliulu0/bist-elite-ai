import { Inject, Injectable, Logger } from '@nestjs/common';
import { MarketDataOrchestrator } from '../market-data/orchestrator/market-data-orchestrator';
import { TCMBDecisionAnalyzer } from './engines/tcmb-decision-analyzer';
import { TCMBDecisionStoreService } from './tcmb-decision-store.service';
import { DECISION_NOTIFIER, IDecisionNotifier } from './decision-notifier';
import { TCMBDecisionCaptureInput, TCMBDecisionRecord, DecisionNotificationPayload } from './macro-elite.types';

@Injectable()
export class TCMBDecisionCaptureService {
  private readonly logger = new Logger(TCMBDecisionCaptureService.name);

  constructor(
    private readonly orchestrator: MarketDataOrchestrator,
    private readonly analyzer: TCMBDecisionAnalyzer,
    private readonly store: TCMBDecisionStoreService,
    @Inject(DECISION_NOTIFIER) private readonly notifier: IDecisionNotifier,
  ) {}

  async captureLatest(): Promise<TCMBDecisionRecord | null> {
    const decisions = await this.orchestrator.fetchTcmbInterestDecisions();
    if (!decisions || decisions.length === 0) {
      this.logger.debug('No TCMB interest decisions available from the market data layer');
      return null;
    }

    const latest = decisions[0];
    const existing = this.store.findByMeetingDate(latest.date);
    if (existing) return existing;

    const previous = decisions[1];
    return this.capture({
      meetingDate: latest.date,
      policyRate: latest.policyRate,
      previousPolicyRate: previous?.policyRate ?? null,
      rawText: this.buildDecisionText(latest, previous),
    });
  }

  async capture(input: TCMBDecisionCaptureInput): Promise<TCMBDecisionRecord> {
    const existing = this.store.findByMeetingDate(input.meetingDate);
    if (existing) return existing;

    const analysis = this.analyzer.analyze(input.rawText);
    const record = this.store.save({
      meetingDate: input.meetingDate,
      policyRate: input.policyRate,
      previousPolicyRate: input.previousPolicyRate,
      analysis,
      rawText: input.rawText,
    });

    await this.notifier.notify(this.buildNotification(record));
    return record;
  }

  private buildDecisionText(
    latest: { date: string; policyRate: number; change: number | null },
    previous?: { policyRate: number },
  ): string {
    if (previous && previous.policyRate !== latest.policyRate) {
      if (latest.policyRate > previous.policyRate) {
        return `Kurul politika faizini %${previous.policyRate}'den %${latest.policyRate}'e yükseltti. Parasal sıkılaşma devam ediyor. Sıkı duruş korunuyor. Enflasyon riski yukarı yönlü.`;
      }
      return `Kurul politika faizini %${previous.policyRate}'den %${latest.policyRate}'e indirdi. Faiz indirimi kararı alındı. Dezenflasyon sürecinin güçlendiği değerlendiriliyor. Gevşeme eğilimi belirginleşti.`;
    }
    return `Kurul politika faizini %${latest.policyRate} seviyesinde sabit tuttu. Para politikası duruşu korundu.`;
  }

  private buildNotification(record: TCMBDecisionRecord): DecisionNotificationPayload {
    return {
      decisionId: record.id,
      meetingDate: record.meetingDate,
      policyRate: record.policyRate,
      sentiment: record.analysis.sentiment,
      hawkishScore: record.analysis.hawkishScore,
      dovishScore: record.analysis.dovishScore,
      confidence: record.analysis.confidence,
      summary: record.analysis.summary,
      createdAt: record.storedAt,
    };
  }
}
