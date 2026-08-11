# 017 — BACKTEST AUDIT

## Verdict: SUBSTANTIAL BUT NEEDS IMPROVEMENT (60/100)

## Implementation

| Item | Detail |
|---|---|
| Module | `apps/api/src/modules/backtest/` + `backtest-validation/` + `benchmark/` |
| Engine | `backtest.engine.ts` (CoreBacktestEngine — pure TS) |
| Service | backtest.service.ts |
| Controller | `backtest.controller.ts` — `GET/POST /backtest/run`, `GET /report/:symbol`, `GET /learning/:symbol`, `GET /strategies`, `GET /portfolio/:symbol`, `GET /tomorrow/:symbol`, `GET /elite-score/:symbol` |
| Tests | 9 suites (backtest) + validation + benchmark |
| Metrics | Sharpe, max drawdown, equity curve, win rate, trade ledger |
| Integration | Reused by Early Opportunity self-learning (winRate), Recommendation Tracker, Dashboard |

## Findings

1. **`backtest.engine.ts:~297` — `// TODO: rsi is defined but not used`** — RSI series computed but never consumed.
2. **Possible RSI duplication** — a separate `rsiSeries` implementation may duplicate the centralized IndicatorEngine RSI (violates D004 single-source-of-truth).
3. No vectorization / parameter-grid sweeps — vectorbt-style matrix backtesting deferred to R3-001/002 (Python worker).
4. Backtest is deterministic (no randomness).
5. Full backtest dashboard in `apps/web` (~80%): equity/drawdown charts, benchmark, rule analytics, weight optimizer, trades, export.

## STATUS: NEEDS IMPROVEMENT — fix RSI duplication + unused RSI, consider Python vectorized layer
