from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.strategy_optimizer.schemas.schemas import (
    BenchmarkResultSchema,
    CacheStatsSchema,
    InvestmentHorizonSchema,
    OptimizationListResponse,
    OptimizationObjectiveSchema,
    OptimizationReportResponse,
    OptimizationRequestSchema,
    OptimizationResultSchema,
    OptimizationRunSchema,
    OptimizationTypeSchema,
    ParameterCandidateSchema,
    ParameterRangeSchema,
    RejectionReasonSchema,
    ReportTypeSchema,
    ValidationStageSchema,
)


class TestSchemaEnums:
    def test_optimization_type_schema(self):
        for ot in OptimizationTypeSchema:
            assert ot.value in [
                "rule_threshold", "weight", "bonus",
                "penalty", "filter", "ranking",
            ]

    def test_investment_horizon_schema(self):
        for ih in InvestmentHorizonSchema:
            assert ih.value in ["weekly", "1_month", "3_months", "6_months", "12_months"]

    def test_optimization_objective_schema(self):
        for obj in OptimizationObjectiveSchema:
            assert obj.value in [
                "maximize_return", "maximize_sharpe", "minimize_drawdown",
                "maximize_win_rate", "increase_consistency",
                "reduce_false_positives", "reduce_false_negatives",
                "improve_robustness",
            ]

    def test_validation_stage_schema(self):
        for vs in ValidationStageSchema:
            assert vs.value in ["backtest", "walk_forward", "monte_carlo", "all"]

    def test_rejection_reason_schema(self):
        for rr in RejectionReasonSchema:
            assert rr.value in [
                "overfitting", "reduced_robustness", "excessive_drawdown",
                "inconsistent_regimes", "degraded_performance",
                "high_parameter_sensitivity", "low_generalization",
            ]

    def test_report_type_schema(self):
        for rt in ReportTypeSchema:
            assert rt.value in [
                "optimization_summary", "parameter_comparison",
                "performance_improvement", "rejected_candidates",
                "accepted_candidates", "full",
            ]


class TestParameterRangeSchema:
    def test_construction(self):
        pr = ParameterRangeSchema(
            name="test",
            min_value=0.0,
            max_value=1.0,
            step=0.1,
            current_value=0.5,
        )
        assert pr.name == "test"
        assert pr.min_value == 0.0

    def test_discrete(self):
        pr = ParameterRangeSchema(
            name="discrete",
            is_discrete=True,
            values=[1, 2, 3],
        )
        assert pr.is_discrete is True
        assert len(pr.values) == 3


class TestParameterCandidateSchema:
    def test_construction(self):
        pc = ParameterCandidateSchema(
            parameters={"a": 1},
            fitness_score=0.8,
            is_accepted=True,
        )
        assert pc.parameters["a"] == 1
        assert pc.fitness_score == 0.8
        assert pc.is_accepted is True


class TestOptimizationRunSchema:
    def test_construction(self):
        run = OptimizationRunSchema(
            run_id="test",
            symbol="THYAO",
            candidates_evaluated=10,
        )
        assert run.run_id == "test"
        assert run.candidates_evaluated == 10


class TestOptimizationRequestSchema:
    def test_construction(self):
        req = OptimizationRequestSchema(
            symbol="THYAO",
            optimization_type="rule_threshold",
            horizon="3_months",
            max_iterations=50,
        )
        assert req.symbol == "THYAO"
        assert req.max_iterations == 50

    def test_defaults(self):
        req = OptimizationRequestSchema()
        assert req.symbol == ""
        assert req.max_iterations == 100
        assert req.max_candidates == 50
        assert req.early_stopping is True


class TestOptimizationResultSchema:
    def test_construction(self):
        res = OptimizationResultSchema(
            optimized_parameters={"a": 1},
            robustness_score=0.7,
            execution_time_ms=100.0,
        )
        assert res.optimized_parameters["a"] == 1
        assert res.robustness_score == 0.7


class TestCacheStatsSchema:
    def test_construction(self):
        cs = CacheStatsSchema(
            size=10,
            hits=8,
            misses=2,
            hit_rate=0.8,
        )
        assert cs.size == 10
        assert cs.hit_rate == 0.8


class TestBenchmarkResultSchema:
    def test_construction(self):
        br = BenchmarkResultSchema(
            operation="test",
            iterations=10,
            avg_time_ms=1.5,
            success=True,
        )
        assert br.operation == "test"
        assert br.success is True


class TestOptimizationListResponse:
    def test_construction(self):
        resp = OptimizationListResponse(total=5)
        assert resp.total == 5
        assert resp.runs == []


class TestOptimizationReportResponse:
    def test_construction(self):
        resp = OptimizationReportResponse(
            report_type="summary",
            run_id="r1",
            summary={"key": "value"},
        )
        assert resp.report_type == "summary"
        assert resp.run_id == "r1"
