from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.strategy_optimizer.cache.cache import OptimizationCache
from modules.strategy_optimizer.core.types import (
    InvestmentHorizon,
    OptimizationRequest,
    OptimizationResult,
    OptimizationRun,
    OptimizationType,
    ReportType,
)
from modules.strategy_optimizer.optimizer.engine import StrategyOptimizer
from modules.strategy_optimizer.profiles.manager import ProfileManager
from modules.strategy_optimizer.schemas.schemas import (
    OptimizationListResponse,
    OptimizationReportResponse,
    OptimizationRequestSchema,
    OptimizationResultSchema,
    OptimizationRunSchema,
)


class StrategyOptimizerService:
    """Orchestration layer for strategy optimization."""

    def __init__(
        self,
        optimizer: Optional[StrategyOptimizer] = None,
        cache: Optional[OptimizationCache] = None,
        profile_manager: Optional[ProfileManager] = None,
    ) -> None:
        self._optimizer = optimizer or StrategyOptimizer()
        self._cache = cache or OptimizationCache()
        self._profile_manager = profile_manager or ProfileManager()

    def run_optimization(
        self, request: OptimizationRequest
    ) -> OptimizationResult:
        cache_key = self._make_cache_key(request)
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        result = self._optimizer.optimize(request)
        self._cache.put(cache_key, result)
        return result

    def get_history(self) -> List[OptimizationRun]:
        return self._optimizer.get_history()

    def get_history_by_symbol(self, symbol: str) -> List[OptimizationRun]:
        return self._optimizer.get_history_by_symbol(symbol)

    def get_run(self, run_id: str) -> Optional[OptimizationRun]:
        return self._optimizer.get_run(run_id)

    def get_report(
        self,
        run_id: str,
        report_type: ReportType = ReportType.OPTIMIZATION_SUMMARY,
    ) -> OptimizationReportResponse:
        run = self._optimizer.get_run(run_id)
        if run is None:
            return OptimizationReportResponse(
                report_type=report_type.value,
                run_id=run_id,
                summary={"error": "Run not found"},
            )

        if report_type == ReportType.OPTIMIZATION_SUMMARY:
            return self._summary_report(run)
        elif report_type == ReportType.PARAMETER_COMPARISON:
            return self._parameter_comparison_report(run)
        elif report_type == ReportType.PERFORMANCE_IMPROVEMENT:
            return self._performance_report(run)
        elif report_type == ReportType.REJECTED_CANDIDATES:
            return self._rejected_report(run)
        elif report_type == ReportType.ACCEPTED_CANDIDATES:
            return self._accepted_report(run)
        else:
            return self._full_report(run)

    def get_cache_stats(self) -> Dict[str, Any]:
        return {
            "size": self._cache.size,
            "hits": self._cache.hits,
            "misses": self._cache.misses,
            "hit_rate": self._cache.hit_rate,
            "max_size": 256,
            "ttl_seconds": 3600.0,
        }

    def clear_cache(self) -> None:
        self._cache.clear()

    def _make_cache_key(self, request: OptimizationRequest) -> str:
        params = {
            "symbol": request.symbol,
            "strategy": request.strategy,
            "optimization_type": request.optimization_type.value,
            "horizon": request.horizon.value,
            "objective": request.objective.value,
            "max_iterations": request.max_iterations,
            "max_candidates": request.max_candidates,
        }
        return self._cache.make_key(params)

    def _summary_report(self, run: OptimizationRun) -> OptimizationReportResponse:
        return OptimizationReportResponse(
            report_type="optimization_summary",
            run_id=run.run_id,
            summary={
                "symbol": run.symbol,
                "strategy": run.strategy,
                "optimization_type": run.optimization_type.value,
                "horizon": run.horizon.value,
                "objective": run.objective.value,
                "candidates_evaluated": run.candidates_evaluated,
                "candidates_accepted": run.candidates_accepted,
                "candidates_rejected": run.candidates_rejected,
                "baseline_fitness": run.baseline_fitness,
                "best_fitness": run.best_fitness,
                "improvement_pct": run.improvement_pct,
                "execution_time_ms": run.execution_time_ms,
            },
        )

    def _parameter_comparison_report(
        self, run: OptimizationRun
    ) -> OptimizationReportResponse:
        baseline = run.metadata.get("baseline_parameters", {})
        best = run.best_candidate.parameters if run.best_candidate else {}
        return OptimizationReportResponse(
            report_type="parameter_comparison",
            run_id=run.run_id,
            summary={"baseline": baseline, "optimized": best},
        )

    def _performance_report(
        self, run: OptimizationRun
    ) -> OptimizationReportResponse:
        return OptimizationReportResponse(
            report_type="performance_improvement",
            run_id=run.run_id,
            summary={
                "baseline_fitness": run.baseline_fitness,
                "best_fitness": run.best_fitness,
                "improvement_pct": run.improvement_pct,
                "total_evaluated": run.candidates_evaluated,
                "acceptance_rate": (
                    run.candidates_accepted / max(run.candidates_evaluated, 1)
                ),
            },
        )

    def _rejected_report(self, run: OptimizationRun) -> OptimizationReportResponse:
        rejected_summary = []
        for c in run.rejected_candidates:
            rejected_summary.append({
                "parameters": c.parameters,
                "fitness_score": c.fitness_score,
                "rejection_reasons": [r.value for r in c.rejection_reasons],
            })
        return OptimizationReportResponse(
            report_type="rejected_candidates",
            run_id=run.run_id,
            summary={"total_rejected": len(run.rejected_candidates)},
            details={"candidates": rejected_summary},
        )

    def _accepted_report(self, run: OptimizationRun) -> OptimizationReportResponse:
        accepted_summary = []
        for c in run.accepted_candidates:
            accepted_summary.append({
                "parameters": c.parameters,
                "fitness_score": c.fitness_score,
                "overall_score": c.overall_score,
            })
        return OptimizationReportResponse(
            report_type="accepted_candidates",
            run_id=run.run_id,
            summary={"total_accepted": len(run.accepted_candidates)},
            details={"candidates": accepted_summary},
        )

    def _full_report(self, run: OptimizationRun) -> OptimizationReportResponse:
        summary = self._summary_report(run)
        rejected = self._rejected_report(run)
        accepted = self._accepted_report(run)
        return OptimizationReportResponse(
            report_type="full",
            run_id=run.run_id,
            summary=summary.summary,
            details={
                "rejected": rejected.details,
                "accepted": accepted.details,
                "rejected_total": rejected.summary.get("total_rejected", 0),
                "accepted_total": accepted.summary.get("total_accepted", 0),
            },
        )
