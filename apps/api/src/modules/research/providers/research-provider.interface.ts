import { ResearchArticle, ResearchFilter } from '../interfaces/research.types';

export interface IResearchProvider {
  readonly name: string;
  fetchNews(filter?: ResearchFilter): Promise<ResearchArticle[]>;
  fetchCompanyNews(ticker: string, filter?: ResearchFilter): Promise<ResearchArticle[]>;
  fetchSectorNews(sector: string, filter?: ResearchFilter): Promise<ResearchArticle[]>;
  fetchEconomicNews(filter?: ResearchFilter): Promise<ResearchArticle[]>;
  fetchKAPAnnouncements(filter?: ResearchFilter): Promise<ResearchArticle[]>;
  fetchTCMBAnnouncements(filter?: ResearchFilter): Promise<ResearchArticle[]>;
  health(): Promise<boolean>;
  getStatus(): any;
}
