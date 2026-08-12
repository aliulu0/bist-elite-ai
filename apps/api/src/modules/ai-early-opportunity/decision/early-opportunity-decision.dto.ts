import { ApiProperty } from '@nestjs/swagger';
import {
  EarlyOpportunityDecision,
  DecisionDimension,
  DecisionGate,
  DecisionRiskSummary,
  DecisionSignalSummary,
  EarlyOpportunityDecisionSnapshot,
} from './early-opportunity-decision.types';

export class DecisionDimensionDto {
  @ApiProperty({ example: 'earlyStage' })
  id!: string;

  @ApiProperty({ example: 'Erken Aşama' })
  label!: string;

  @ApiProperty({ example: 0.15 })
  weight!: number;

  @ApiProperty({ example: 82 })
  score!: number;

  @ApiProperty({ example: true })
  present!: boolean;

  @ApiProperty({ example: 'Trend aşaması: Early.' })
  note!: string;

  static from(d: DecisionDimension): DecisionDimensionDto {
    const out = new DecisionDimensionDto();
    out.id = d.id;
    out.label = d.label;
    out.weight = d.weight;
    out.score = d.score;
    out.present = d.present;
    out.note = d.note;
    return out;
  }
}

export class DecisionGateDto {
  @ApiProperty({ example: 'PROVIDER_CONFLICT' })
  id!: string;

  @ApiProperty({ enum: ['invalidate', 'downgrade'] })
  severity!: string;

  @ApiProperty({ example: 'Sağlayıcılar arasında ciddi çelişki.' })
  reason!: string;

  static from(g: DecisionGate): DecisionGateDto {
    const out = new DecisionGateDto();
    out.id = g.id;
    out.severity = g.severity;
    out.reason = g.reason;
    return out;
  }
}

export class DecisionSignalSummaryDto {
  @ApiProperty({ example: 72 })
  convergenceScore!: number;

  @ApiProperty({ example: 5 })
  totalSignals!: number;

  @ApiProperty({ example: 2 })
  strongSignalCount!: number;

  @ApiProperty({ example: 3 })
  earlyCount!: number;

  @ApiProperty({ example: 2 })
  confirmedCount!: number;

  @ApiProperty({ example: 4 })
  categoryCoverage!: number;

  static from(s: DecisionSignalSummary): DecisionSignalSummaryDto {
    const out = new DecisionSignalSummaryDto();
    out.convergenceScore = s.convergenceScore;
    out.totalSignals = s.totalSignals;
    out.strongSignalCount = s.strongSignalCount;
    out.earlyCount = s.earlyCount;
    out.confirmedCount = s.confirmedCount;
    out.categoryCoverage = s.categoryCoverage;
    return out;
  }
}

export class DecisionRiskSummaryDto {
  @ApiProperty({ example: 'low' })
  level!: string;

  @ApiProperty({ nullable: true })
  riskRewardRatio!: number | null;

  @ApiProperty({ example: true })
  hasEntry!: boolean;

  @ApiProperty({ example: true })
  hasStop!: boolean;

  @ApiProperty({ example: true })
  hasTarget!: boolean;

  static from(r: DecisionRiskSummary): DecisionRiskSummaryDto {
    const out = new DecisionRiskSummaryDto();
    out.level = r.level;
    out.riskRewardRatio = r.riskRewardRatio;
    out.hasEntry = r.hasEntry;
    out.hasStop = r.hasStop;
    out.hasTarget = r.hasTarget;
    return out;
  }
}

export class EarlyOpportunityDecisionSnapshotDto {
  @ApiProperty()
  decisionTimestamp!: string;

  @ApiProperty({ example: 'THYAO' })
  symbol!: string;

  @ApiProperty({ type: [String] })
  timeframeContext!: string[];

  @ApiProperty({ example: 78 })
  decisionScore!: number;

  @ApiProperty({ example: 'EARLY_OPPORTUNITY' })
  decisionStatus!: string;

  @ApiProperty({ example: true })
  earlyOpportunity!: boolean;

  @ApiProperty({ nullable: true })
  entry!: { min: number; max: number } | null;

  @ApiProperty({ nullable: true })
  stop!: number | null;

  @ApiProperty({ nullable: true })
  target1!: number | null;

  @ApiProperty({ nullable: true })
  target2!: number | null;

  @ApiProperty({ example: 6.4 })
  expectedReturn!: number;

  @ApiProperty({ example: 78 })
  confidence!: number;

  @ApiProperty()
  evidence!: Record<string, number>;

  @ApiProperty({ example: 'a3f9c2...' })
  inputDigest!: string;

  static from(s: EarlyOpportunityDecisionSnapshot): EarlyOpportunityDecisionSnapshotDto {
    const out = new EarlyOpportunityDecisionSnapshotDto();
    out.decisionTimestamp = s.decisionTimestamp;
    out.symbol = s.symbol;
    out.timeframeContext = s.timeframeContext;
    out.decisionScore = s.decisionScore;
    out.decisionStatus = s.decisionStatus;
    out.earlyOpportunity = s.earlyOpportunity;
    out.entry = s.entry;
    out.stop = s.stop;
    out.target1 = s.target1;
    out.target2 = s.target2;
    out.expectedReturn = s.expectedReturn;
    out.confidence = s.confidence;
    out.evidence = s.evidence;
    out.inputDigest = s.inputDigest;
    return out;
  }
}

export class EarlyOpportunityDecisionDto {
  @ApiProperty({ example: 'THYAO' })
  ticker!: string;

  @ApiProperty({ example: 'Türk Hava Yolları' })
  company!: string;

  @ApiProperty({ example: 78 })
  decisionScore!: number;

