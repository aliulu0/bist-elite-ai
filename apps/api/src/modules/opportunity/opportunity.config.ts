export interface OpportunityDimensionWeights {
  financial: number;
  technical: number;
  confluence: number;
  smartMoney: number;
  marketStructure: number;
}

export interface OpportunityLevelThresholds {
  veryHigh: number;
  high: number;
  medium: number;
  low: number;
}

export interface FinancialQualityCriteria {
  minScore: number;
  minPassedRules: number;
  maxFailedRules: number;
}

export interface TechnicalQualityCriteria {
  minScore: number;
  minPassedRules: number;
}

export interface ConfluenceCriteria {
  minScore: number;
  minAgreement: string;
}

export interface SmartMoneyCriteria {
  minAccumulationScore: number;
  preferInstitutionalActivity: string[];
}

export interface MarketStructureCriteria {
  preferredTrends: string[];
  minSupportZones: number;
  maxResistanceZones: number;
}

export interface OpportunityConfig {
  dimensionWeights: OpportunityDimensionWeights;
  levelThresholds: OpportunityLevelThresholds;
  minConfidenceForEarlyOpportunity: number;
  minCandidateScore: number;
  financialQuality: FinancialQualityCriteria;
  technicalQuality: TechnicalQualityCriteria;
  confluence: ConfluenceCriteria;
  smartMoney: SmartMoneyCriteria;
  marketStructure: MarketStructureCriteria;
}

export const DEFAULT_OPPORTUNITY_CONFIG: OpportunityConfig = {
  dimensionWeights: {
    financial: 20,
    technical: 20,
    confluence: 25,
    smartMoney: 20,
    marketStructure: 15,
  },
  levelThresholds: {
    veryHigh: 85,
    high: 70,
    medium: 55,
    low: 40,
  },
  minConfidenceForEarlyOpportunity: 0.5,
  minCandidateScore: 50,
  financialQuality: {
    minScore: 50,
    minPassedRules: 2,
    maxFailedRules: 3,
  },
  technicalQuality: {
    minScore: 50,
    minPassedRules: 8,
  },
  confluence: {
    minScore: 55,
    minAgreement: 'MEDIUM',
  },
  smartMoney: {
    minAccumulationScore: 30,
    preferInstitutionalActivity: ['accumulating', 'neutral'],
  },
  marketStructure: {
    preferredTrends: ['uptrend', 'sideways'],
    minSupportZones: 1,
    maxResistanceZones: 2,
  },
};
