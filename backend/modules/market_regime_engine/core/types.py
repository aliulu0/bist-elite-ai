from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


class MarketRegime(enum.Enum):
    STRONG_BULL = "strong_bull"
    BULL = "bull"
    WEAK_BULL = "weak_bull"
    SIDEWAYS = "sideways"
    WEAK_BEAR = "weak_bear"
    BEAR = "bear"
    STRONG_BEAR = "strong_bear"
    RECOVERY = "recovery"
    DISTRIBUTION = "distribution"
    ACCUMULATION = "accumulation"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"


class DetectionSignal(enum.Enum):
    MOVING_AVERAGE_STRUCTURE = "moving_average_structure"
    BREADTH_INDICATORS = "breadth_indicators"
    VOLATILITY = "volatility"
    MOMENTUM = "momentum"
    TREND_STRENGTH = "trend_strength"
    VOLUME_EXPANSION = "volume_expansion"
    SECTOR_ROTATION = "sector_rotation"
    LIQUIDITY = "liquidity"
    MARKET_PARTICIPATION = "market_participation"


class InvestmentHorizon(enum.Enum):
    WEEKLY = "weekly"
    MONTH_1 = "1_month"
    MONTH_3 = "3_months"
    MONTH_6 = "6_months"
    MONTH_12 = "12_months"


class ReportType(enum.Enum):
    CURRENT_REGIME = "current_regime"
    REGIME_HISTORY = "regime_history"
    REGIME_CHANGES = "regime_changes"
    SECTOR_ROTATION = "sector_rotation"
    EXPECTED_NEXT_REGIME = "expected_next_regime"
    RISK_IMPLICATIONS = "risk_imPLICATIONS"
    FULL = "full"


class SectorStrength(enum.Enum):
    LEADING = "leading"
    WEAK = "weak"
    NEUTRAL = "neutral"
    ROTATING = "rotating"


class TransitionType(enum.Enum):
    BULL_TO_SIDEWAYS = "bull_to_sideways"
    SIDEWAYS_TO_BEAR = "sideways_to_bear"
    BEAR_TO_RECOVERY = "bear_to_recovery"
    RECOVERY_TO_BULL = "recovery_to_bull"
    ACCUMULATION_TO_BREAKOUT = "accumulation_to_breakout"
    DISTRIBUTION_TO_DOWNTREND = "distribution_to_downtrend"
    CONTINUATION = "continuation"


class StrategyProfile(enum.Enum):
    AGGRESSIVE_GROWTH = "aggressive_growth"
    MODERATE_GROWTH = "moderate_growth"
    BALANCED = "balanced"
    DEFENSIVE = "defensive"
    VERY_DEFENSIVE = "very_defensive"
    MARKET_NEUTRAL = "market_neutral"
    MOMENTUM = "momentum"
    MEAN_REVERSION = "mean_reversion"


@dataclass
class RegimeSignal:
    signal_type: DetectionSignal = DetectionSignal.MOVING_AVERAGE_STRUCTURE
    value: float = 0.0
    normalized_value: float = 0.0
    confidence: float = 0.0
    weight: float = 1.0
    description: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RegimeClassification:
    regime: MarketRegime = MarketRegime.SIDEWAYS
    confidence: float = 0.0
    score: float = 0.0
    stability: float = 0.0
    transition_probabilities: Dict[str, float] = field(default_factory=dict)
    signals: List[RegimeSignal] = field(default_factory=list)
    contributing_signals: Dict[str, float] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SectorAnalysis:
    sector_name: str = ""
    strength: SectorStrength = SectorStrength.NEUTRAL
    score: float = 0.0
    relative_performance: float = 0.0
    momentum: float = 0.0
    volume_trend: float = 0.0
    leading_score: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RegimeTransition:
    from_regime: MarketRegime = MarketRegime.SIDEWAYS
    to_regime: MarketRegime = MarketRegime.SIDEWAYS
    transition_type: TransitionType = TransitionType.CONTINUATION
    probability: float = 0.0
    historical_frequency: float = 0.0
    avg_duration_days: int = 0
    trigger_signals: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RegimeHistoryEntry:
    date: str = ""
    regime: MarketRegime = MarketRegime.SIDEWAYS
    confidence: float = 0.0
    score: float = 0.0
    stability: float = 0.0
    duration_days: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RegimeAnalysisRequest:
    reference_date: str = ""
    horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3
    signals: List[DetectionSignal] = field(default_factory=list)
    market_data: Dict[str, float] = field(default_factory=dict)
    sector_data: Dict[str, Dict[str, float]] = field(default_factory=dict)
    lookback_days: int = 252
    min_confidence: float = 0.3
    include_transitions: bool = True
    include_sectors: bool = True
    seed: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RegimeAnalysisResult:
    request: RegimeAnalysisRequest = field(default_factory=RegimeAnalysisRequest)
    classification: RegimeClassification = field(default_factory=RegimeClassification)
    sectors: List[SectorAnalysis] = field(default_factory=list)
    transitions: List[RegimeTransition] = field(default_factory=list)
    history: List[RegimeHistoryEntry] = field(default_factory=list)
    strategy_profile: StrategyProfile = StrategyProfile.BALANCED
    risk_implications: Dict[str, Any] = field(default_factory=dict)
    next_regime_prediction: Optional[RegimeClassification] = None
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


