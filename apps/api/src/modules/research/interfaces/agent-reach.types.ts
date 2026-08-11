export type SourceClassification = 'Official' | 'Government' | 'Company' | 'Exchange' | 'News' | 'Research' | 'Unknown';

export interface AgentReachSource {
  id: string;
  url: string;
  title: string;
  classification: SourceClassification;
  category: SourceCategory;
  company?: string;
  sector?: string;
  discoveredAt: string;
  lastVerifiedAt?: string;
  isOfficial: boolean;
  isActive: boolean;
  reliabilityScore: number;
}

export type SourceCategory = 'website' | 'ir' | 'rss' | 'pdf' | 'news' | 'governance' | 'esg' | 'press-release' | 'sector';

export interface DiscoveredPDF {
  id: string;
  url: string;
  fileName: string;
  date: string;
  type: PDFType;
  company: string;
  discoveredAt: string;
  source: string;
  classification: SourceClassification;
}

export type PDFType = 'annual-report' | 'quarterly-report' | 'investor-presentation' | 'sustainability-report' | 'governance-report' | 'esg-report' | 'other';

export interface DiscoveredRSS {
  id: string;
  url: string;
  category: string;
  company?: string;
  sector?: string;
  discoveredAt: string;
  source: string;
  classification: SourceClassification;
  isOfficial: boolean;
}

export interface CompanyResearchResult {
  ticker: string;
  companyName: string;
  sector: string;
  officialWebsite: string | null;
  investorRelationsUrl: string | null;
  annualReports: DiscoveredPDF[];
  quarterlyReports: DiscoveredPDF[];
  investorPresentations: DiscoveredPDF[];
  sustainabilityReports: DiscoveredPDF[];
  governanceDocuments: DiscoveredPDF[];
  esgReports: DiscoveredPDF[];
  pressReleases: AgentReachSource[];
  newsUrls: AgentReachSource[];
  rssUrls: DiscoveredRSS[];
  sources: AgentReachSource[];
  evidenceCount: number;
  officialCount: number;
  discoveredAt: string;
  expiresAt: string;
}

export interface AgentReachSearchResult {
  query: string;
  engine: string;
  results: AgentReachSource[];
  totalResults: number;
  searchTime: number;
  discoveredAt: string;
}

export interface AgentReachSectorResult {
  sector: string;
  companies: Array<{
    ticker: string;
    companyName: string;
    website: string | null;
    irUrl: string | null;
    rssCount: number;
    sourceCount: number;
    evidenceCount: number;
  }>;
  discoveredAt: string;
  expiresAt: string;
}