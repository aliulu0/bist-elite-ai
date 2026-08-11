import { AiResearchSource, ResearchImportance } from '../ai-research/ai-research.types';

export type CatalystCategory =
  | 'dividend'
  | 'bonus_issue'
  | 'capital_increase'
  | 'share_buyback'
  | 'new_investment'
  | 'factory_opening'
  | 'tender_win'
  | 'defense_contract'
  | 'patent'
  | 'rnd'
  | 'strategic_partnership'
  | 'foreign_investment'
  | 'ceo_change'
  | 'board_change'
  | 'credit_rating'
  | 'index_inclusion'
  | 'sector_rotation'
  | 'government_incentive'
  | 'capacity_expansion'
  | 'export_agreement'
  | 'large_customer_contract'
  | 'minor_news';

export type ExpectedImpact = 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';

export type TimeHorizon = 'immediate' | '1_day' | '1_week' | '1_month' | '3_months' | '6_months';

export interface CatalystEvent {
  id: string;
  ticker: string;
  category: CatalystCategory;
  title: string;
  description: string;
  importance: ResearchImportance;
  verified: boolean;
  verificationScore: number;
  date: string;
  source: string;
  provider: string;
  url?: string;
  expectedImpact: ExpectedImpact;
  timeHorizon: TimeHorizon;
  confidence: number;
  catalystScore: number;
  keywords: string[];
}

export interface CatalystResult {
  ticker: string;
  catalystScore: number;
  confidence: number;
  expectedImpact: ExpectedImpact;
  events: CatalystEvent[];
  verifiedCount: number;
  totalCount: number;
  rawSources: AiResearchSource[];
  generatedAt: string;
}

export interface CatalystDashboard {
  ticker: string;
  catalystScore: number;
  confidence: number;
  expectedImpact: ExpectedImpact;
  eventCount: number;
  verifiedCount: number;
  topEvents: CatalystEvent[];
  generatedAt: string;
}
