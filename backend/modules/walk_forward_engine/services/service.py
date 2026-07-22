from __future__ import annotations

import time as _time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from modules.walk_forward_engine.benchmark.benchmark import WalkForwardBenchmark
from modules.walk_forward_engine.cache.cache import WalkForwardCache
from modules.walk_forward_engine.core.types import (
    GeneralizationScores,
    OptimizationResult,
    RegimePerformance,
    ValidationMetrics,
    WalkForwardRequest,
    WalkForwardResult,
    WindowMode,
    TrainTestSplit,
    WindowPeriod,
    ValidationTarget,
    WindowResult,
    _mean,
)
from modules.walk_forward_engine.optimization.module import ParameterOptimizer
from modules.walk_forward_engine.reports.generator import WalkForwardReportGenerator
from modules.walk_forward_engine.statistics.performance import WalkForwardStatistics
from modules.walk_forward_engine.validators.validator import WalkForwardValidator
from modules.walk_forward_engine.schemas.schemas import (
    BenchmarkResponse,
    CacheStatsResponse,
    GeneralizationScoresSchema,
    HealthResponse,
    OptimizationResultSchema,
    RegimePerformanceSchema,
    ValidationMetricsSchema,
    WalkForwardHistoryItem,
    WalkForwardHistoryResponse,
    WalkForwardListItem,
    WalkForwardListResponse,
    WalkForwardReportResponse,
    WalkForwardResultResponse,
    WindowResultSchema,
    WindowSliceSchema,
)


