import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TCMBDecisionRecord } from './macro-elite.types';

@Injectable()
export class TCMBDecisionStoreService {
  private readonly logger = new Logger(TCMBDecisionStoreService.name);
  private readonly decisions = new Map<string, TCMBDecisionRecord>();

  save(record: Omit<TCMBDecisionRecord, 'id' | 'storedAt'>): TCMBDecisionRecord {
    const entry: TCMBDecisionRecord = {
      ...record,
      id: randomUUID(),
      storedAt: new Date().toISOString(),
    };
    this.decisions.set(entry.id, entry);
    this.logger.log(
      `TCMB decision stored: ${entry.meetingDate} (${entry.analysis.sentiment}) rate=${entry.policyRate ?? 'n/a'}`,
    );
    return entry;
  }

  findById(id: string): TCMBDecisionRecord | null {
    return this.decisions.get(id) ?? null;
  }

  findByMeetingDate(meetingDate: string): TCMBDecisionRecord | null {
    for (const record of this.decisions.values()) {
      if (record.meetingDate === meetingDate) return record;
    }
    return null;
  }

  list(limit = 20): TCMBDecisionRecord[] {
    return [...this.decisions.values()]
      .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime())
      .slice(0, limit);
  }

  count(): number {
    return this.decisions.size;
  }

  clear(): void {
    this.decisions.clear();
  }
}
