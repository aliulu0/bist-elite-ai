import { ApiProperty } from '@nestjs/swagger';
import { EarlyOpportunityIntelligenceResult } from '../early-opportunity.types';
import { FundamentalValidationReport } from '../../financial-rules/fundamental-validation.service';
import { FinancialDataQualityReport } from '../../financial-rules/financial-data-quality.types';
import { EarlySignalDto } from '../signals/signals.dto';
import { EarlyOpportunityDecisionDto } from '../decision/early-opportunity-decision.dto';

export class EarlyScoreComponentsDto {
  @ApiProperty({ example: 72 })
  bullishProbability!: number;

  @ApiProperty({ example: 81 })
  confidence!: number;

  @ApiProperty({ example: 25 })
  expectedReturn!: number;

  @ApiProperty({ example: 21 })
  riskAdjustedReturn!: number;

  @ApiProperty({ example: 68 })
  smartMoneyScore!: number;

  @ApiProperty({ example: 75 })
  catalystScore!: number;

  @ApiProperty({ example: true })
  verification!: boolean;

  @ApiProperty({ example: 77 })
  researchScore!: number;

  @ApiProperty({ example: 79 })
  eliteScore!: number;

  @ApiProperty({ example: 65 })
  backtestWinRate!: number;

  @ApiProperty({ example: 82 })
  opportunityScore!: number;

  @ApiProperty({ example: 80 })
  decisionScore!: number;

  @ApiProperty({ example: 100 })
  timeframeAgreement!: number;
}

export class CatalystSummaryDto {
  @ApiProperty({ example: 70 })
  score!: number;

  @ApiProperty({ example: true })
  verified!: boolean;
}

export class SmartMoneySummaryDto {
  @ApiProperty({ example: 78 })
  score!: number;

  @ApiProperty({ example: 'very_strong' })
  accumulation!: string;
}

export class ResearchConsensusSummaryDto {
  @ApiProperty({ example: 72 })
  agreementLevel!: number;

  @ApiProperty({ example: 81 })
  confidence!: number;

  @ApiProperty({ example: 78 })
  consensusScore!: number;

  @ApiProperty({ example: 'Borsa açılışında alım baskısı gördü.' })
  summary!: string;

  @ApiProperty({ example: 5 })
  evidenceCount!: number;
}

export class FundamentalsDto {
  @ApiProperty({ example: 'PASS' })
  overallStatus!: string;

  @ApiProperty({ example: 85 })
  score!: number;

  @ApiProperty({ example: ['PD/DD: geçti (1.250.0)'] })
  reasons!: string[];
}

export class FreshnessReportDto {
  @ApiProperty({ enum: ['fresh', 'stale', 'unknown'] })
  price!: string;

  @ApiProperty({ enum: ['fresh', 'stale', 'unknown'] })
  fundamental!: string;

  @ApiProperty({ enum: ['fresh', 'stale', 'unknown'] })
  research!: string;

  @ApiProperty({ enum: ['fresh', 'stale', 'unknown'] })
  overall!: string;
}

export class MarketIntegrityReportDto {
  @ApiProperty({ example: true })
  valid!: boolean;

  @ApiProperty({ type: [String] })
  errors!: string[];

  @ApiProperty({ type: [String] })
  warnings!: string[];
}

export class FundamentalQualityReportDto {
  @ApiProperty({ nullable: true })
  status!: string | null;

  @ApiProperty({ example: 85 })
  score!: number;

  @ApiProperty({ nullable: true })
  dataQuality!: string | null;
}

export class ProviderSummaryDto {
  @ApiProperty({ nullable: true })
  price?: string;

  @ApiProperty({ nullable: true })
  fundamental?: string;

  @ApiProperty({ type: [String] })
  research!: string[];

  @ApiProperty({ example: false })
  fallbackUsed!: boolean;

  @ApiProperty({ type: [String] })
  attemptedAt!: string[];
}

export class FinancialDataQualityReportDto {
  @ApiProperty({ example: 'THYAO' })
  ticker!: string;

  @ApiProperty({ example: 85 })
  qualityScore!: number;

  @ApiProperty({ enum: ['DATA_VERIFIED', 'DATA_ACCEPTABLE', 'DATA_WARNING', 'DATA_INSUFFICIENT'] })
  status!: string;

  @ApiProperty({ type: FreshnessReportDto })
  freshness!: FreshnessReportDto;

  @ApiProperty({ example: 90 })
  freshnessScore!: number;

  @ApiProperty({ example: 100 })
  marketDataScore!: number;

