from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional


# ── Enums ──────────────────────────────────────────────────────────────────

class OptimizationType(enum.Enum):
    RULE_THRESHOLD = "rule_threshold"
    WEIGHT = "weight"
    BONUS = "bonus"
    PENALTY = "penalty"
    FILTER = "filter"
    RANKING = "ranking"


class InvestmentHorizon(enum.Enum):
    WEEKLY = "weekly"
    MONTH_1 = "1_month"
    MONTH_3 = "3_months"
    MONTH_6 = "6_months"
    MONTH_12 = "12_months"


class OptimizationObjective(enum.Enum):
    MAXIMIZE_RETURN = "maximize_return"
    MAXIMIZE_SHARPE = "maximize_sharpe"
    MINIMIZE_DRAWDOWN = "minimize_drawdown"
    MAXIMIZE_WIN_RATE = "maximize_win_rate"
    INCREASE_CONSISTENCY = "increase_consistency"
    REDUCE_FALSE_POSITIVES = "reduce_false_positives"
    REDUCE_FALSE_NEGATIVES = "reduce_false_negatives"
    IMPROVE_ROBUSTNESS = "improve_robustness"


class ValidationStage(enum.Enum):
    BACKTEST = "backtest"
    WALK_FORWARD = "walk_forward"
    MONTE_CARLO = "monte_carlo"
    ALL = "all"


class RejectionReason(enum.Enum):
    OVERFITTING = "overfitting"
    REDUCED_ROBUSTNESS = "reduced_robustness"
    EXCESSIVE_DRAWDOWN = "excessive_drawdown"
    INCONSISTENT_REGIMES = "inconsistent_regimes"
    DEGRADED_PERFORMANCE = "degraded_performance"
    HIGH_PARAMETER_SENSITIVITY = "high_parameter_sensitivity"
    LOW_GENERALIZATION = "low_generalization"


class ReportType(enum.Enum):
    OPTIMIZATION_SUMMARY = "optimization_summary"
    PARAMETER_COMPARISON = "parameter_comparison"
    PERFORMANCE_IMPROVEMENT = "performance_improvement"
    REJECTED_CANDIDATES = "rejected_candidates"
    ACCEPTED_CANDIDATES = "accepted_candidates"
    FULL = "full"


class ParameterCategory(enum.Enum):
    ELITE_SCORE = "elite_score"
    OPPORTUNITY_SCORE = "opportunity_score"
    CONFIDENCE = "confidence"
    RISK = "risk"
    RSI = "rsi"
    MACD = "macd"
    MOVING_AVERAGE = "moving_average"
    VOLUME = "volume"
    SMART_MONEY = "smart_money"
    PATTERN = "pattern"
    FINANCIAL = "financial"


# ── Core Data Classes ──────────────────────────────────────────────────────

@dataclass
class ParameterRange:
    name: str = ""
    category: ParameterCategory = ParameterCategory.ELITE_SCORE
    min_value: float = 0.0
    max_value: float = 1.0
    step: float = 0.01
    current_value: float = 0.5
    values: List[Any] = field(default_factory=list)
    is_discrete: bool = False


