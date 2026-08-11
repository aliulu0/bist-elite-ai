import { CatalystCategory, ExpectedImpact, TimeHorizon } from './catalyst.types';

export const CATALYST_CACHE_NAMESPACE = 'research';
export const CATALYST_CACHE_KEY_PREFIX = 'catalyst:';
export const CATALYST_TTL_MS = 10 * 60_000;

export interface CatalystCategoryConfig {
  category: CatalystCategory;
  weight: number;
  impact: ExpectedImpact;
  timeHorizon: TimeHorizon;
  keywords: string[];
}

export const CATALYST_CATEGORIES: CatalystCategoryConfig[] = [
  {
    category: 'tender_win',
    weight: 95,
    impact: 'very_bullish',
    timeHorizon: '1_week',
    keywords: ['ihale kazan', 'ihale al', 'tender win', 'tender won', 'ihale', 'sözleşme imzala', 'contract award'],
  },
  {
    category: 'new_investment',
    weight: 90,
    impact: 'very_bullish',
    timeHorizon: '3_months',
    keywords: ['yeni yatırım', 'large investment', 'yatırım planı', 'investment plan', 'big investment'],
  },
  {
    category: 'defense_contract',
    weight: 92,
    impact: 'very_bullish',
    timeHorizon: '1_week',
    keywords: ['savunma sözleşme', 'defense contract', 'savunma ihale', 'askeri ihale', 'defense deal'],
  },
  {
    category: 'large_customer_contract',
    weight: 90,
    impact: 'very_bullish',
    timeHorizon: '1_month',
    keywords: ['büyük müşteri', 'large customer', 'büyük sipariş', 'major order', 'önemli müşteri'],
  },
  {
    category: 'export_agreement',
    weight: 82,
    impact: 'bullish',
    timeHorizon: '1_month',
    keywords: ['ihracat anlaşma', 'export agreement', 'ihracat sözleşme', 'export contract', 'yeni ihracat'],
  },
  {
    category: 'factory_opening',
    weight: 88,
    impact: 'bullish',
    timeHorizon: '3_months',
    keywords: ['fabrika aç', 'factory opening', 'yeni fabrika', 'new factory', 'üretim tesisi'],
  },
  {
    category: 'capacity_expansion',
    weight: 85,
    impact: 'bullish',
    timeHorizon: '3_months',
    keywords: ['kapasite artır', 'capacity expansion', 'kapasite yatırım', 'capacity increase'],
  },
  {
    category: 'patent',
    weight: 80,
    impact: 'bullish',
    timeHorizon: '6_months',
    keywords: ['patent', 'patent al', 'patent başvuru'],
  },
  {
    category: 'rnd',
    weight: 50,
    impact: 'neutral',
    timeHorizon: '6_months',
    keywords: ['ar-ge', 'ar-ge yatırım', 'araştırma geliştirme', 'research development', 'new ar-ge'],
  },
  {
    category: 'strategic_partnership',
    weight: 75,
    impact: 'bullish',
    timeHorizon: '1_month',
    keywords: ['stratejik ortaklık', 'strategic partnership', 'iş birliği', 'partnership', 'anlaşma'],
  },
  {
    category: 'foreign_investment',
    weight: 72,
    impact: 'bullish',
    timeHorizon: '1_month',
    keywords: ['yabancı yatırım', 'foreign investment', 'yabancı fon', 'foreign fund'],
  },
  {
    category: 'capital_increase',
    weight: 70,
    impact: 'neutral',
    timeHorizon: '1_month',
    keywords: ['sermaye artırımı', 'capital increase', 'bedelli'],
  },
  {
    category: 'bonus_issue',
    weight: 70,
    impact: 'bullish',
    timeHorizon: '1_week',
    keywords: ['bedelsiz', 'bonus issue', 'bedelsiz sermaye'],
  },
  {
    category: 'dividend',
    weight: 65,
    impact: 'bullish',
    timeHorizon: '1_week',
    keywords: ['temettü', 'kar payı', 'dividend'],
  },
  {
    category: 'share_buyback',
    weight: 68,
    impact: 'bullish',
    timeHorizon: '1_month',
    keywords: ['geri alım', 'share buyback', 'buyback', 'pay geri alım'],
  },
  {
    category: 'index_inclusion',
    weight: 68,
    impact: 'bullish',
    timeHorizon: '1_month',
    keywords: ['endekse dahil', 'index inclusion', 'endeks girişi', 'index entry'],
  },
  {
    category: 'government_incentive',
    weight: 78,
    impact: 'bullish',
    timeHorizon: '3_months',
    keywords: ['devlet teşviki', 'government incentive', 'teşvik', 'sübvansiyon', 'devlet destek'],
  },
  {
    category: 'credit_rating',
    weight: 62,
    impact: 'bullish',
    timeHorizon: '1_month',
    keywords: ['kredi notu', 'credit rating', 'kredi derecelendirme', 'rating'],
  },
  {
    category: 'sector_rotation',
    weight: 40,
    impact: 'neutral',
    timeHorizon: '1_month',
    keywords: ['sektör rotasyonu', 'sector rotation'],
  },
  {
    category: 'ceo_change',
    weight: 55,
    impact: 'neutral',
    timeHorizon: '1_month',
    keywords: ['genel müdür', 'ceo değişikliği', 'ceo change', 'yeni ceo', 'ceo atama'],
  },
  {
    category: 'board_change',
    weight: 45,
    impact: 'neutral',
    timeHorizon: '1_month',
    keywords: ['yönetim kurulu', 'board change', 'yönetim değişikliği', 'yönetim kurulu değişikliği'],
  },
  {
    category: 'minor_news',
    weight: 20,
    impact: 'neutral',
    timeHorizon: '1_week',
    keywords: [],
  },
];

export function getCategoryConfig(category: CatalystCategory): CatalystCategoryConfig {
  const config = CATALYST_CATEGORIES.find((entry) => entry.category === category);
  return config ?? CATALYST_CATEGORIES[CATALYST_CATEGORIES.length - 1];
}

export function categorizeTitle(title: string): { category: CatalystCategory; keywords: string[] } {
  const normalized = normalizeText(title);
  for (const config of CATALYST_CATEGORIES) {
    if (config.keywords.length === 0) continue;
    const hit = config.keywords.find((keyword) => normalized.includes(normalizeText(keyword)));
    if (hit) {
      return { category: config.category, keywords: [hit] };
    }
  }
  return { category: 'minor_news', keywords: [] };
}

export function normalizeText(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9çğıöşü \u0307]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