  @ApiProperty({ type: MarketIntegrityReportDto })
  marketIntegrity!: MarketIntegrityReportDto;

  @ApiProperty({ type: FundamentalQualityReportDto, nullable: true })
  fundamental!: FundamentalQualityReportDto | null;

  @ApiProperty({ example: 85 })
  fundamentalDataScore!: number;

  @ApiProperty({ type: ProviderSummaryDto })
  providers!: ProviderSummaryDto;

  @ApiProperty({ example: 100 })
  providerConsistencyScore!: number;

  @ApiProperty({ enum: ['consistent', 'partial', 'conflicting'] })
  providerConsistencyStatus!: string;

  @ApiProperty({ type: [String] })
  conflicts!: string[];

  @ApiProperty({ example: 100 })
  completenessScore!: number;

  @ApiProperty({ type: [String] })
  missingFields!: string[];

  @ApiProperty({ example: 100 })
  integrityScore!: number;

  @ApiProperty({ type: [String] })
  warnings!: string[];

  @ApiProperty({ type: [String] })
  errors!: string[];

  @ApiProperty()
  timestamp!: string;

  static from(report: FinancialDataQualityReport): FinancialDataQualityReportDto {
    const dto = new FinancialDataQualityReportDto();
    dto.ticker = report.ticker;
    dto.qualityScore = report.qualityScore;
    dto.status = report.status;
    dto.freshness = report.freshness;
    dto.freshnessScore = report.freshnessScore;
    dto.marketDataScore = report.marketDataScore;
    dto.marketIntegrity = report.marketIntegrity;
    dto.fundamental = report.fundamental
      ? {
          status: report.fundamental.status,
          score: report.fundamental.score,
          dataQuality: report.fundamental.dataQuality,
        }
      : null;
    dto.fundamentalDataScore = report.fundamentalDataScore;
    dto.providers = report.providers;
    dto.providerConsistencyScore = report.providerConsistencyScore;
    dto.providerConsistencyStatus = report.providerConsistencyStatus;
    dto.conflicts = report.conflicts;
    dto.completenessScore = report.completenessScore;
    dto.missingFields = report.missingFields;
    dto.integrityScore = report.integrityScore;
    dto.warnings = report.warnings;
    dto.errors = report.errors;
    dto.timestamp = report.timestamp;
    return dto;
  }
}

export class EarlyOpportunityIntelligenceDto {
  @ApiProperty({ example: 'THYAO' })
  ticker!: string;

  @ApiProperty({ example: 'Türk Hava Yolları' })
  company!: string;

  @ApiProperty({ example: 'Ulaştırma' })
  sector!: string;

  @ApiProperty({ example: 185000000000 })
  marketCap!: number | null;

  @ApiProperty({ example: 78 })
  earlyOpportunityScore!: number;

  @ApiProperty({ example: 'GÜÇLÜ_FIRSAT' })
  level!: string;

  @ApiProperty({ example: 79 })
  eliteScore!: number;

  @ApiProperty({ example: 81 })
  confidence!: number;

  @ApiProperty({ example: 84 })
  bullishPercent!: number;

  @ApiProperty({ example: 'low' })
  risk!: string;

  @ApiProperty({ example: 6.4 })
  expectedReturn!: number;

  @ApiProperty({ nullable: true })
  entryZone!: { min: number; max: number } | null;

  @ApiProperty({ nullable: true })
  stop!: number | null;

  @ApiProperty({ nullable: true })
  target1!: number | null;

  @ApiProperty({ nullable: true })
  target2!: number | null;

  @ApiProperty({ nullable: true })
  riskRewardRatio!: number | null;

  @ApiProperty({ nullable: true })
  holdingPeriod!: { value: number; unit: string } | null;

  @ApiProperty({ type: CatalystSummaryDto, nullable: true })
  catalyst!: CatalystSummaryDto | null;

  @ApiProperty({ type: SmartMoneySummaryDto, nullable: true })
  smartMoney!: SmartMoneySummaryDto | null;

  @ApiProperty({ example: 'verified', enum: ['verified', 'unverified', 'unknown'] })
  verificationStatus!: string;

  @ApiProperty({ type: ResearchConsensusSummaryDto, nullable: true })
  researchConsensus!: ResearchConsensusSummaryDto | null;

  @ApiProperty({ type: FundamentalsDto, nullable: true })
  fundamentals!: FundamentalsDto | null;

  @ApiProperty({ type: FinancialDataQualityReportDto, nullable: true })
  financialDataQuality!: FinancialDataQualityReportDto | null;

