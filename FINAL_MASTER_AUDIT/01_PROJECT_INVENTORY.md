# 01 — PROJECT INVENTORY

> Topography of the `bist-elite-ai` monorepo as of `a13c745c` (working tree).

## Workspace layout

| Path | Description | Status |
|---|---|---|
| `apps/api` | NestJS API (TypeScript), 1338 `.ts` files | PRESENT |
| `apps/web` | Web frontend (React/TS), 28 page modules | PRESENT |
| `apps/telegram` | Telegram bot app (code only, not deployed) | CODE_ONLY |
| `apps/worker` | Python worker (notifications etc.) | CODE_ONLY |
| `packages/shared` | Shared config (`packages/shared/src/config/index.ts` reads `TELEGRAM_BOT_TOKEN`) | PRESENT |
| `.github/` | Issue templates + 10 workflows (build, ci, deploy, docker, integration, label-sync, lint, release, security, test) | PRESENT |
| `.env` | Local secrets (gitignored + untracked, verified) | CONFIGURED locally |
| `docs/` | ~70 markdown docs (R2-0xx sprint docs, handoff, bible, runbooks) | PRESENT |
| `audit/`, `audit_verify/`, old zips | Deleted from working tree (tracked files removed by user) | DELETED |

## API module inventory (65 modules under `apps/api/src/modules`)

ai-analysis · ai-assistant · ai-early-opportunity · ai-elite-score · ai-opportunity · ai-research ·
alerts · analysis-pipeline · analyst · audit-log · auth · backtest · backtest-validation · benchmark ·
candidate · catalyst · configuration · confluence · contract-validator · data-research-pipeline ·
decision · early-opportunity-backtest · elite-score · entry · event-bus · financial-rules ·
historical-data · indicator-cache · indicators · macro · market-data · market-scanner ·
market-structure · multi-market · openapi · opportunity · opportunity-center ·
opportunity-detection · performance-metrics · performance-monitor · persistence ·
pipeline-orchestrator · portfolio · portfolio-intelligence · portfolio-optimization · portfolios ·
prediction · provider-health-monitor · ranking · research · rule-analytics · scanner · scheduler ·
scoring · sdk-generator · smart-money · stocks · system-diagnostics · technical-analysis ·
technical-rules · technical-score · technical-summary · tomorrow · verification-ai ·
websocket-gateway · weight-optimizer · workflow · workflow-integration · workflow-queue

## R2 focus modules (truth check)

| Module | R2 sprint | Files present? | Compiles? | Tests |
|---|---|---|---|---|
| `early-opportunity-backtest` | R2-046 | yes (24 files) | **NO (5 errors)** | 10 suites / 52 pass (mocked) |
| `ai-early-opportunity/decision` | R2-045 | yes (8 files) | YES | 2 suites / 16 pass |
| `ai-early-opportunity` | R2-027/037/038/042 | yes | YES | 11+ suites pass |
| `market-data` (providers/unified) | R2-033/034 | yes (19 adapter files) | YES | adapter specs present |
| `historical-data` | R2-044 | yes | YES | 30 tests claimed |
| `indicator-cache` | R2-043 | yes | YES | specs present |
| `scheduler` | earlier | yes (25 files) | YES | spec present |

## Frontend pages (`apps/web/src/pages`)

dashboard.tsx (Elite Dashboard) · scanner.tsx (AI Screener / BistScan-style) · portfolio.tsx ·
history.tsx ("Tarihsel Veri") · ai-reports.tsx · backtest.tsx · ai-assistant.tsx · alerts.tsx ·
analysis.tsx · audit.tsx · configuration.tsx · diagnostics.tsx · events.tsx · not-found.tsx ·
performance.tsx · pipeline-status.tsx · providers.tsx · research-intelligence.tsx · settings.tsx ·
watchlist.tsx · workflows.tsx + `index.ts` (router) + `__tests__` dir

## Provider adapters (`market-data/providers/unified`)

alpha-vantage · finnhub · fintables-unified · kap · mkk · serpapi · tcmb · yahoo-unified ·
base-provider · technical-indicator-provider + legacy `yahoo-finance.provider.ts`, `fintables.provider.ts`

## Counts

- API `*.spec.ts`: 342 files
- Web test files: 708 (`*.test.tsx` / `*.test.ts`)
- API `*.ts`: 1338 files