  @ApiProperty({ enum: ['STRONG_EARLY_OPPORTUNITY', 'EARLY_OPPORTUNITY', 'WATCHLIST_OPPORTUNITY', 'CONFIRMED_OPPORTUNITY', 'EXTENDED_OPPORTUNITY', 'WEAK_OPPORTUNITY', 'INVALID_OPPORTUNITY'] })
  decisionStatus!: string;

  @ApiProperty({ example: 'Erken Fırsat' })
  statusLabel!: string;

  @ApiProperty({ example: '🟢' })
  statusEmoji!: string;

  @ApiProperty({ example: 'EARLY' })
  opportunityType!: string;

  @ApiProperty({ example: true })
  earlyOpportunity!: boolean;

  @ApiProperty({ example: 78 })
  confidence!: number;

  @ApiProperty({ example: 80 })
  convergence!: number;

  @ApiProperty({ example: 95 })
  coverage!: number;

  @ApiProperty({ nullable: true })
  trendStage!: string | null;

  @ApiProperty({ example: 85 })
  timeframeAgreement!: number;

  @ApiProperty({ example: 82 })
  predictionConfidence!: number;

  @ApiProperty({ example: 'very_strong' })
  smartMoneyStatus!: string;

  @ApiProperty({ example: 'strong' })
  catalystStatus!: string;

  @ApiProperty({ example: 'PASS' })
  fundamentalStatus!: string;

  @ApiProperty({ example: 'DATA_VERIFIED' })
  financialDataQualityStatus!: string;

  @ApiProperty({ type: DecisionSignalSummaryDto })
  signalSummary!: DecisionSignalSummaryDto;

  @ApiProperty({ example: 'verified' })
  verificationStatus!: string;

  @ApiProperty({ type: DecisionRiskSummaryDto })
  riskSummary!: DecisionRiskSummaryDto;

  @ApiProperty({ nullable: true })
  entryZone!: { min: number; max: number } | null;

  @ApiProperty({ nullable: true })
  stop!: number | null;

  @ApiProperty({ nullable: true })
  target1!: number | null;

  @ApiProperty({ nullable: true })
  target2!: number | null;

  @ApiProperty({ example: 6.4 })
  expectedReturn!: number;

  @ApiProperty({ nullable: true })
  bestTimeframe!: string | null;

  @ApiProperty({ nullable: true })
  worstTimeframe!: string | null;

  @ApiProperty({ type: [String] })
  reasons!: string[];

  @ApiProperty({ type: [String] })
  positiveFactors!: string[];

  @ApiProperty({ type: [String] })
  negativeFactors!: string[];

  @ApiProperty({ type: [String] })
  warnings!: string[];

  @ApiProperty({ example: 'fresh' })
  dataFreshness!: string;

  @ApiProperty({ example: 'consistent' })
  providerStatus!: string;

  @ApiProperty({ type: [DecisionDimensionDto] })
  dimensions!: DecisionDimensionDto[];

  @ApiProperty({
    type: 'object',
    properties: {
      invalidated: { type: 'array', items: { type: 'object' } },
      downgraded: { type: 'array', items: { type: 'object' } },
    },
  })
  gates!: { invalidated: DecisionGateDto[]; downgraded: DecisionGateDto[] };

  @ApiProperty({ type: EarlyOpportunityDecisionSnapshotDto })
  snapshot!: EarlyOpportunityDecisionSnapshotDto;

  @ApiProperty({ example: 'THYAO (Türk Hava Yolları) için karar: Erken Fırsat.\nKarar skoru 78/100...' })
  explanation!: string;

  @ApiProperty()
  generatedAt!: string;

  static from(d: EarlyOpportunityDecision): EarlyOpportunityDecisionDto {
    const out = new EarlyOpportunityDecisionDto();
    out.ticker = d.ticker;
    out.company = d.company;
    out.decisionScore = d.decisionScore;
    out.decisionStatus = d.decisionStatus;
    out.statusLabel = d.statusLabel;
    out.statusEmoji = d.statusEmoji;
    out.opportunityType = d.opportunityType;
    out.earlyOpportunity = d.earlyOpportunity;
    out.confidence = d.confidence;
    out.convergence = d.convergence;
    out.coverage = d.coverage;
    out.trendStage = d.trendStage;
    out.timeframeAgreement = d.timeframeAgreement;
    out.predictionConfidence = d.predictionConfidence;
    out.smartMoneyStatus = d.smartMoneyStatus;
    out.catalystStatus = d.catalystStatus;
    out.fundamentalStatus = d.fundamentalStatus;
    out.financialDataQualityStatus = d.financialDataQualityStatus;
    out.signalSummary = DecisionSignalSummaryDto.from(d.signalSummary);
    out.verificationStatus = d.verificationStatus;
    out.riskSummary = DecisionRiskSummaryDto.from(d.riskSummary);
    out.entryZone = d.entryZone;
    out.stop = d.stop;
    out.target1 = d.target1;
    out.target2 = d.target2;
    out.expectedReturn = d.expectedReturn;
    out.bestTimeframe = d.bestTimeframe;
    out.worstTimeframe = d.worstTimeframe;
    out.reasons = d.reasons;
    out.positiveFactors = d.positiveFactors;
    out.negativeFactors = d.negativeFactors;
    out.warnings = d.warnings;
    out.dataFreshness = d.dataFreshness;
    out.providerStatus = d.providerStatus;
    out.dimensions = d.dimensions.map(DecisionDimensionDto.from);
    out.gates = {
      invalidated: d.gates.invalidated.map(DecisionGateDto.from),
      downgraded: d.gates.downgraded.map(DecisionGateDto.from),
    };
    out.snapshot = EarlyOpportunityDecisionSnapshotDto.from(d.snapshot);
    out.explanation = d.explanation;
    out.generatedAt = d.generatedAt;
    return out;
  }
}
