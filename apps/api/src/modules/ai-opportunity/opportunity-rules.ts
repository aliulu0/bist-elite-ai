import { DecisionId } from '../decision/decision.types';
import { OpportunityLevel, OPPORTUNITY_LEVEL_META } from './opportunity.types';

export interface OpportunityLevelRule {
  level: OpportunityLevel;
  description: string;
  matches(decision: DecisionId, aiScore: number | null, aiConfidence: number | null): boolean;
}

export function getOpportunityLevelStrength(level: OpportunityLevel): number {
  return OPPORTUNITY_LEVEL_META[level].strength;
}

export function getOpportunityLevelLabel(level: OpportunityLevel): string {
  return OPPORTUNITY_LEVEL_META[level].label;
}

export function getOpportunityLevelEmoji(level: OpportunityLevel): string {
  return OPPORTUNITY_LEVEL_META[level].emoji;
}

export const OPPORTUNITY_LEVEL_RULES: OpportunityLevelRule[] = [
  {
    level: 'ÇOK_GÜÇLÜ_FIRSAT',
    description: 'Karar güçlü alım ve tüm göstergeler olumlu',
    matches: (decision) => decision === 'GÜÇLÜ_AL',
  },
  {
    level: 'GÜÇLÜ_FIRSAT',
    description: 'Karar alım yönünde, güçlü görünüm',
    matches: (decision) => decision === 'AL',
  },
  {
    level: 'FIRSAT',
    description: 'İzle kararı ve güçlü AI skoru',
    matches: (decision, aiScore) => decision === 'İZLE' && aiScore != null && aiScore >= 70,
  },
  {
    level: 'İZLEME_LISTESI',
    description: 'İzle kararı veya sınırda bekleme',
    matches: (decision, aiScore) =>
      decision === 'İZLE' ||
      (decision === 'BEKLE' && aiScore != null && aiScore >= 55),
  },
  {
    level: 'BEKLE',
    description: 'Şu an için net fırsat yok',
    matches: () => true,
  },
];

export function evaluateOpportunityLevel(
  decision: DecisionId,
  aiScore: number | null,
  aiConfidence: number | null,
): OpportunityLevel {
  for (const rule of OPPORTUNITY_LEVEL_RULES) {
    if (rule.matches(decision, aiScore, aiConfidence)) {
      return rule.level;
    }
  }
  return 'BEKLE';
}