class WalkForwardService:
    """Orchestrates all walk-forward analysis operations."""

    def __init__(self) -> None:
        self.cache = WalkForwardCache()
        self.optimizer = ParameterOptimizer()
        self.statistics = WalkForwardStatistics()
        self.report_gen = WalkForwardReportGenerator()
        self.validator = WalkForwardValidator()
        self.benchmark = WalkForwardBenchmark()
        self._results: List[WalkForwardResult] = []

    def run_analysis(
        self,
        request: WalkForwardRequest,
        strategy_fn: Optional[Callable[[List[float], Dict[str, Any]], float]] = None,
    ) -> WalkForwardResult:
        cache_key = f"{request.symbol}:{request.strategy}:{request.window_mode.value}:{request.start_date}:{request.end_date}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            if not any(
                r.request.symbol == request.symbol and r.request.strategy == request.strategy
                for r in self._results
            ):
                self._results.append(cached)
            return cached

        start = _time.perf_counter()
        result = self._execute_walk_forward(request, strategy_fn)
        result.execution_time_ms = (_time.perf_counter() - start) * 1000
        self.cache.set(cache_key, result)
        self._results.append(result)
        return result

    def get_result(self, symbol: str, strategy: str = "") -> Optional[WalkForwardResult]:
        for r in reversed(self._results):
            if r.request.symbol == symbol:
                if not strategy or r.request.strategy == strategy:
                    return r
        return None

    def list_results(self) -> List[WalkForwardResult]:
        return list(self._results)

    def get_history(self, symbol: str) -> List[WalkForwardResult]:
        return [r for r in self._results if r.request.symbol == symbol]

    def generate_report(
        self,
        symbol: str,
        report_type: str = "executive",
    ) -> Dict[str, Any]:
        result = self.get_result(symbol)
        if not result:
            return {"error": f"No walk-forward analysis found for {symbol}"}
        from modules.walk_forward_engine.core.types import ReportType
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
            return {
                "total_analyses": 0,
                "avg_generalization": 0.0,
                "avg_overfitting": 0.0,
                "avg_robustness": 0.0,
                "avg_consistency": 0.0,
                "best_symbol": "",
                "worst_symbol": "",
                "strategies_used": [],
            }
        gens = [r.generalization.generalization_score for r in self._results]
        overfs = [r.generalization.overfitting_score for r in self._results]
        robs = [r.generalization.robustness_score for r in self._results]
        cons = [r.generalization.consistency_score for r in self._results]
        best = max(self._results, key=lambda r: r.generalization.robustness_score)
        worst = min(self._results, key=lambda r: r.generalization.robustness_score)
        strategies = list(set(r.request.strategy for r in self._results))
        return {
            "total_analyses": len(self._results),
            "avg_generalization": round(_mean(gens), 4),
            "avg_overfitting": round(_mean(overfs), 4),
            "avg_robustness": round(_mean(robs), 4),
            "avg_consistency": round(_mean(cons), 4),
            "best_symbol": best.request.symbol,
            "worst_symbol": worst.request.symbol,
            "strategies_used": strategies,
        }

    def clear_cache(self) -> int:
        return self.cache.clear()

    def cache_stats(self) -> Dict[str, Any]:
        return self.cache.stats()

    def run_engine_benchmark(self, iterations: int = 10) -> BenchmarkResponse:
        def _run():
            req = WalkForwardRequest(
                symbol="TUPRS",
                strategy="benchmark",
                start_date="2023-01-01",
                end_date="2025-12-31",
            )
            self._execute_walk_forward(req)

        result = self.benchmark.run("walk_forward_execution", _run, iterations=iterations, warmup=2)
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
            cache_stats=CacheStatsResponse(**self.cache.stats()),
        )

    def result_to_response(self, result: WalkForwardResult) -> WalkForwardResultResponse:
        window_results = []
        for wr in result.window_results:
            opt_schema = None
            if wr.optimization:
                opt_schema = OptimizationResultSchema(**wr.optimization.__dict__)
            val_schema = None
            if wr.validation:
                val_schema = ValidationMetricsSchema(**wr.validation.__dict__)
            window_results.append(WindowResultSchema(
                window=WindowSliceSchema(
                    index=wr.window.index,
                    train_start=wr.window.train_start,
                    train_end=wr.window.train_end,
                    test_start=wr.window.test_start,
                    test_end=wr.window.test_end,
                    train_rows=wr.window.train_rows,
                    test_rows=wr.window.test_rows,
                    regime=wr.window.regime.value,
                ),
                optimization=opt_schema,
                validation=val_schema,
                selected_parameters=wr.selected_parameters,
                execution_time_ms=wr.execution_time_ms,
                success=wr.success,
                error_message=wr.error_message,
            ))
        regimes = [
            RegimePerformanceSchema(
                regime=rp.regime.value,
                windows_count=rp.windows_count,
                avg_return=rp.avg_return,
                avg_sharpe=rp.avg_sharpe,
                avg_drawdown=rp.avg_drawdown,
                avg_win_rate=rp.avg_win_rate,
                stability=rp.stability,
            )
            for rp in result.regime_performance
        ]
        return WalkForwardResultResponse(
            symbol=result.request.symbol,
            strategy=result.request.strategy,
            window_mode=result.request.window_mode.value,
            train_test_split=result.request.train_test_split.value,
            total_windows=result.total_windows,
            successful_windows=result.successful_windows,
            failed_windows=result.failed_windows,
            overall_train_return=result.overall_train_return,
            overall_test_return=result.overall_test_return,
            overall_train_sharpe=result.overall_train_sharpe,
            overall_test_sharpe=result.overall_test_sharpe,
            generalization=GeneralizationScoresSchema(
                generalization_score=result.generalization.generalization_score,
                overfitting_score=result.generalization.overfitting_score,
                robustness_score=result.generalization.robustness_score,
                consistency_score=result.generalization.consistency_score,
                parameter_sensitivity=result.generalization.parameter_sensitivity,
                performance_degradation=result.generalization.performance_degradation,
                regime_dependency=result.generalization.regime_dependency,
                historical_drift=result.generalization.historical_drift,
                severity=result.generalization.severity.value,
                recommendation=result.generalization.recommendation,
            ),
            regime_performance=regimes,
            recommended_parameters=result.recommended_parameters,
            window_results=window_results,
            execution_time_ms=result.execution_time_ms,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    def _execute_walk_forward(
        self,
        request: WalkForwardRequest,
        strategy_fn: Optional[Callable[[List[float], Dict[str, Any]], float]] = None,
    ) -> WalkForwardResult:
        dates = self._generate_dates(request.start_date, request.end_date)
        total_rows = len(dates)
        from modules.walk_forward_engine.windows.manager import WindowManager
        wm = WindowManager()
        windows = wm.generate_windows(request, total_rows, dates)
        window_results: List[WindowResult] = []
        train_sharpes: List[float] = []
        test_sharpes: List[float] = []
        train_returns: List[float] = []
        test_returns: List[float] = []

        for ws in windows:
            wr = self._process_window(request, ws, strategy_fn)
            window_results.append(wr)
            if wr.success and wr.optimization:
                train_sharpes.append(wr.optimization.train_sharpe)
                train_returns.append(wr.optimization.train_return)
            if wr.success and wr.validation:
                test_sharpes.append(wr.validation.out_of_sample_sharpe)
                test_returns.append(wr.validation.out_of_sample_return)

        gen_scores = self.statistics.calculate_generalization_scores(window_results)
        regime_perf = self.statistics.calculate_regime_performance(window_results)
        recommended = self._extract_recommended_params(window_results)

        successful = sum(1 for wr in window_results if wr.success)
        return WalkForwardResult(
            request=request,
            window_results=window_results,
            generalization=gen_scores,
            regime_performance=regime_perf,
            recommended_parameters=recommended,
            total_windows=len(window_results),
            successful_windows=successful,
            failed_windows=len(window_results) - successful,
            overall_train_return=round(_mean(train_returns), 4) if train_returns else 0.0,
            overall_test_return=round(_mean(test_returns), 4) if test_returns else 0.0,
            overall_train_sharpe=round(_mean(train_sharpes), 4) if train_sharpes else 0.0,
            overall_test_sharpe=round(_mean(test_sharpes), 4) if test_sharpes else 0.0,
        )

    def _process_window(
        self,
        request: WalkForwardRequest,
        ws: Any,
        strategy_fn: Optional[Callable] = None,
    ) -> WindowResult:
        try:
            train_data = list(range(ws.train_rows))
            test_data = list(range(ws.test_rows))
            opt_result = self.optimizer.optimize(request, train_data, strategy_fn)
            test_metrics = self._simulate_oos(test_data, opt_result.parameters)
            val_metrics = ValidationMetrics(
                out_of_sample_return=test_metrics.get("total_return", 0.0),
                out_of_sample_win_rate=test_metrics.get("win_rate", 0.0),
                out_of_sample_sharpe=test_metrics.get("sharpe_ratio", 0.0),
                out_of_sample_sortino=test_metrics.get("sortino_ratio", 0.0),
                out_of_sample_drawdown=test_metrics.get("max_drawdown", 0.0),
                out_of_sample_trades=test_metrics.get("total_trades", 0),
            )
            return WindowResult(
                window=ws,
                optimization=opt_result,
                validation=val_metrics,
                selected_parameters=opt_result.parameters,
                success=True,
            )
        except Exception as e:
            return WindowResult(
                window=ws,
                success=False,
                error_message=str(e),
            )

    def _simulate_oos(self, test_data: List[float], params: Dict[str, Any]) -> Dict[str, float]:
        if not test_data:
            return {"total_return": 0.0, "sharpe_ratio": 0.0, "win_rate": 0.0, "total_trades": 0, "max_drawdown": 0.0}
        base_return = len(test_data) * 0.05
        param_factor = 1.0 + len(params) * 0.02
        total_return = base_return * param_factor * 0.6
        sharpe = total_return / 10.0 if total_return != 0 else 0.0
        win_rate = min(100, max(0, 50 + total_return * 0.5))
        total_trades = max(1, len(test_data) // 10)
        return {
            "total_return": round(total_return, 4),
            "sharpe_ratio": round(sharpe, 4),
            "win_rate": round(win_rate, 4),
            "total_trades": total_trades,
            "max_drawdown": round(abs(total_return) * 0.3, 4),
        }

    def _extract_recommended_params(self, window_results: List[WindowResult]) -> Dict[str, Any]:
        successful = [wr for wr in window_results if wr.success and wr.selected_parameters]
        if not successful:
            return {}
        param_counts: Dict[str, Dict[Any, int]] = {}
        for wr in successful:
            for k, v in wr.selected_parameters.items():
                if k not in param_counts:
                    param_counts[k] = {}
                val_key = str(v)
                param_counts[k][val_key] = param_counts[k].get(val_key, 0) + 1
        recommended: Dict[str, Any] = {}
        for k, counts in param_counts.items():
            best_val = max(counts, key=counts.get)
            try:
                recommended[k] = float(best_val)
            except (ValueError, TypeError):
                recommended[k] = best_val
        return recommended

    def _generate_dates(self, start_date: str, end_date: str) -> List[str]:
        from datetime import datetime, timedelta
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            start = datetime(2020, 1, 1)
            end = datetime(2025, 12, 31)
        dates = []
        current = start
        while current <= end:
            if current.weekday() < 5:
                dates.append(current.strftime("%Y-%m-%d"))
            current += timedelta(days=1)
        return dates

    def _parse_window_mode(self, value: str) -> WindowMode:
        try:
            return WindowMode(value)
        except ValueError:
            return WindowMode.ROLLING

    def _parse_train_test_split(self, value: str) -> TrainTestSplit:
        try:
            return TrainTestSplit(value)
        except ValueError:
            return TrainTestSplit.EIGHTY_TWENTY

    def _parse_window_period(self, value: str) -> WindowPeriod:
        try:
            return WindowPeriod(value)
        except ValueError:
            return WindowPeriod.MONTHLY

    def _parse_validation_target(self, value: str) -> ValidationTarget:
        try:
            return ValidationTarget(value)
        except ValueError:
            return ValidationTarget.STRATEGY
