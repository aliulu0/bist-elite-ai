# 10. PIPELINES

## 10.1 AI analysis pipeline

**Files:** `modules/analysis-pipeline/`, `modules/pipeline-orchestrator/`

- `AnalysisPipelineService` executes the documented chain:
  `Research → Verification → Catalyst → Consensus → Elite Score → Portfolio Optimization → Backtest → Telegram`.
- `PipelineOrchestratorService` coordinates multi-step runs with status tracking and step-level error isolation.
- Steps are idempotent per ticker; batch entry points exist at each engine module (`POST /batch`).

## 10.2 Scheduler pipeline

**Files:** `modules/scheduler/`

- `SchedulerEngine` registers cron jobs from `JOB_CLASSES`; the scheduler boots via `main-scheduler.ts` (separate process, no HTTP).
- **Finding:** `CatalystRefreshJob` exists on disk but is **missing from `JOB_CLASSES`** → catalyst refresh never scheduled.
- Scheduler shares the full `AppModule`, so it constructs the entire HTTP module tree (wasteful, not incorrect).

## 10.3 Data pipelines

- `HistoricalDataPipeline.process` (`modules/historical-data`) — fetches and normalizes history.
- `market-data` orchestrator + `AggregationModule` — quote aggregation with quality-scorer + conflict-resolution.
- `NewsAggregationService` — merges ChatGPT/Gemini/Perplexity/Google/Finnhub/SerpAPI news.

## 10.4 Workflow pipelines

- `modules/workflow/`, `modules/workflow-queue/`, `modules/workflow-integration/` — queue-based workflow engine with retry semantics.

## 10.5 Observations

1. **Chain is well modularized** — each step is its own engine/module with tests; the pipeline composes rather than reimplements.
2. **Backtest step is not implemented** — `BacktestEngine` exists at page-level only; the pipeline's backtest step cannot be run for real (H7, R2-020).
3. **Catalyst refresh is dead code** — job not in `JOB_CLASSES` (orphan).
4. **No end-to-end pipeline test** — each step is unit-tested, but there is no integration spec that runs the full chain against mocked providers.
5. **Error handling:** step-level isolation in the orchestrator is good; but no global exception filter (`common/filters/` empty) means uncaught step errors surface via default Nest error handling (C2/C6 interplay).

## 10.6 Verdict

Pipeline architecture is coherent and the dependency chain is real. The main gaps are the missing real backtest step, the dead catalyst job, and the absence of an integration test for the whole chain.
