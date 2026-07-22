# Localization & Internationalization Guide

## Overview

BIST Elite AI supports Turkish (default) and English localization. The localization system is centralized in `packages/shared/src/locales/`.

## Architecture

```
packages/shared/src/locales/
├── tr.ts              # Turkish translations (primary)
├── en.ts              # English translations (future)
├── provider.ts        # LocalizationProvider class
├── format.ts          # Date/number/currency formatting
├── validation.ts      # Translation validation utilities
├── terminology.ts     # Financial terminology database
└── index.ts           # Public API exports
```

## Supported Languages

| Language | Status | Default |
|----------|--------|---------|
| Turkish (tr) | Active | Yes |
| English (en) | Prepared | No |

## Usage

### In TypeScript/JavaScript

```typescript
import { LocalizationProvider, t } from '@bist-elite/shared/locales';

// Using the global provider
const message = t('dashboard.marketSummary'); // 'Piyasa Özeti'

// Using a custom provider
const provider = new LocalizationProvider('en');
const english = provider.t('dashboard.marketSummary'); // 'Market Summary'
```

### Parameter Interpolation

```typescript
const msg = t('errors.stockNotFound', { symbol: 'GARAN' });
// 'Hisse bulunamadı: GARAN'
```

### Number Formatting

```typescript
import { formatCurrency, formatPercent, formatNumber } from '@bist-elite/shared/locales';

formatCurrency(1234.56, 'tr');    // '₺1.234,56'
formatPercent(5.23, 'tr');        // '+%5,23'
formatNumber(1234567.89, 'tr');   // '1.234.567,89'
```

### Date Formatting

```typescript
import { formatDate, formatRelativeTime } from '@bist-elite/shared/locales';

formatDate(new Date(), 'tr');     // '21.07.2026'
formatRelativeTime(pastDate, 'tr'); // '5 dakika önce'
```

### Financial Terminology

```typescript
import { getTerminology, getIndicatorTerminology } from '@bist-elite/shared/locales';

getTerminology('bullish', 'tr');  // 'Yükseliş Eğilimi'
getTerminology('rsi', 'tr');      // 'RSI' (preserved)
```

## Translation Keys Structure

```
app.*              - Application metadata
nav.*              - Navigation labels
dashboard.*        - Dashboard page
scanner.*          - Scanner page
portfolio.*        - Portfolio page
backtest.*         - Backtest page
reports.*          - Reports page
settings.*         - Settings page
watchlist.*         - Watchlist page
signal.*           - Signal page
elite.*            - Elite opportunities page
status.*           - System status
about.*            - About page
common.*           - Common UI strings
notifications.*    - Notification labels
market.*           - Market regime translations
analysis.*         - Technical analysis terms
indicators.*       - Indicator names & descriptions
risk.*             - Risk level translations
errors.*           - Error messages
success.*          - Success messages
validation.*       - Validation messages
summary.*          - AI summary section titles
time.*             - Relative time translations
```

## Financial Terminology Policy

- **Indicator names** (RSI, MACD, etc.) are preserved in all languages
- **Market terms** are translated into natural Turkish
- **Technical analysis terms** use Turkish equivalents
- All terminology is defined in `terminology.ts`

## Adding a New Language

1. Create `packages/shared/src/locales/{locale}.ts`
2. Add the locale to `SUPPORTED_LOCALES` in `provider.ts`
3. Add the locale to the `locales` map in `provider.ts`
4. Run validation: `validateAllTranslations()`
5. Add formatting config in `format.ts`

## Adding New Translation Keys

1. Add the key to `tr.ts` (primary locale)
2. Add the same key to `en.ts`
3. The key path becomes the translation key (e.g., `dashboard.newFeature`)
4. Run validation to ensure completeness
