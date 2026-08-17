import { AiProviderConfig, AiProviderName } from './ai-research.types';

export const CONSENSUS_CACHE_NAMESPACE = 'research';
export const CONSENSUS_TTL_MS = 5 * 60_000;

export const AI_RESEARCH_PROVIDERS: AiProviderConfig[] = [
  { name: 'chatgpt', category: 'ai', enabled: false, priority: 100, ttlMs: 5 * 60_000 },
  { name: 'gemini', category: 'ai', enabled: false, priority: 100, ttlMs: 5 * 60_000 },
  { name: 'perplexity', category: 'ai', enabled: false, priority: 100, ttlMs: 5 * 60_000 },
  { name: 'grok', category: 'ai', enabled: false, priority: 100, ttlMs: 5 * 60_000 },
  { name: 'serpapi', category: 'search', enabled: true, priority: 80, ttlMs: 5 * 60_000 },
  { name: 'google-news', category: 'news', enabled: true, priority: 80, ttlMs: 5 * 60_000 },
  { name: 'google-search', category: 'search', enabled: true, priority: 80, ttlMs: 5 * 60_000 },
  {
    name: 'yahoo-finance',
    category: 'fundamental',
    enabled: true,
    priority: 90,
    ttlMs: 10 * 60_000,
  },
  { name: 'kap', category: 'regulatory', enabled: true, priority: 90, ttlMs: 10 * 60_000 },
  { name: 'tcmb', category: 'macro', enabled: true, priority: 60, ttlMs: 15 * 60_000 },
  { name: 'mkk', category: 'regulatory', enabled: false, priority: 60, ttlMs: 10 * 60_000 },
];

export function getProviderConfig(name: AiProviderName): AiProviderConfig {
  const config = AI_RESEARCH_PROVIDERS.find((provider) => provider.name === name);
  if (!config) {
    throw new Error(`AI Research provider config not found: ${name}`);
  }
  return config;
}
