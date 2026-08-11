import { ResearchArticle, ResearchImportance } from './research.types';

export type ResearchEngine = 'google_search' | 'google_finance' | 'google_ai_mode';

export type ResearchSourceType = 'search' | 'finance' | 'ai' | 'news' | 'kap' | 'rss' | 'ir' | 'other';

export interface SerpSearchResultItem {
  position?: number;
  title?: string;
  link?: string;
  url?: string;
  displayedLink?: string;
  snippet?: string;
  source?: string;
  date?: string;
}

export interface SerpSearchResults {
  query: string;
  engine: ResearchEngine;
  results: SerpSearchResultItem[];
  totalResults?: number;
  searchTime?: number;
}

export interface GoogleFinanceRelatedCompany {
  name: string;
  ticker?: string;
}

export interface GoogleFinanceHighlight {
  label: string;
  value: string;
}

export interface GoogleFinanceKnowledgeGraph {
  title?: string;
  description?: string;
  url?: string;
}

export interface GoogleFinanceCompany {
  ticker: string;
  name?: string;
  exchange?: string;
  price?: number;
  currency?: string;
  marketCap?: string;
  peRatio?: string;
  summary?: string;
  recentNews: ResearchArticle[];
  relatedCompanies: GoogleFinanceRelatedCompany[];
  knowledgeGraph?: GoogleFinanceKnowledgeGraph;
  marketSummary: SerpSearchResultItem[];
  financialHighlights: GoogleFinanceHighlight[];
}

export type VerificationLevel = 'verified' | 'likely' | 'unknown';

export interface VerificationEvidence {
  source: string;
  sourceType: ResearchSourceType;
  url?: string;
  priority: number;
}

export interface VerifiedStatement {
  statement: string;
  level: VerificationLevel;
  evidence: VerificationEvidence[];
  verifiedAt: string;
}

export interface AiSource {
  title: string;
  url: string;
  source: string;
}

export interface AiResearchCitation {
  title: string;
  url: string;
  quote?: string;
}

export interface AiResearchSummary {
  summary: string;
  sources: AiSource[];
  citations: AiResearchCitation[];
  confidence: number;
  generatedAt: string;
  engine: 'google_ai_mode' | 'evidence';
}

export interface ResearchScoreFactors {
  sourceQuality: number;
  sourceCount: number;
  officialSources: number;
  freshness: number;
  duplicateRatio: number;
}

export interface ResearchScoreResult {
  score: number;
  factors: ResearchScoreFactors;
  grade: 'A' | 'B' | 'C' | 'D';
}

export type CatalystType =
  | 'new_investment'
  | 'tender'
  | 'government_contract'
  | 'dividend'
  | 'bonus_issue'
  | 'capital_increase'
  | 'patent'
  | 'factory'
  | 'partnership'
  | 'ceo_change'
  | 'spk_decision'
  | 'foreign_investment'
  | 'acquisition'
  | 'merger'
  | 'rnd'
  | 'export_contract';

export interface Catalyst {
  id: string;
  type: CatalystType;
  ticker?: string;
  sector?: string;
  title: string;
  statement: string;
  url?: string;
  source: string;
  sourceType: ResearchSourceType;
  detectedAt: string;
  importance: ResearchImportance;
  verification: VerificationLevel;
}

export interface ResearchEvidenceItem {
  id: string;
  source: string;
  sourceType: ResearchSourceType;
  title: string;
  snippet?: string;
  url?: string;
  publishedAt?: string;
  ticker?: string;
  sector?: string;
  language?: string;
  importance?: ResearchImportance;
  official: boolean;
  qualityScore: number;
}

export interface ResearchAggregationResult {
  items: ResearchEvidenceItem[];
  total: number;
  unique: number;
  duplicatesRemoved: number;
  bySourceType: Record<string, number>;
}

export interface ResearchAggregatorInput {
  search?: SerpSearchResults;
  companySearch?: SerpSearchResults;
  finance?: GoogleFinanceCompany | null;
  news?: ResearchArticle[];
  disclosures?: Array<{ title: string; date: string; url: string | null }>;
  ticker?: string;
  sector?: string;
  companyName?: string;
}

export interface CompanyResearchBundle {
  ticker: string;
  companyName?: string;
  sector?: string;
  aggregator: ResearchAggregationResult;
  score: ResearchScoreResult;
  verification: VerifiedStatement[];
  catalysts: Catalyst[];
  googleFinance: GoogleFinanceCompany | null;
  aiSummary: AiResearchSummary | null;
  generatedAt: string;
}

export interface ResearchIntelligenceDashboard {
  ticker?: string;
  companyName?: string;
  researchScore: ResearchScoreResult | null;
  verifiedSources: number;
  latestResearch: ResearchEvidenceItem[];
  catalysts: Catalyst[];
  googleFinanceSummary: GoogleFinanceCompany | null;
  aiSummary: AiResearchSummary | null;
  generatedAt: string;
}

export interface ResearchProviderStatusEntry {
  name: string;
  engine: ResearchEngine | 'rss';
  connected: boolean;
  circuitState: string;
  latency: number;
  requests: number;
  errors: number;
  quota: { used: number; limit: number | null } | null;
  lastSync: string | null;
  cacheStatus: string;
}
