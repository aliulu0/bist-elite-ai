from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from modules.backtest_engine.cache.cache import BacktestCache
from modules.backtest_engine.core.types import (
    BacktestRequest,
    BacktestResult,
    BacktestType,
    BenchmarkType,
    InvestmentHorizon,
    PerformanceMetrics,
    ReportType,
)
from modules.backtest_engine.executors.engine import BacktestEngine
from modules.backtest_engine.reports.generator import ReportGenerator
from modules.backtest_engine.benchmark.benchmark import EngineBenchmark
from modules.backtest_engine.validators.validator import BacktestValidator
from modules.backtest_engine.schemas.schemas import (
    BacktestCompareResponse,
    BacktestListItem,
    BacktestListResponse,
    BacktestResultResponse,
    BenchmarkResponse,
    CacheStatsResponse,
    HealthResponse,
    HistoryResponse,
    PerformanceMetricsSchema,
    PortfolioAnalysisSchema,
    ReportResponse,
    SummaryResponse,
    TradeAnalysisSchema,
    TradeSchema,
    EquityPointSchema,
)


class BacktestService:
    """Orchestrates all backtest engine operations."""

    def __init__(self) -> None:
        self.engine = BacktestEngine()
        self.cache = BacktestCache()
        self.report_gen = ReportGenerator()
        self.validator = BacktestValidator()
        self.benchmark = EngineBenchmark()
        self._results: List[BacktestResult] = []

    def run_backtest(self, request: BacktestRequest) -> BacktestResult:
        cache_key = f"{request.symbol}:{request.strategy}:{request.start_date}:{request.end_date}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            if not any(r.request.symbol == request.symbol and r.request.strategy == request.strategy for r in self._results):
                self._results.append(cached)
            return cached

        result = self.engine.run(request)
        self.cache.set(cache_key, result)
        self._results.append(result)
        return result

    def run_multiple(self, requests: List[BacktestRequest]) -> List[BacktestResult]:
        return [self.run_backtest(req) for req in requests]

    def compare(self, requests: List[BacktestRequest]) -> Dict[str, Any]:
        results = self.run_multiple(requests)
        return self.engine.compare(results)

    def get_result(self, symbol: str, strategy: str = "") -> Optional[BacktestResult]:
        for r in reversed(self._results):
            if r.request.symbol == symbol:
                if not strategy or r.request.strategy == strategy:
                    return r
        return None

    def list_results(self) -> List[BacktestResult]:
        return list(self._results)

    def get_history(self, symbol: str) -> List[BacktestResult]:
        return [r for r in self._results if r.request.symbol == symbol]

    def generate_report(
        self,
        symbol: str,
        report_type: str = "executive",
    ) -> Dict[str, Any]:
        result = self.get_result(symbol)
        if not result:
            return {"error": f"No backtest found for {symbol}"}
        rt = ReportType(report_type) if report_type in [e.value for e in ReportType] else ReportType.EXECUTIVE
        report = self.report_gen.generate(result, rt)
        return {
            "symbol": symbol,
            "report_type": report_type,
            "content": report.get("content", ""),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "sections": {k: v for k, v in report.items() if k != "content"},
        }

    def summary(self) -> Dict[str, Any]:
        if not self._results:
            return {"total_backtests": 0, "avg_return": 0.0, "avg_sharpe": 0.0, "avg_drawdown": 0.0, "best_symbol": "", "worst_symbol": "", "strategies_used": []}
        returns = [r.metrics.total_return for r in self._results]
        sharpes = [r.metrics.sharpe_ratio for r in self._results]
        drawdowns = [r.metrics.max_drawdown for r in self._results]
        best = max(self._results, key=lambda r: r.metrics.sharpe_ratio)
        worst = min(self._results, key=lambda r: r.metrics.sharpe_ratio)
        strategies = list(set(r.request.strategy for r in self._results))
        return {
            "total_backtests": len(self._results),
            "avg_return": round(sum(returns) / len(returns), 4),
            "avg_sharpe": round(sum(sharpes) / len(sharpes), 4),
            "avg_drawdown": round(sum(drawdowns) / len(drawdowns), 4),
            "best_symbol": best.request.symbol,
            "worst_symbol": worst.request.symbol,
            "strategies_used": strategies,
        }

    def clear_cache(self) -> int:
        return self.cache.clear()

    def cache_stats(self) -> Dict[str, Any]:
        return self.cache.stats()

    def run_engine_benchmark(self, iterations: int = 10) -> BenchmarkResponse:
        result = self.benchmark.run(
            "backtest_execution",
            lambda: self.engine.run(BacktestRequest(
                symbol="TUPRS", strategy="benchmark", start_date="2023-01-01", end_date="2025-12-31",
            )),
            iterations=iterations,
            warmup=2,
        )
        return BenchmarkResponse(
            operation=result.operation,
            iterations=result.iterations,
            avg_time_ms=result.avg_time_ms,
            min_time_ms=result.min_time_ms,
            max_time_ms=result.max_time_ms,
            success=result.success,
        )

    def health_check(self) -> HealthResponse:
        return HealthResponse(
            status="healthy",
            version="1.0.0",
            datasets_available=len(self.engine.dataset_manager.symbols()),
            cache_stats=CacheStatsResponse(**self.cache.stats()),
        )

    def result_to_response(self, result: BacktestResult) -> BacktestResultResponse:
        return BacktestResultResponse(
            symbol=result.request.symbol,
            strategy=result.request.strategy,
            market_period=result.market_period.value,
            metrics=PerformanceMetricsSchema(**result.metrics.__dict__),
            trade_analysis=TradeAnalysisSchema(**result.trade_analysis.__dict__),
            portfolio_analysis=PortfolioAnalysisSchema(**result.portfolio_analysis.__dict__),
            trades=[
                TradeSchema(
                    symbol=t.symbol,
                    entry_date=t.entry_date,
                    entry_price=t.entry_price,
                    exit_date=t.exit_date,
                    exit_price=t.exit_price,
                    quantity=t.quantity,
                    direction=t.direction.value,
                    exit_reason=t.exit_reason.value,
                    pnl=t.pnl,
                    pnl_pct=t.pnl_pct,
                    holding_days=t.holding_days,
                    mfe=t.mfe,
                    mae=t.mae,
                    entry_score=t.entry_score,
                    entry_confidence=t.entry_confidence,
                )
                for t in result.trades
            ],
            equity_curve=[
                EquityPointSchema(
                    timestamp=pt.timestamp,
                    equity=pt.equity,
                    drawdown=pt.drawdown,
                    benchmark_equity=pt.benchmark_equity,
                )
                for pt in result.equity_curve
            ],
            benchmark_metrics=PerformanceMetricsSchema(**result.benchmark_metrics.__dict__) if result.benchmark_metrics else None,
            execution_time_ms=result.execution_time_ms,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    def _parse_backtest_type(self, value: str) -> BacktestType:
        try:
            return BacktestType(value)
        except ValueError:
            return BacktestType.SINGLE_STRATEGY

    def _parse_benchmark(self, value: str) -> BenchmarkType:
        try:
            return BenchmarkType(value)
        except ValueError:
            return BenchmarkType.BIST100

    def _parse_horizon(self, value: str) -> InvestmentHorizon:
        try:
            return InvestmentHorizon(value)
        except ValueError:
            return InvestmentHorizon.MONTH_3
