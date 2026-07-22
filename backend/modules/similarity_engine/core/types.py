from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


class SimilarityMethod(enum.Enum):
    WEIGHTED_FEATURE = "weighted_feature"
    COSINE = "cosine"
    EUCLIDEAN = "euclidean"
    MANHATTAN = "manhattan"
    DYNAMIC_TIME_WARPING = "dynamic_time_warping"
    HYBRID = "hybrid"


class SimilarityLabel(enum.Enum):
    VERY_WEAK = "very_weak"
    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"
    VERY_STRONG = "very_strong"
    EXCEPTIONAL = "exceptional"


class MarketRegime(enum.Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"


class PatternOutcome(enum.Enum):
    SUCCESSFUL = "successful"
    FAILED = "failed"
    NEUTRAL = "neutral"


class FeatureCategory(enum.Enum):
    FINANCIAL = "financial"
    GROWTH = "growth"
    PROFITABILITY = "profitability"
    VALUATION = "valuation"
    MOMENTUM = "momentum"
    TREND = "trend"
    VOLUME = "volume"
    PATTERN = "pattern"
    SECTOR = "sector"
    MARKET_REGIME = "market_regime"


class ReportType(enum.Enum):
    EXECUTIVE_SUMMARY = "executive_summary"
    TOP_SIMILAR_STOCKS = "top_similar_stocks"
    PERFORMANCE_COMPARISON = "performance_comparison"
    SIMILARITY_HEATMAP = "similarity_heatmap"
    FEATURE_COMPARISON = "feature_comparison"
    RISK_COMPARISON = "risk_comparison"
    FULL = "full"


class ValidationPeriod(enum.Enum):
    ONE_WEEK = "1w"
    ONE_MONTH = "1m"
    THREE_MONTHS = "3m"
    SIX_MONTHS = "6m"
    TWELVE_MONTHS = "12m"


@dataclass
class FeatureVector:
    symbol: str = ""
    date: str = ""
    features: Dict[str, float] = field(default_factory=dict)
    feature_categories: Dict[str, FeatureCategory] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SimilarityResult:
    source_symbol: str = ""
    target_symbol: str = ""
    target_date: str = ""
    similarity_score: float = 0.0
    similarity_label: SimilarityLabel = SimilarityLabel.MODERATE
    method: SimilarityMethod = SimilarityMethod.WEIGHTED_FEATURE
    feature_distances: Dict[str, float] = field(default_factory=dict)
    contributing_features: Dict[str, float] = field(default_factory=dict)
    historical_outcome: Dict[str, float] = field(default_factory=dict)
    pattern_outcome: PatternOutcome = PatternOutcome.NEUTRAL
    market_regime: MarketRegime = MarketRegime.SIDEWAYS
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class HistoricalOutcome:
    period_return: Dict[str, float] = field(default_factory=dict)
    max_drawdown: float = 0.0
    win_rate: float = 0.0
    holding_period_days: int = 0
    avg_return: float = 0.0
    total_cases: int = 0
    successful_cases: int = 0
    failed_cases: int = 0
    neutral_cases: int = 0


@dataclass
class PatternMemory:
    pattern_id: str = ""
    symbol: str = ""
    date: str = ""
    feature_vector: Optional[FeatureVector] = None
    outcome: PatternOutcome = PatternOutcome.NEUTRAL
    return_pct: float = 0.0
    holding_period_days: int = 0
    market_regime: MarketRegime = MarketRegime.SIDEWAYS
    similarity_score: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SimilarityRequest:
    symbol: str = ""
    reference_date: str = ""
    top_n: int = 5
    methods: List[SimilarityMethod] = field(default_factory=lambda: [SimilarityMethod.WEIGHTED_FEATURE])
    feature_categories: List[FeatureCategory] = field(default_factory=list)
    market_regime: Optional[MarketRegime] = None
    min_similarity: float = 0.3
    lookback_days: int = 252
    validation_periods: List[ValidationPeriod] = field(default_factory=lambda: [
        ValidationPeriod.ONE_WEEK,
        ValidationPeriod.ONE_MONTH,
        ValidationPeriod.THREE_MONTHS,
    ])
    weights: Dict[str, float] = field(default_factory=dict)
    seed: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SimilarityAnalysis:
    request: SimilarityRequest = field(default_factory=SimilarityRequest)
    results: List[SimilarityResult] = field(default_factory=list)
    top_similar_stocks: List[SimilarityResult] = field(default_factory=list)
    historical_outcomes: Dict[str, HistoricalOutcome] = field(default_factory=dict)
    pattern_memories: List[PatternMemory] = field(default_factory=list)
    overall_similarity: float = 0.0
    confidence_score: float = 0.0
    regime_distribution: Dict[str, int] = field(default_factory=dict)
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


SIMILARITY_LABEL_THRESHOLDS: Dict[SimilarityLabel, float] = {
    SimilarityLabel.VERY_WEAK: 0.0,
    SimilarityLabel.WEAK: 0.2,
    SimilarityLabel.MODERATE: 0.4,
    SimilarityLabel.STRONG: 0.6,
    SimilarityLabel.VERY_STRONG: 0.8,
    SimilarityLabel.EXCEPTIONAL: 0.9,
}

VALIDATION_PERIOD_DAYS: Dict[ValidationPeriod, int] = {
    ValidationPeriod.ONE_WEEK: 5,
    ValidationPeriod.ONE_MONTH: 21,
    ValidationPeriod.THREE_MONTHS: 63,
    ValidationPeriod.SIX_MONTHS: 126,
    ValidationPeriod.TWELVE_MONTHS: 252,
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


def classify_similarity_label(score: float) -> SimilarityLabel:
    if score >= 0.9:
        return SimilarityLabel.EXCEPTIONAL
    if score >= 0.8:
        return SimilarityLabel.VERY_STRONG
    if score >= 0.6:
        return SimilarityLabel.STRONG
    if score >= 0.4:
        return SimilarityLabel.MODERATE
    if score >= 0.2:
        return SimilarityLabel.WEAK
    return SimilarityLabel.VERY_WEAK


def weighted_euclidean_distance(
    vec_a: Dict[str, float],
    vec_b: Dict[str, float],
    weights: Optional[Dict[str, float]] = None,
) -> float:
    weights = weights or {}
    total_sq = 0.0
    total_weight = 0.0
    all_keys = set(vec_a.keys()) | set(vec_b.keys())
    for k in all_keys:
        w = weights.get(k, 1.0)
        a = vec_a.get(k, 0.0)
        b = vec_b.get(k, 0.0)
        total_sq += w * (a - b) ** 2
        total_weight += w
    if total_weight == 0:
        return 0.0
    return (total_sq / total_weight) ** 0.5


def cosine_similarity(
    vec_a: Dict[str, float],
    vec_b: Dict[str, float],
) -> float:
    all_keys = set(vec_a.keys()) | set(vec_b.keys())
    dot = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for k in all_keys:
        a = vec_a.get(k, 0.0)
        b = vec_b.get(k, 0.0)
        dot += a * b
        norm_a += a * a
        norm_b += b * b
    denom = (norm_a ** 0.5) * (norm_b ** 0.5)
    if denom == 0:
        return 0.0
    return dot / denom


def manhattan_distance(
    vec_a: Dict[str, float],
    vec_b: Dict[str, float],
    weights: Optional[Dict[str, float]] = None,
) -> float:
    weights = weights or {}
    total = 0.0
    all_keys = set(vec_a.keys()) | set(vec_b.keys())
    for k in all_keys:
        w = weights.get(k, 1.0)
        a = vec_a.get(k, 0.0)
        b = vec_b.get(k, 0.0)
        total += w * abs(a - b)
    return total


def dynamic_time_warping_distance(
    series_a: List[float],
    series_b: List[float],
) -> float:
    n = len(series_a)
    m = len(series_b)
    if n == 0 or m == 0:
        return float("inf")
    dtw = [[float("inf")] * (m + 1) for _ in range(n + 1)]
    dtw[0][0] = 0.0
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = abs(series_a[i - 1] - series_b[j - 1])
            dtw[i][j] = cost + min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1])
    return dtw[n][m] / max(n, m) if max(n, m) > 0 else 0.0


def hybrid_similarity_score(
    vec_a: Dict[str, float],
    vec_b: Dict[str, float],
    weights: Optional[Dict[str, float]] = None,
) -> float:
    cos_sim = cosine_similarity(vec_a, vec_b)
    euc_dist = weighted_euclidean_distance(vec_a, vec_b, weights)
    man_dist = manhattan_distance(vec_a, vec_b, weights)
    max_dist = max(euc_dist, man_dist, 1.0)
    euc_sim = 1.0 - min(euc_dist / max_dist, 1.0)
    man_sim = 1.0 - min(man_dist / max_dist, 1.0)
    return 0.4 * cos_sim + 0.3 * euc_sim + 0.3 * man_sim
