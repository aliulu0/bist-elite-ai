import { TrustedSourceRank } from './verification-ai.types';

export const VERIFICATION_CACHE_NAMESPACE = 'research';
export const VERIFICATION_CACHE_KEY_PREFIX = 'verification:';
export const VERIFICATION_TTL_MS = 10 * 60_000;

export const TRUTH_TRUE_THRESHOLD = 0.7;
export const TRUTH_FALSE_THRESHOLD = 0.35;

export const TRUSTED_SOURCE_RANKS: TrustedSourceRank[] = [
  { provider: 'kap', rank: 1, weight: 100, label: 'KAP' },
  { provider: 'company-ir', rank: 2, weight: 95, label: 'Company IR' },
  { provider: 'tcmb', rank: 3, weight: 85, label: 'TCMB' },
  { provider: 'mkk', rank: 4, weight: 80, label: 'MKK' },
  { provider: 'yahoo-finance', rank: 5, weight: 70, label: 'Yahoo Finance' },
  { provider: 'google-news', rank: 6, weight: 50, label: 'SerpAPI Google News' },
  { provider: 'serpapi', rank: 8, weight: 40, label: 'SerpAPI Search' },
  { provider: 'google-search', rank: 8, weight: 40, label: 'SerpAPI Search' },
];

const COMPANY_IR_MARKERS = ['yatirimci', 'investor', 'ir.', 'ir@', 'ir/', 'investor-relations'];

export function isOfficialProvider(provider: string, source: string): boolean {
  if (provider === 'kap' || provider === 'tcmb' || provider === 'mkk') return true;
  if (provider === 'company-ir') return true;
  const normalized = source.toLowerCase();
  return COMPANY_IR_MARKERS.some((marker) => normalized.includes(marker));
}

export function resolveTrustRank(provider: string, source: string): TrustedSourceRank {
  const normalized = source.toLowerCase();
  const isCompanyIR = COMPANY_IR_MARKERS.some((marker) => normalized.includes(marker));
  if (isCompanyIR) {
    return { provider: 'company-ir', rank: 2, weight: 95, label: 'Company IR' };
  }
  const found = TRUSTED_SOURCE_RANKS.find((rank) => rank.provider === provider);
  return found ?? { provider, rank: 10, weight: 20, label: 'Other' };
}