  @ApiProperty({ type: [EarlySignalDto] })
  signals!: EarlySignalDto[];

  @ApiProperty({ example: 72 })
  signalConvergenceScore!: number;

  @ApiProperty({ example: 5 })
  earlySignalCount!: number;

  @ApiProperty({ example: 3 })
  confirmedSignalCount!: number;

  @ApiProperty({ type: [EarlySignalDto] })
  topSignals!: EarlySignalDto[];

  @ApiProperty({ type: EarlyOpportunityDecisionDto, nullable: true })
  decision!: EarlyOpportunityDecisionDto | null;

  @ApiProperty({ example: 'bullish' })
  momentum!: string;

  @ApiProperty({ example: 'up' })
  trend!: string;

  @ApiProperty({ example: 'high' })
  liquidityQuality!: string;

  @ApiProperty({ example: 100 })
  timeframeAgreement!: number;

  @ApiProperty({ example: ['Yüksek yaşıl olasılık (multi-timeframe)'] })
  reasons!: string[];

  @ApiProperty()
  evaluatedAt!: string;

static from(result: EarlyOpportunityIntelligenceResult): EarlyOpportunityIntelligenceDto {
    const dto = new EarlyOpportunityIntelligenceDto();
    dto.ticker = result.ticker;
    dto.company = result.company;
    dto.sector = result.sector;
    dto.marketCap = result.marketCap;
    dto.earlyOpportunityScore = result.earlyOpportunityScore;
    dto.level = result.earlyOpportunityLevel;
    dto.eliteScore = result.eliteScore;
    dto.confidence = result.confidence;
    dto.bullishPercent = result.bullishPercent;
    dto.risk = result.risk;
    dto.expectedReturn = result.expectedReturn;
    dto.entryZone = result.entryZone;
    dto.stop = result.stop;
    dto.target1 = result.target1;
    dto.target2 = result.target2;
    dto.riskRewardRatio = result.riskRewardRatio;
    dto.holdingPeriod = result.holdingPeriod;
    dto.catalyst = result.catalyst;
    dto.smartMoney = result.smartMoney;
     dto.verificationStatus = result.verificationStatus;
     dto.researchConsensus = result.researchConsensus;
     dto.fundamentals = result.fundamentals
       ? {
           overallStatus: result.fundamentals.overallStatus,
           score: result.fundamentals.score,
           reasons: result.fundamentals.reasons,
         }
       : null;
     dto.financialDataQuality = result.financialDataQuality
       ? FinancialDataQualityReportDto.from(result.financialDataQuality)
       : null;
     dto.momentum = result.momentum;
     dto.trend = result.trend;
     dto.liquidityQuality = result.liquidityQuality;
     dto.timeframeAgreement = result.timeframeAgreement;
     dto.reasons = result.reasons;
     dto.signals = (result.signals ?? []).map(EarlySignalDto.from);
     dto.signalConvergenceScore = result.signalConvergenceScore ?? 0;
     dto.earlySignalCount = result.earlySignalCount ?? 0;
     dto.confirmedSignalCount = result.confirmedSignalCount ?? 0;
     dto.topSignals = (result.topSignals ?? []).map(EarlySignalDto.from);
     dto.decision = result.decision ? EarlyOpportunityDecisionDto.from(result.decision) : null;
     dto.evaluatedAt = result.evaluatedAt;
     return dto;
   }
}

export class EarlyOpportunityIntelligenceScanDto {
  @ApiProperty({ type: [EarlyOpportunityIntelligenceDto] })
  results!: EarlyOpportunityIntelligenceDto[];

  @ApiProperty({ example: 10 })
  total!: number;

  @ApiProperty()
  generatedAt!: string;
}

export class SelfLearningEntryDto {
  @ApiProperty({ example: 'THYAO' })
  ticker!: string;

  @ApiProperty({ example: 82 })
  predictedBullish!: number;

  @ApiProperty({ example: 60 })
  realizedWinRate!: number;

  @ApiProperty({ example: 0.98 })
  modifier!: number;

  @ApiProperty({ example: 'Gerçekleşen kazanma oranı (%)60, tahminden (%82) daha düşük; güven azaltılıyor.' })
  rationale!: string;
}

export class SelfLearningReportDto {
  @ApiProperty({ example: 142 })
  scanned!: number;

  @ApiProperty({ example: 97 })
  updated!: number;

  @ApiProperty({ type: [SelfLearningEntryDto] })
  modifiers!: SelfLearningEntryDto[];

  @ApiProperty()
  generatedAt!: string;
}
