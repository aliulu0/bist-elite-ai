from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# ── Enums ──────────────────────────────────────────────────────────────────

class SimulationMethod(enum.Enum):
    HISTORICAL_BOOTSTRAP = "historical_bootstrap"
    GEOMETRIC_BROWNIAN_MOTION = "geometric_brownian_motion"
    BLOCK_BOOTSTRAP = "block_bootstrap"
    REGIME_SWITCHING = "regime_switching"
    STUDENT_T = "student_t"
    FAT_TAIL = "fat_tail"
    JUMP_DIFFUSION = "jump_diffusion"
    CUSTOM_PROBABILITY = "custom_probability"


class MarketScenario(enum.Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    HIGH_INFLATION = "high_inflation"
    HIGH_INTEREST_RATE = "high_interest_rate"
    LOW_LIQUIDITY = "low_liquidity"
    FLASH_CRASH = "flash_crash"
    BLACK_SWAN = "black_swan"
    RECOVERY = "recovery"


class RiskMeasure(enum.Enum):
    VALUE_AT_RISK = "value_at_risk"
    CONDITIONAL_VAR = "conditional_var"
    MAX_DRAWDOWN = "max_drawdown"
    EXPECTED_DRAWDOWN = "expected_drawdown"
    TAIL_RISK = "tail_risk"
    PROBABILITY_OF_LOSS = "probability_of_loss"
    PROBABILITY_OF_OUTPERFORMANCE = "probability_of_outperformance"
    PROBABILITY_OF_CAPITAL_PRESERVATION = "probability_of_capital_preservation"
    RISK_OF_RUIN = "risk_of_ruin"
    ULCER_INDEX = "ulcer_index"


class ReportType(enum.Enum):
    EXECUTIVE = "executive"
    SIMULATION_SUMMARY = "simulation_summary"
    WORST_CASE = "worst_case"
    BEST_CASE = "best_case"
    EXPECTED_CASE = "expected_case"
    TAIL_RISK = "tail_risk"
    CAPITAL_PRESERVATION = "capital_preservation"
    FULL = "full"


class ConfidenceLevel(enum.Enum):
    P90 = 0.90
    P95 = 0.95
    P99 = 0.99
    P99_9 = 0.999


class ValidationTarget(enum.Enum):
    ELITE_SCORE = "elite_score"
    OPPORTUNITY_SCORE = "opportunity_score"
    CONFIDENCE = "confidence"
    DECISION = "decision"
    STRATEGY = "strategy"


# ── Core Data Classes ──────────────────────────────────────────────────────

@dataclass
class SimulationConfig:
    method: SimulationMethod = SimulationMethod.GEOMETRIC_BROWNIAN_MOTION
    num_simulations: int = 10000
    num_days: int = 252
    initial_capital: float = 100000.0
    annual_return: float = 0.12
    annual_volatility: float = 0.20
    risk_free_rate: float = 0.05
    seed: Optional[int] = None
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SimulationResult:
    simulation_id: int = 0
    path: List[float] = field(default_factory=list)
    terminal_value: float = 0.0
    total_return: float = 0.0
    max_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    volatility: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RiskMetrics:
    value_at_risk: float = 0.0
    conditional_var: float = 0.0
    max_drawdown: float = 0.0
    expected_drawdown: float = 0.0
    tail_risk: float = 0.0
    probability_of_loss: float = 0.0
    probability_of_outperformance: float = 0.0
    probability_of_capital_preservation: float = 0.0
    risk_of_ruin: float = 0.0
    ulcer_index: float = 0.0
    var_90: float = 0.0
    var_95: float = 0.0
    var_99: float = 0.0
    cvar_95: float = 0.0
    cvar_99: float = 0.0


@dataclass
class ProbabilityMetrics:
    prob_loss_1pct: float = 0.0
    prob_loss_5pct: float = 0.0
    prob_loss_10pct: float = 0.0
    prob_loss_20pct: float = 0.0
    prob_gain_5pct: float = 0.0
    prob_gain_10pct: float = 0.0
    prob_gain_20pct: float = 0.0
    prob_gain_50pct: float = 0.0
    prob_double: float = 0.0
    prob_halve: float = 0.0
    expected_return: float = 0.0
    median_return: float = 0.0
    return_std: float = 0.0
    skewness: float = 0.0
    kurtosis: float = 0.0


@dataclass
class PortfolioMetrics:
    portfolio_return: float = 0.0
    portfolio_volatility: float = 0.0
    diversification_benefit: float = 0.0
    correlation_impact: float = 0.0
    sector_concentration: float = 0.0
    liquidity_stress: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    num_positions: int = 0
    max_weight: float = 0.0
    weights: Dict[str, float] = field(default_factory=dict)


@dataclass
class ScenarioResult:
    scenario: MarketScenario = MarketScenario.SIDEWAYS
    label: str = ""
    simulated_return: float = 0.0
    simulated_volatility: float = 0.0
    simulated_var: float = 0.0
    simulated_cvar: float = 0.0
    simulated_max_drawdown: float = 0.0
    probability: float = 0.0
    impact_score: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ConfidenceInterval:
    lower: float = 0.0
    upper: float = 0.0
    confidence_level: float = 0.95
    mean: float = 0.0
    std: float = 0.0


@dataclass
class MonteCarloRequest:
    symbol: str = ""
    strategy: str = "default"
    start_date: str = "2020-01-01"
    end_date: str = "2025-12-31"
    simulation_method: SimulationMethod = SimulationMethod.GEOMETRIC_BROWNIAN_MOTION
    num_simulations: int = 10000
    num_days: int = 252
    initial_capital: float = 100000.0
    annual_return: float = 0.12
    annual_volatility: float = 0.20
    risk_free_rate: float = 0.05
    confidence_levels: List[float] = field(default_factory=lambda: [0.90, 0.95, 0.99])
    scenarios: List[MarketScenario] = field(default_factory=list)
    custom_percentiles: List[float] = field(default_factory=list)
    parameters: Dict[str, Any] = field(default_factory=dict)
    seed: Optional[int] = None
    validation_target: ValidationTarget = ValidationTarget.STRATEGY
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MonteCarloResult:
    request: MonteCarloRequest = field(default_factory=MonteCarloRequest)
    simulations: List[SimulationResult] = field(default_factory=list)
    risk_metrics: RiskMetrics = field(default_factory=RiskMetrics)
    probability_metrics: ProbabilityMetrics = field(default_factory=ProbabilityMetrics)
    portfolio_metrics: PortfolioMetrics = field(default_factory=PortfolioMetrics)
    scenario_results: List[ScenarioResult] = field(default_factory=list)
    confidence_intervals: List[ConfidenceInterval] = field(default_factory=list)
    terminal_values: List[float] = field(default_factory=list)
    mean_return: float = 0.0
    median_return: float = 0.0
    std_return: float = 0.0
    worst_case_return: float = 0.0
    best_case_return: float = 0.0
    expected_case_return: float = 0.0
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MonteCarloComparison:
    symbols: List[str] = field(default_factory=list)
    results: Dict[str, MonteCarloResult] = field(default_factory=dict)
    best_symbol: str = ""
    worst_symbol: str = ""
    avg_var: float = 0.0
    avg_cvar: float = 0.0


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


def _percentile(values: List[float], p: float) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    k = (len(s) - 1) * p
    f = int(k)
    c = f + 1
    if c >= len(s):
        return s[-1]
    return s[f] + (k - f) * (s[c] - s[f])


def _skewness(values: List[float]) -> float:
    n = len(values)
    if n < 3:
        return 0.0
    m = _mean(values)
    s = _stdev(values)
    if s == 0:
        return 0.0
    return sum(((v - m) / s) ** 3 for v in values) * n / ((n - 1) * (n - 2))


def _kurtosis(values: List[float]) -> float:
    n = len(values)
    if n < 4:
        return 0.0
    m = _mean(values)
    s = _stdev(values)
    if s == 0:
        return 0.0
    raw = sum(((v - m) / s) ** 4 for v in values) / n
    excess = raw - 3.0
    correction = (n - 1) / ((n - 2) * (n - 3)) * ((n + 1) * excess + 6)
    return excess + correction


def _max_drawdown_from_values(values: List[float]) -> float:
    if len(values) < 2:
        return 0.0
    peak = values[0]
    max_dd = 0.0
    for v in values:
        if v > peak:
            peak = v
        if peak > 0:
            dd = (peak - v) / peak * 100
            max_dd = max(max_dd, dd)
    return max_dd


def _sharpe_from_returns(returns: List[float], risk_free_rate: float = 0.05) -> float:
    if len(returns) < 2:
        return 0.0
    m = _mean(returns)
    s = _stdev(returns)
    if s == 0:
        return 0.0
    daily_rf = risk_free_rate / 252
    return (m - daily_rf) / s * (252 ** 0.5)


def _sortino_from_returns(returns: List[float], risk_free_rate: float = 0.05) -> float:
    if len(returns) < 2:
        return 0.0
    m = _mean(returns)
    daily_rf = risk_free_rate / 252
    downside = [r for r in returns if r < daily_rf]
    if not downside:
        return 10.0
    downside_var = sum(r ** 2 for r in downside) / len(returns)
    downside_std = downside_var ** 0.5
    if downside_std == 0:
        return 10.0
    return (m - daily_rf) / downside_std * (252 ** 0.5)


def classify_severity(score: float, thresholds: tuple = (0.2, 0.4, 0.6, 0.8)) -> str:
    if score >= thresholds[3]:
        return "critical"
    elif score >= thresholds[2]:
        return "high"
    elif score >= thresholds[1]:
        return "moderate"
    elif score >= thresholds[0]:
        return "low"
    return "none"
