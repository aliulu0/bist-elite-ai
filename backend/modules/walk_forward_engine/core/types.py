from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional


# ── Enums ──────────────────────────────────────────────────────────────────

class WindowMode(enum.Enum):
    ROLLING = "rolling"
    EXPANDING = "expanding"
    ANCHORED = "anchored"
    SLIDING = "sliding"
    HYBRID = "hybrid"


class TrainTestSplit(enum.Enum):
    SEVENTY_THIRTY = "70_30"
    SEVENTY_FIVE_TWENTY_FIVE = "75_25"
    EIGHTY_TWENTY = "80_20"
    EIGHTY_FIFTEEN_FIFTEEN = "85_15"
    CUSTOM = "custom"


class WindowPeriod(enum.Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUAL = "semi_annual"
    ANNUAL = "annual"


class ValidationTarget(enum.Enum):
    STRATEGY = "strategy"
    SCORE = "score"
    DECISION = "decision"
    OPPORTUNITY = "opportunity"
    CONFIDENCE = "confidence"


class MarketRegime(enum.Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"


class ReportType(enum.Enum):
    EXECUTIVE = "executive"
    OPTIMIZATION = "optimization"
    TRAINING = "training"
    VALIDATION = "validation"
    FAILURE_ANALYSIS = "failure_analysis"
    GENERALIZATION = "generalization"
    FULL = "full"


class OverfittingSeverity(enum.Enum):
    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


# ── Core Data Classes ──────────────────────────────────────────────────────

@dataclass
class WindowSlice:
    index: int = 0
    train_start: str = ""
    train_end: str = ""
    test_start: str = ""
    test_end: str = ""
    train_rows: int = 0
    test_rows: int = 0
    regime: MarketRegime = MarketRegime.SIDEWAYS


@dataclass
class OptimizationResult:
    parameters: Dict[str, Any] = field(default_factory=dict)
    train_return: float = 0.0
    train_sharpe: float = 0.0
    train_drawdown: float = 0.0
    train_win_rate: float = 0.0
    train_trades: int = 0
    score: float = 0.0
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ValidationMetrics:
    out_of_sample_return: float = 0.0
    out_of_sample_win_rate: float = 0.0
    out_of_sample_sharpe: float = 0.0
    out_of_sample_sortino: float = 0.0
    out_of_sample_drawdown: float = 0.0
    out_of_sample_trades: int = 0
    total_return: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    win_rate: float = 0.0
    profit_factor: float = 0.0
    expectancy: float = 0.0


@dataclass
class WindowResult:
    window: WindowSlice = field(default_factory=WindowSlice)
    optimization: Optional[OptimizationResult] = None
    validation: Optional[ValidationMetrics] = None
    selected_parameters: Dict[str, Any] = field(default_factory=dict)
    execution_time_ms: float = 0.0
    success: bool = True
    error_message: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GeneralizationScores:
    generalization_score: float = 0.0
    overfitting_score: float = 0.0
    robustness_score: float = 0.0
    consistency_score: float = 0.0
    parameter_sensitivity: float = 0.0
    performance_degradation: float = 0.0
    regime_dependency: float = 0.0
    historical_drift: float = 0.0
    severity: OverfittingSeverity = OverfittingSeverity.NONE
    recommendation: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RegimePerformance:
    regime: MarketRegime = MarketRegime.SIDEWAYS
    windows_count: int = 0
    avg_return: float = 0.0
    avg_sharpe: float = 0.0
    avg_drawdown: float = 0.0
    avg_win_rate: float = 0.0
    stability: float = 0.0


@dataclass
class WalkForwardRequest:
    symbol: str = ""
    strategy: str = "default"
    start_date: str = "2020-01-01"
    end_date: str = "2025-12-31"
    window_mode: WindowMode = WindowMode.ROLLING
    train_test_split: TrainTestSplit = TrainTestSplit.EIGHTY_TWENTY
    custom_train_pct: float = 0.8
    window_period: WindowPeriod = WindowPeriod.MONTHLY
    min_train_rows: int = 100
    min_test_rows: int = 20
    optimization_metric: str = "sharpe"
    validation_target: ValidationTarget = ValidationTarget.STRATEGY
    parameter_space: Dict[str, List[Any]] = field(default_factory=dict)
    max_combinations: int = 100
    regime_aware: bool = True
    cross_validate: bool = False
    n_folds: int = 3
    initial_capital: float = 100000.0
    commission_pct: float = 0.001
    slippage_pct: float = 0.001
    stop_loss_pct: float = 5.0
    take_profit_pct: float = 15.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WalkForwardResult:
    request: WalkForwardRequest = field(default_factory=WalkForwardRequest)
    window_results: List[WindowResult] = field(default_factory=list)
    generalization: GeneralizationScores = field(default_factory=GeneralizationScores)
    regime_performance: List[RegimePerformance] = field(default_factory=list)
    recommended_parameters: Dict[str, Any] = field(default_factory=dict)
    total_windows: int = 0
    successful_windows: int = 0
    failed_windows: int = 0
    overall_train_return: float = 0.0
    overall_test_return: float = 0.0
    overall_train_sharpe: float = 0.0
    overall_test_sharpe: float = 0.0
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WalkForwardComparison:
    symbols: List[str] = field(default_factory=list)
    results: Dict[str, WalkForwardResult] = field(default_factory=dict)
    best_symbol: str = ""
    worst_symbol: str = ""
    avg_generalization: float = 0.0
    avg_robustness: float = 0.0


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


def compute_generalization_score(test_return: float, train_return: float) -> float:
    if train_return == 0:
        return 0.0
    ratio = test_return / train_return
    return max(0.0, min(1.0, ratio))


def compute_overfitting_score(train_sharpe: float, test_sharpe: float) -> float:
    if train_sharpe == 0:
        return 0.0
    degradation = (train_sharpe - test_sharpe) / abs(train_sharpe)
    return max(0.0, min(1.0, degradation))


def compute_robustness_score(
    generalization: float,
    consistency: float,
    regime_stability: float,
) -> float:
    return generalization * 0.4 + consistency * 0.35 + regime_stability * 0.25


def compute_consistency_score(sharpes: List[float]) -> float:
    if len(sharpes) < 2:
        return 1.0
    positive = sum(1 for s in sharpes if s > 0)
    ratio = positive / len(sharpes)
    std = _stdev(sharpes)
    volatility_penalty = min(1.0, std / 2.0) if std > 0 else 0.0
    return max(0.0, ratio - volatility_penalty * 0.3)


def classify_overfitting_severity(overfitting_score: float) -> OverfittingSeverity:
    if overfitting_score >= 0.8:
        return OverfittingSeverity.CRITICAL
    elif overfitting_score >= 0.6:
        return OverfittingSeverity.HIGH
    elif overfitting_score >= 0.4:
        return OverfittingSeverity.MODERATE
    elif overfitting_score >= 0.2:
        return OverfittingSeverity.LOW
    return OverfittingSeverity.NONE


def classify_market_regime(returns: List[float], volatility: float = 0.0) -> MarketRegime:
    if not returns:
        return MarketRegime.SIDEWAYS
    avg_return = _mean(returns)
    if volatility > 40:
        return MarketRegime.HIGH_VOLATILITY
    if avg_return > 0.14:
        return MarketRegime.BULL
    elif avg_return < -0.10:
        return MarketRegime.BEAR
    elif abs(avg_return) < 0.05:
        return MarketRegime.SIDEWAYS
    elif avg_return > 0:
        return MarketRegime.BULL
    else:
        return MarketRegime.BEAR


def get_split_ratios(split: TrainTestSplit, custom_pct: float = 0.8) -> tuple[float, float]:
    ratios = {
        TrainTestSplit.SEVENTY_THIRTY: (0.7, 0.3),
        TrainTestSplit.SEVENTY_FIVE_TWENTY_FIVE: (0.75, 0.25),
        TrainTestSplit.EIGHTY_TWENTY: (0.8, 0.2),
        TrainTestSplit.EIGHTY_FIFTEEN_FIFTEEN: (0.85, 0.15),
        TrainTestSplit.CUSTOM: (max(0.1, min(0.95, custom_pct)), max(0.05, min(0.9, 1.0 - custom_pct))),
    }
    return ratios.get(split, (0.8, 0.2))


def generate_overfitting_recommendation(severity: OverfittingSeverity, scores: GeneralizationScores) -> str:
    recommendations = {
        OverfittingSeverity.NONE: "Strategy shows strong generalization. Proceed with deployment.",
        OverfittingSeverity.LOW: "Minor overfitting detected. Consider reducing parameter complexity.",
        OverfittingSeverity.MODERATE: "Moderate overfitting. Recommend additional validation and regime testing.",
        OverfittingSeverity.HIGH: "Significant overfitting detected. Strategy needs redesign with simpler parameters.",
        OverfittingSeverity.CRITICAL: "Severe overfitting. Strategy is likely curve-fit and unreliable for live trading.",
    }
    base = recommendations.get(severity, "Unable to assess.")
    if scores.performance_degradation > 0.5:
        base += " Performance degradation exceeds 50% between train and test."
    if scores.regime_dependency > 0.6:
        base += " High regime dependency — strategy fails in certain market conditions."
    return base
