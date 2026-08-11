import { Injectable } from '@nestjs/common';
import { DecisionResult } from '../decision/decision.types';
import {
  OpportunityInput,
  OpportunityLevel,
  OpportunityTag,
  OPPORTUNITY_LEVEL_META,
} from './opportunity.types';

const LEVEL_BASE_REASONS: Record<OpportunityLevel, string> = {
  ÇOK_GÜÇLÜ_FIRSAT: 'Çok güçlü fırsat tespit edildi — tüm göstergeler olumlu',
  GÜÇLÜ_FIRSAT: 'Güçlü fırsat tespit edildi',
  FIRSAT: 'Yatırım fırsatı tespit edildi',
  İZLEME_LISTESI: 'Hisse izleme listesine eklendi',
  BEKLE: 'Şu an için net fırsat tespit edilmedi',
};

const TAG_CONDITIONS: Array<{ tag: OpportunityTag; test: (d: OpportunityInput, decision: DecisionResult) => boolean }> = [
  {
    tag: 'Erken Kırılım',
    test: (input) =>
      input.dimensions.technical != null &&
      input.dimensions.technical >= 75 &&
      input.dimensions.momentum != null &&
      input.dimensions.momentum >= 65,
  },
  {
    tag: 'Akıllı Para',
    test: (input) =>
      input.strategyId === 'smart-money' && input.strategyScore != null && input.strategyScore >= 65,
  },
  {
    tag: 'Dip Toplama',
    test: (input) =>
      input.strategyId === 'dip-collector' && input.strategyScore != null && input.strategyScore >= 65,
  },
  {
    tag: 'Trend Başlangıcı',
    test: (input) => input.dimensions.trend != null && input.dimensions.trend >= 75,
  },
  {
    tag: 'Momentum',
    test: (input) => input.dimensions.momentum != null && input.dimensions.momentum >= 70,
  },
  {
    tag: 'Hacim Patlaması',
    test: (input) => input.dimensions.volume != null && input.dimensions.volume >= 75,
  },
  {
    tag: 'Doğrulanmış Haber',
    test: (input) => input.dimensions.verification != null && input.dimensions.verification >= 75,
  },
  {
    tag: 'Yeni Katalizör',
    test: (input) => input.dimensions.catalyst != null && input.dimensions.catalyst >= 70,
  },
  {
    tag: 'Güçlü Temel',
    test: (input) => input.dimensions.fundamental != null && input.dimensions.fundamental >= 75,
  },
  {
    tag: 'Düşük Risk',
    test: (input) => input.dimensions.risk != null && input.dimensions.risk >= 75,
  },
  {
    tag: 'Yüksek Likidite',
    test: (input) => input.dimensions.liquidity != null && input.dimensions.liquidity >= 75,
  },
];

@Injectable()
export class OpportunityExplanationService {
  buildTags(input: OpportunityInput, decision: DecisionResult): OpportunityTag[] {
    const tags: OpportunityTag[] = [];
    for (const { tag, test } of TAG_CONDITIONS) {
      if (test(input, decision)) {
        tags.push(tag);
      }
    }
    return tags;
  }

  buildReasons(
    level: OpportunityLevel,
    input: OpportunityInput,
    decision: DecisionResult,
    tags: OpportunityTag[],
  ): string[] {
    const reasons: string[] = [];
    const base = LEVEL_BASE_REASONS[level];
    if (base) {
      reasons.push(base);
    }
    reasons.push(`Karar: ${decision.decisionLabel}`);
    if (input.aiScore != null) {
      reasons.push(`AI skoru: ${input.aiScore}`);
    }
    for (const tag of tags) {
      reasons.push(`Etiket: ${tag}`);
    }
    return reasons;
  }

  buildWarnings(input: OpportunityInput, decision: DecisionResult): string[] {
    const warnings: string[] = [];
    const d = input.dimensions;

    if (decision.decision === 'RİSKLİ' || decision.decision === 'SAT' || decision.decision === 'GÜÇLÜ_SAT') {
      warnings.push(`Olumsuz karar: ${decision.decisionLabel}`);
    }
    if (d.risk != null && d.risk <= 30) {
      warnings.push(`Yüksek risk profili (risk puanı ${d.risk})`);
    }
    if (d.liquidity != null && d.liquidity <= 30) {
      warnings.push(`Likidite zayıf (likidite puanı ${d.liquidity})`);
    }
    if (input.aiConfidence != null && input.aiConfidence < 50) {
      warnings.push(`Model güveni düşük (${input.aiConfidence}%)`);
    }
    const nullCount = Object.values(d).filter((v) => v == null).length;
    if (nullCount > 0) {
      warnings.push(
        `Veri eksikliği: ${nullCount} boyut hesaplanamadı, fırsat güveni etkilenebilir`,
      );
    }
    return warnings;
  }

  levelLabel(level: OpportunityLevel): string {
    return OPPORTUNITY_LEVEL_META[level].label;
  }
}
