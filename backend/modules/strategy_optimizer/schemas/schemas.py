from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class OptimizationTypeSchema(str, Enum):
    RULE_THRESHOLD = "rule_threshold"
    WEIGHT = "weight"
    BONUS = "bonus"
    PENALTY = "penalty"
    FILTER = "filter"
    RANKING = "ranking"


class InvestmentHorizonSchema(str, Enum):
    WEEKLY = "weekly"
    MONTH_1 = "1_month"
    MONTH_3 = "3_months"
    MONTH_6 = "6_months"
    MONTH_12 = "12_months"


class OptimizationObjectiveSchema(str, Enum):
    MAXIMIZE_RETURN = "maximize_return"
    MAXIMIZE_SHARPE = "maximize_sharpe"
    MINIMIZE_DRAWDOWN = "minimize_drawdown"
    MAXIMIZE_WIN_RATE = "maximize_win_rate"
    INCREASE_CONSISTENCY = "increase_consistency"
    REDUCE_FALSE_POSITIVES = "reduce_false_positives"
    REDUCE_FALSE_NEGATIVES = "reduce_false_negatives"
    IMPROVE_ROBUSTNESS = "improve_robustness"


class ValidationStageSchema(str, Enum):
    BACKTEST = "backtest"
    WALK_FORWARD = "walk_forward"
    MONTE_CARLO = "monte_carlo"
    ALL = "all"


class RejectionReasonSchema(str, Enum):
    OVERFITTING = "overfitting"
    REDUCED_ROBUSTNESS = "reduced_robustness"
    EXCESSIVE_DRAWDOWN = "excessive_drawdown"
    INCONSISTENT_REGIMES = "inconsistent_regimes"
    DEGRADED_PERFORMANCE = "degraded_performance"
    HIGH_PARAMETER_SENSITIVITY = "high_parameter_sensitivity"
    LOW_GENERALIZATION = "low_generalization"


class ReportTypeSchema(str, Enum):
    OPTIMIZATION_SUMMARY = "optimization_summary"
    PARAMETER_COMPARISON = "parameter_comparison"
    PERFORMANCE_IMPROVEMENT = "performance_improvement"
    REJECTED_CANDIDATES = "rejected_candidates"
    ACCEPTED_CANDIDATES = "accepted_candidates"
    FULL = "full"


class ParameterRangeSchema(BaseModel):
    name: str = ""
    category: str = "elite_score"
    min_value: float = 0.0
    max_value: float = 1.0
    step: float = 0.01
    current_value: float = 0.5
    values: List[Any] = Field(default_factory=list)
    is_discrete: bool = False


class ParameterCandidateSchema(BaseModel):
    parameters: Dict[str, Any] = Field(default_factory=dict)
    fitness_score: float = 0.0
    objective_scores: Dict[str, float] = Field(default_factory=dict)
    backtest_score: float = 0.0
    walk_forward_score: float = 0.0
    monte_carlo_score: float = 0.0
    overall_score: float = 0.0
    is_accepted: bool = False
    rejection_reasons: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class OptimizationRunSchema(BaseModel):
    run_id: str = ""
    symbol: str = ""
    strategy: str = ""
    optimization_type: str = "rule_threshold"
    horizon: str = "3_months"
    objective: str = "maximize_sharpe"
    candidates_evaluated: int = 0
    candidates_accepted: int = 0
    candidates_rejected: int = 0
    best_candidate: Optional[ParameterCandidateSchema] = None
    all_candidates: List[ParameterCandidateSchema] = Field(default_factory=list)
    rejected_candidates: List[ParameterCandidateSchema] = Field(default_factory=list)
    accepted_candidates: List[ParameterCandidateSchema] = Field(default_factory=list)
    baseline_fitness: float = 0.0
    best_fitness: float = 0.0
    improvement_pct: float = 0.0
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class OptimizationRequestSchema(BaseModel):
    symbol: str = ""
    strategy: str = "default"
    optimization_type: str = "rule_threshold"
    horizon: str = "3_months"
    objective: str = "maximize_sharpe"
    parameter_space: Dict[str, ParameterRangeSchema] = Field(default_factory=dict)
    max_iterations: int = 100
    max_candidates: int = 50
    validation_stages: List[str] = Field(default_factory=lambda: ["all"])
    rejection_thresholds: Dict[str, float] = Field(default_factory=dict)
    early_stopping: bool = True
    early_stopping_patience: int = 10
    seed: Optional[int] = None
    initial_capital: float = 100000.0
    commission_pct: float = 0.001
    start_date: str = "2020-01-01"
    end_date: str = "2025-12-31"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class OptimizationResultSchema(BaseModel):
    request: OptimizationRequestSchema = Field(default_factory=OptimizationRequestSchema)
    run: OptimizationRunSchema = Field(default_factory=OptimizationRunSchema)
    optimized_parameters: Dict[str, Any] = Field(default_factory=dict)
    performance_improvement: Dict[str, float] = Field(default_factory=dict)
    risk_improvement: Dict[str, float] = Field(default_factory=dict)
    robustness_score: float = 0.0
    generalization_score: float = 0.0
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CacheStatsSchema(BaseModel):
    size: int = 0
    hits: int = 0
    misses: int = 0
    hit_rate: float = 0.0
    max_size: int = 0
    ttl_seconds: float = 0.0


class BenchmarkResultSchema(BaseModel):
    operation: str = ""
    iterations: int = 0
    avg_time_ms: float = 0.0
    min_time_ms: float = 0.0
    max_time_ms: float = 0.0
    std_dev_ms: float = 0.0
    total_time_ms: float = 0.0
    memory_mb: float = 0.0
    success: bool = True
    error_message: str = ""


class OptimizationListResponse(BaseModel):
    runs: List[OptimizationRunSchema] = Field(default_factory=list)
    total: int = 0


class OptimizationReportResponse(BaseModel):
    report_type: str = "optimization_summary"
    run_id: str = ""
    summary: Dict[str, Any] = Field(default_factory=dict)
    details: Dict[str, Any] = Field(default_factory=dict)
