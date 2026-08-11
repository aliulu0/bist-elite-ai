import { Injectable, Logger } from '@nestjs/common';
import { DecisionNotificationPayload } from './macro-elite.types';

export interface IDecisionNotifier {
  notify(decision: DecisionNotificationPayload): Promise<void>;
}

export const DECISION_NOTIFIER = Symbol('DECISION_NOTIFIER');

@Injectable()
export class ConsoleDecisionNotifier implements IDecisionNotifier {
  private readonly logger = new Logger('DecisionNotifier');

  async notify(decision: DecisionNotificationPayload): Promise<void> {
    this.logger.log(
      `[DECISION] ${decision.meetingDate} policyRate=${decision.policyRate ?? 'n/a'} sentiment=${decision.sentiment} ` +
        `hawkish=${decision.hawkishScore} dovish=${decision.dovishScore} confidence=${decision.confidence}%`,
    );
  }
}
