import { ResearchArticle, ResearchImportance } from '../research/interfaces/research.types';
import {
  Company,
  FinancialStatement,
  Disclosure,
  MarketDataResult,
} from '../market-data/interfaces/unified-domain.types';
import { MacroIndicator } from '../market-data/interfaces/macro-indicator.types';

export { ResearchImportance };

export type AiProviderName =
  | 'chatgpt'
  | 'gemini'
  | 'perplexity'
  | 'grok'
  | 'serpapi'
  | 'google-news'
  | 'google-search'
  | 'yahoo-finance'
  | 'kap'
  | 'tcmb'
  | 'mkk';

export type AiProviderCategory = 'ai' | 'search' | 'news' | 'fundamental' | 'regulatory' | 'macro';

export interface AiProviderConfig {
  name: AiProviderName;
  category: AiProviderCategory;
  enabled: boolean;
  priority: number;
  ttlMs: number;
}

export interface ResearchBundle {
  ticker: string;
  news: ResearchArticle[];
  company: MarketDataResult<Company> | null;
  financials: MarketDataResult<FinancialStatement> | null;
  disclosures: MarketDataResult<Disclosure[]> | null;
  macro: MacroIndicator[];
}

export interface AiEvidenceItem {
  id: string;
  provider: AiProviderName;
  source: string;
  sourceType: string;
  title: string;
  snippet?: string;
  url?: string;
  publishedAt?: string;
  importance: ResearchImportance;
  official: boolean;
  qualityScore: number;
  sentiment?: { score: number; label: 'positive' | 'neutral' | 'negative' };
  contentHash: string;
}

export interface AiProviderResult {
  provider: AiProviderName;
  category: AiProviderCategory;
  status: 'success' | 'empty' | 'disabled' | 'error';
  summary: string;
  items: AiEvidenceItem[];
  error?: string;
  collectedAt: string;
}

export interface AiProviderStatus {
  name: AiProviderName;
  category: AiProviderCategory;
  enabled: boolean;
  status: string;
  lastSync: string | null;
  totalRequests: number;
}

export interface AiConflict {
  id: string;
  providers: AiProviderName[];
  topic: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface AiResearchSource {
  provider: AiProviderName;
  source: string;
  title: string;
  url?: string;
  publishedAt?: string;
}

export interface AIConsensus {
  ticker: string;
  chatgptSummary: string | null;
  geminiSummary: string | null;
  perplexitySummary: string | null;
  grokSummary: string | null;
  newsSummary: string;
  researchSources: AiResearchSource[];
  agreementLevel: number;
  conflicts: AiConflict[];
  confidence: number;
  consensusScore: number;
  providerSummaries: Record<string, string>;
  totalEvidence: number;
  duplicatesRemoved: number;
  timestamp: string;
}
