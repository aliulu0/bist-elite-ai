from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.strategy_optimizer.core.types import (
    InvestmentHorizon,
    OptimizationRequest,
    OptimizationType,
    ReportType,
)
from modules.strategy_optimizer.services.service import StrategyOptimizerService


class TestServiceConstruction:
    def test_default_init(self):
        svc = StrategyOptimizerService()
        assert svc is not None

    def test_custom_components(self):
        svc = StrategyOptimizerService()
        assert svc._optimizer is not None
        assert svc._cache is not None


class TestRunOptimization:
    def test_basic_run(self):
        svc = StrategyOptimizerService()
        request = OptimizationRequest(
            symbol="THYAO",
            optimization_type=OptimizationType.RULE_THRESHOLD,
            horizon=InvestmentHorizon.MONTH_3,
            max_iterations=5,
            max_candidates=3,
        )
        result = svc.run_optimization(request)
        assert result.run.symbol == "THYAO"

    def test_cache_hit(self):
        svc = StrategyOptimizerService()
        request = OptimizationRequest(
            symbol="THYAO",
            optimization_type=OptimizationType.RULE_THRESHOLD,
            horizon=InvestmentHorizon.MONTH_3,
            max_iterations=5,
            max_candidates=3,
        )
        r1 = svc.run_optimization(request)
        r2 = svc.run_optimization(request)
        assert r1.run.run_id == r2.run.run_id

    def test_cache_stats(self):
        svc = StrategyOptimizerService()
        request = OptimizationRequest(
            symbol="THYAO",
            max_iterations=3,
            max_candidates=2,
        )
        svc.run_optimization(request)
        stats = svc.get_cache_stats()
        assert stats["size"] >= 0
        assert "hit_rate" in stats

    def test_clear_cache(self):
        svc = StrategyOptimizerService()
        svc.clear_cache()
        stats = svc.get_cache_stats()
        assert stats["size"] == 0


class TestHistory:
    def test_get_history(self):
        svc = StrategyOptimizerService()
        svc.run_optimization(OptimizationRequest(symbol="THYAO", max_iterations=3, max_candidates=2))
        history = svc.get_history()
        assert len(history) >= 1

    def test_get_history_by_symbol(self):
        svc = StrategyOptimizerService()
        svc.run_optimization(OptimizationRequest(symbol="THYAO", max_iterations=3, max_candidates=2))
        svc.run_optimization(OptimizationRequest(symbol="GARAN", max_iterations=3, max_candidates=2))
        thy = svc.get_history_by_symbol("THYAO")
        assert len(thy) == 1

    def test_get_run(self):
        svc = StrategyOptimizerService()
        result = svc.run_optimization(OptimizationRequest(symbol="THYAO", max_iterations=3, max_candidates=2))
        run = svc.get_run(result.run.run_id)
        assert run is not None


class TestReports:
    def test_summary_report(self):
        svc = StrategyOptimizerService()
        result = svc.run_optimization(OptimizationRequest(symbol="THYAO", max_iterations=3, max_candidates=2))
        report = svc.get_report(result.run.run_id, ReportType.OPTIMIZATION_SUMMARY)
        assert report.report_type == "optimization_summary"
        assert report.summary.get("symbol") == "THYAO"

    def test_parameter_comparison_report(self):
        svc = StrategyOptimizerService()
        result = svc.run_optimization(OptimizationRequest(symbol="THYAO", max_iterations=3, max_candidates=2))
        report = svc.get_report(result.run.run_id, ReportType.PARAMETER_COMPARISON)
        assert report.report_type == "parameter_comparison"

    def test_performance_report(self):
        svc = StrategyOptimizerService()
        result = svc.run_optimization(OptimizationRequest(symbol="THYAO", max_iterations=3, max_candidates=2))
        report = svc.get_report(result.run.run_id, ReportType.PERFORMANCE_IMPROVEMENT)
        assert report.report_type == "performance_improvement"

    def test_rejected_report(self):
        svc = StrategyOptimizerService()
        result = svc.run_optimization(OptimizationRequest(symbol="THYAO", max_iterations=5, max_candidates=5))
        report = svc.get_report(result.run.run_id, ReportType.REJECTED_CANDIDATES)
        assert report.report_type == "rejected_candidates"

    def test_accepted_report(self):
        svc = StrategyOptimizerService()
        result = svc.run_optimization(OptimizationRequest(symbol="THYAO", max_iterations=5, max_candidates=5))
        report = svc.get_report(result.run.run_id, ReportType.ACCEPTED_CANDIDATES)
        assert report.report_type == "accepted_candidates"

    def test_full_report(self):
        svc = StrategyOptimizerService()
        result = svc.run_optimization(OptimizationRequest(symbol="THYAO", max_iterations=3, max_candidates=2))
        report = svc.get_report(result.run.run_id, ReportType.FULL)
        assert report.report_type == "full"

    def test_report_not_found(self):
        svc = StrategyOptimizerService()
        report = svc.get_report("nonexistent")
        assert "error" in report.summary
