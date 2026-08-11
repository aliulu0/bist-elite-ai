import { ResearchImportance } from '../interfaces/research.types';

export class ResearchQueryDto {
  company?: string;
  sector?: string;
  fromDate?: string;
  toDate?: string;
  source?: string;
  language?: string;
  importance?: ResearchImportance;
  keywords?: string; // Comma separated
  ticker?: string;
  page?: number = 1;
  limit?: number = 20;
  sortBy?: string = 'publishedAt';
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class ResearchArticleDto {
  id!: string;
  source!: string;
  provider!: string;
  title!: string;
  summary!: string;
  publishedAt!: string;
  url!: string;
  company?: string;
  sector?: string;
  country!: string;
  language!: string;
  importance!: ResearchImportance;
  tags!: string[];
  sentiment?: {
    score: number;
    label: string;
  };
}

export class ResearchResponseDto {
  data!: ResearchArticleDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}
