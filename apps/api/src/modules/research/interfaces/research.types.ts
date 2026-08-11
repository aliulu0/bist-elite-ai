export enum ResearchImportance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ResearchArticle {
  id: string;
  source: string;
  provider: string;
  title: string;
  summary: string;
  publishedAt: string;
  url: string;
  company?: string;
  sector?: string;
  country: string;
  language: string;
  importance: ResearchImportance;
  tags: string[];
  sentiment?: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
  };
}

export interface ResearchFilter {
  company?: string;
  sector?: string;
  fromDate?: string;
  toDate?: string;
  source?: string;
  language?: string;
  importance?: ResearchImportance;
  keywords?: string[];
  ticker?: string;
}

export interface ResearchProviderStatus {
  name: string;
  connected: boolean;
  circuitState: string;
  lastSync?: string;
  latency: number;
  errorCount: number;
  cacheStatus: string;
}