REGIME_ORDER: Dict[MarketRegime, int] = {
    MarketRegime.STRONG_BEAR: 0,
    MarketRegime.BEAR: 1,
    MarketRegime.WEAK_BEAR: 2,
    MarketRegime.SIDEWAYS: 3,
    MarketRegime.WEAK_BULL: 4,
    MarketRegime.BULL: 5,
    MarketRegime.STRONG_BULL: 6,
    MarketRegime.RECOVERY: 7,
    MarketRegime.DISTRIBUTION: 8,
    MarketRegime.ACCUMULATION: 9,
    MarketRegime.HIGH_VOLATILITY: 10,
    MarketRegime.LOW_VOLATILITY: 11,
}

REGIME_TO_STRATEGY: Dict[MarketRegime, StrategyProfile] = {
    MarketRegime.STRONG_BULL: StrategyProfile.AGGRESSIVE_GROWTH,
    MarketRegime.BULL: StrategyProfile.MODERATE_GROWTH,
    MarketRegime.WEAK_BULL: StrategyProfile.BALANCED,
    MarketRegime.SIDEWAYS: StrategyProfile.MARKET_NEUTRAL,
    MarketRegime.WEAK_BEAR: StrategyProfile.DEFENSIVE,
    MarketRegime.BEAR: StrategyProfile.VERY_DEFENSIVE,
    MarketRegime.STRONG_BEAR: StrategyProfile.VERY_DEFENSIVE,
    MarketRegime.RECOVERY: StrategyProfile.MOMENTUM,
    MarketRegime.DISTRIBUTION: StrategyProfile.DEFENSIVE,
    MarketRegime.ACCUMULATION: StrategyProfile.MEAN_REVERSION,
    MarketRegime.HIGH_VOLATILITY: StrategyProfile.MARKET_NEUTRAL,
    MarketRegime.LOW_VOLATILITY: StrategyProfile.MODERATE_GROWTH,
}

REGIME_RISK_LEVEL: Dict[MarketRegime, float] = {
    MarketRegime.STRONG_BULL: 0.2,
    MarketRegime.BULL: 0.3,
    MarketRegime.WEAK_BULL: 0.4,
    MarketRegime.SIDEWAYS: 0.5,
    MarketRegime.WEAK_BEAR: 0.6,
    MarketRegime.BEAR: 0.8,
    MarketRegime.STRONG_BEAR: 0.95,
    MarketRegime.RECOVERY: 0.5,
    MarketRegime.DISTRIBUTION: 0.7,
    MarketRegime.ACCUMULATION: 0.5,
    MarketRegime.HIGH_VOLATILITY: 0.8,
    MarketRegime.LOW_VOLATILITY: 0.3,
}


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


def classify_regime(score: float) -> MarketRegime:
    if score >= 0.85:
        return MarketRegime.STRONG_BULL
    if score >= 0.70:
        return MarketRegime.BULL
    if score >= 0.55:
        return MarketRegime.WEAK_BULL
    if score >= 0.42:
        return MarketRegime.SIDEWAYS
    if score >= 0.30:
        return MarketRegime.WEAK_BEAR
    if score >= 0.15:
        return MarketRegime.BEAR
    return MarketRegime.STRONG_BEAR


def compute_transition_probability(
    from_regime: MarketRegime,
    to_regime: MarketRegime,
    history: List[RegimeHistoryEntry],
) -> float:
    if not history:
        return 0.0
    transitions_from = 0
    transitions_to = 0
    for i in range(1, len(history)):
        if history[i - 1].regime == from_regime:
            transitions_from += 1
            if history[i].regime == to_regime:
                transitions_to += 1
    if transitions_from == 0:
        return 0.0
    return transitions_to / transitions_from


def get_strategy_profile(regime: MarketRegime) -> StrategyProfile:
    return REGIME_TO_STRATEGY.get(regime, StrategyProfile.BALANCED)


def get_risk_level(regime: MarketRegime) -> float:
    return REGIME_RISK_LEVEL.get(regime, 0.5)


def compute_stability(
    recent_regimes: List[MarketRegime],
    window: int = 5,
) -> float:
    if not recent_regimes:
        return 0.0
    recent = recent_regimes[-window:]
    if not recent:
        return 0.0
    current = recent[-1]
    same_count = sum(1 for r in recent if r == current)
    return same_count / len(recent)
