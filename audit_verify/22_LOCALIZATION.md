# 22. LOCALIZATION

> Standard: `docs/LOCALIZATION_STANDARD.md` — Turkish-first UI (D001).

## 22.1 Infrastructure

- `packages/shared` ships an i18n module (`shared/i18n` or `shared/src/i18n`) with locale dictionaries and a `t()` helper.
- Languages: `tr` (primary) and `en` (secondary) dictionaries exist.
- Frontend imports translations from `@bist-elite/shared`.

## 22.2 Compliance

- Most pages (dashboard, scanner, analysis, backtest, portfolio, opportunity-center, elite-score, tomorrow, macro, research, alerts, configuration, settings, api, strategies, comparison, provider-health, watchlist) render Turkish labels via `t()`.
- **H4 — ~30 English UI strings remain** in `apps/web/src` (across pages/components/hooks), hardcoded in JSX. Violates D001.
- English strings include headings, empty-state text, button labels, and fallback text.
- Server-side: some module messages/`docs` remain English; the standard covers UI primarily.

## 22.3 Findings

1. **H4 — English hardcoded strings in web UI** (~30 instances).
2. **No lint rule** enforcing `t()` usage (no eslint plugin for i18n) — regressions can silently reappear.
3. **Missing translations**: any new `t('key')` must be added to both `tr` and `en` dictionaries manually; no missing-key check in CI.
4. **SDK error messages** from API (`lib/sdk.ts`) are English; acceptable but inconsistent with the standard.
5. **Legacy `frontend/`** app is English by default (superseded, so informational).

## 22.4 Verdict

Localization standard is documented and largely followed; the remaining English strings are a manageable cleanup (H4) and the missing lint/CI guard is the systemic risk.