@dataclass
class ParameterCandidate:
    parameters: Dict[str, Any] = field(default_factory=dict)
    fitness_score: float = 0.0
    objective_scores: Dict[str, float] = field(default_factory=dict)
    backtest_score: float = 0.0
    walk_forward_score: float = 0.0
    monte_carlo_score: float = 0.0
    overall_score: float = 0.0
    is_accepted: bool = False
    rejection_reasons: List[RejectionReason] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class OptimizationRun:
    run_id: str = ""
    symbol: str = ""
    strategy: str = ""
    optimization_type: OptimizationType = OptimizationType.RULE_THRESHOLD
    horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3
    objective: OptimizationObjective = OptimizationObjective.MAXIMIZE_SHARPE
    candidates_evaluated: int = 0
    candidates_accepted: int = 0
    candidates_rejected: int = 0
    best_candidate: Optional[ParameterCandidate] = None
    all_candidates: List[ParameterCandidate] = field(default_factory=list)
    rejected_candidates: List[ParameterCandidate] = field(default_factory=list)
    accepted_candidates: List[ParameterCandidate] = field(default_factory=list)
    baseline_fitness: float = 0.0
    best_fitness: float = 0.0
    improvement_pct: float = 0.0
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class OptimizationRequest:
    symbol: str = ""
    strategy: str = "default"
    optimization_type: OptimizationType = OptimizationType.RULE_THRESHOLD
    horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3
    objective: OptimizationObjective = OptimizationObjective.MAXIMIZE_SHARPE
    parameter_space: Dict[str, ParameterRange] = field(default_factory=dict)
    max_iterations: int = 100
    max_candidates: int = 50
    validation_stages: List[ValidationStage] = field(default_factory=lambda: [ValidationStage.ALL])
    rejection_thresholds: Dict[str, float] = field(default_factory=dict)
    early_stopping: bool = True
    early_stopping_patience: int = 10
    seed: Optional[int] = None
    initial_capital: float = 100000.0
    commission_pct: float = 0.001
    start_date: str = "2020-01-01"
    end_date: str = "2025-12-31"
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class OptimizationResult:
    request: OptimizationRequest = field(default_factory=OptimizationRequest)
    run: OptimizationRun = field(default_factory=OptimizationRun)
    optimized_parameters: Dict[str, Any] = field(default_factory=dict)
    performance_improvement: Dict[str, float] = field(default_factory=dict)
    risk_improvement: Dict[str, float] = field(default_factory=dict)
    robustness_score: float = 0.0
    generalization_score: float = 0.0
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BenchmarkResult:
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


# ── Helper Functions ───────────────────────────────────────────────────────

def _mean(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _stdev(values: List[float]) -> float:
    if len(values) < 2:
        return 0.0
    m = _mean(values)
    variance = sum((v - m) ** 2 for v in values) / (len(values) - 1)
    return variance ** 0.5


def _median(values: List[float]) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    n = len(s)
    mid = n // 2
    if n % 2 == 0:
        return (s[mid - 1] + s[mid]) / 2.0
    return s[mid]


def compute_fitness_score(
    objective_scores: Dict[str, float],
    weights: Dict[str, float] = None,
) -> float:
    if not objective_scores:
        return 0.0
    weights = weights or {k: 1.0 for k in objective_scores}
    total_weight = sum(weights.get(k, 1.0) for k in objective_scores)
    if total_weight == 0:
        return 0.0
    weighted_sum = sum(
        v * weights.get(k, 1.0) for k, v in objective_scores.items()
    )
    return weighted_sum / total_weight


def compute_improvement(baseline: float, optimized: float) -> float:
    if baseline == 0:
        return 0.0
    return ((optimized - baseline) / abs(baseline)) * 100


def check_rejection_rules(
    candidate: ParameterCandidate,
    thresholds: Dict[str, float],
) -> List[RejectionReason]:
    reasons: List[RejectionReason] = []
    max_dd = thresholds.get("max_drawdown", 30.0)
    min_sharpe = thresholds.get("min_sharpe", 0.5)
    min_generalization = thresholds.get("min_generalization", 0.5)
    min_win_rate = thresholds.get("min_win_rate", 30.0)

    obj = candidate.objective_scores
    if obj.get("max_drawdown", 0) > max_dd:
        reasons.append(RejectionReason.EXCESSIVE_DRAWDOWN)
    if obj.get("sharpe_ratio", 0) < min_sharpe:
        reasons.append(RejectionReason.DEGRADED_PERFORMANCE)
    if candidate.walk_forward_score < min_generalization:
        reasons.append(RejectionReason.LOW_GENERALIZATION)
    if obj.get("win_rate", 0) < min_win_rate:
        reasons.append(RejectionReason.DEGRADED_PERFORMANCE)
    if candidate.monte_carlo_score < 0.3:
        reasons.append(RejectionReason.OVERFITTING)
    return reasons


def classify_horizon_days(horizon: InvestmentHorizon) -> int:
    mapping = {
        InvestmentHorizon.WEEKLY: 5,
        InvestmentHorizon.MONTH_1: 21,
        InvestmentHorizon.MONTH_3: 63,
        InvestmentHorizon.MONTH_6: 126,
        InvestmentHorizon.MONTH_12: 252,
    }
    return mapping.get(horizon, 63)
