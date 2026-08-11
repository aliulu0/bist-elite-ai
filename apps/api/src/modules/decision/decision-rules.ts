import { DecisionId, DecisionInput } from './decision.types';

export type DecisionField =
  | 'aiScore'
  | 'aiConfidence'
  | 'strategyScore'
  | 'strategyConfidence'
  | 'technical'
  | 'fundamental'
  | 'momentum'
  | 'trend'
  | 'liquidity'
  | 'risk'
  | 'volume'
  | 'quality'
  | 'verification'
  | 'catalyst';

export interface DecisionCondition {
  field: DecisionField;
  min?: number;
  max?: number;
}

export interface DecisionRule {
  id: string;
  decision: DecisionId;
  decisionLabel: string;
  strength: number;
  description: string;
  conditions: DecisionCondition[];
}

/**
 * Deterministic decision rule table.
 * Evaluation is first-match-wins in array order.
 * Strength is used for ranking: higher = stronger bull signal.
 */
export const DECISION_RULES: DecisionRule[] = [
  {
    id: 'GUCLU_AL',
    decision: 'GÜÇLÜ_AL',
    decisionLabel: 'GÜÇLÜ AL',
    strength: 7,
    description: 'Tüm göstergeler güçlü alım yönünde hizalanmış',
    conditions: [
      { field: 'aiScore', min: 90 },
      { field: 'aiConfidence', min: 85 },
      { field: 'verification', min: 80 },
      { field: 'catalyst', min: 75 },
    ],
  },
  {
    id: 'GUCLU_SAT',
    decision: 'GÜÇLÜ_SAT',
    decisionLabel: 'GÜÇLÜ SAT',
    strength: 1,
    description: 'Göstergeler güçlü satış sinyali veriyor',
    conditions: [{ field: 'aiScore', max: 20 }],
  },
  {
    id: 'RISKLI',
    decision: 'RİSKLİ',
    decisionLabel: 'RİSKLİ',
    strength: 3,
    description: 'Yüksek risk profili, temkinli olunmalı',
    conditions: [{ field: 'risk', max: 30 }],
  },
  {
    id: 'AL',
    decision: 'AL',
    decisionLabel: 'AL',
    strength: 6,
    description: 'Genel görünüm alım yönünde',
    conditions: [
      { field: 'aiScore', min: 75 },
      { field: 'aiConfidence', min: 65 },
    ],
  },
  {
    id: 'SAT',
    decision: 'SAT',
    decisionLabel: 'SAT',
    strength: 2,
    description: 'Zayıf göstergeler satış baskısına işaret ediyor',
    conditions: [{ field: 'aiScore', max: 40 }],
  },
  {
    id: 'IZLE',
    decision: 'İZLE',
    decisionLabel: 'İZLE',
    strength: 5,
    description: 'Piyasa gelişmeleri yakından izlenmeli',
    conditions: [{ field: 'aiScore', min: 60 }],
  },
  {
    id: 'BEKLE',
    decision: 'BEKLE',
    decisionLabel: 'BEKLE',
    strength: 4,
    description: 'Net sinyal yok, beklemek en doğrusu',
    conditions: [],
  },
];

export function getDecisionStrength(decision: DecisionId): number {
  const rule = DECISION_RULES.find((r) => r.decision === decision);
  return rule ? rule.strength : 0;
}

export function getDecisionLabel(decision: DecisionId): string {
  const rule = DECISION_RULES.find((r) => r.decision === decision);
  return rule ? rule.decisionLabel : decision;
}

export function getFieldValue(
  input: DecisionInput,
  field: DecisionField,
): number | null {
  switch (field) {
    case 'aiScore':
      return input.aiScore;
    case 'aiConfidence':
      return input.aiConfidence;
    case 'strategyScore':
      return input.strategyScore;
    case 'strategyConfidence':
      return input.strategyConfidence;
    case 'technical':
      return input.dimensions.technical;
    case 'fundamental':
      return input.dimensions.fundamental;
    case 'momentum':
      return input.dimensions.momentum;
    case 'trend':
      return input.dimensions.trend;
    case 'liquidity':
      return input.dimensions.liquidity;
    case 'risk':
      return input.dimensions.risk;
    case 'volume':
      return input.dimensions.volume;
    case 'quality':
      return input.dimensions.quality;
    case 'verification':
      return input.dimensions.verification;
    case 'catalyst':
      return input.dimensions.catalyst;
    default:
      return null;
  }
}

export function matchesRule(rule: DecisionRule, input: DecisionInput): boolean {
  for (const condition of rule.conditions) {
    const value = getFieldValue(input, condition.field);
    if (value == null) {
      return false;
    }
    if (condition.min != null && value < condition.min) {
      return false;
    }
    if (condition.max != null && value > condition.max) {
      return false;
    }
  }
  return true;
}

export function evaluateDecision(input: DecisionInput): DecisionRule {
  for (const rule of DECISION_RULES) {
    if (matchesRule(rule, input)) {
      return rule;
    }
  }
  const fallback = DECISION_RULES.find((r) => r.id === 'BEKLE');
  return fallback ?? DECISION_RULES[0];
}
