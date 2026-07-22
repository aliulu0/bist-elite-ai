from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class FactorGroup(str, Enum):
    VALUE = "value"
    GROWTH = "growth"
    QUALITY = "quality"
    MOMENTUM = "momentum"
    TREND = "trend"
    RISK = "risk"
    SMART_MONEY = "smart_money"
    PROFITABILITY = "profitability"
    EFFICIENCY = "efficiency"
    FINANCIAL_STRENGTH = "financial_strength"
    TECHNICAL_STRENGTH = "technical_strength"
    LIQUIDITY = "liquidity"


class FactorName(str, Enum):
    PRICE_TO_DIVIDEND = "price_to_dividends"
    PRICE_TO_CASHFLOW = "price_to_cashflow"
    FORWARD_PE = "forward_pe"
    PEG = "peg_ratio"
    ENTERPRISE_VALUE = "enterprise_value"
    SECTOR_RELATIVE_VALUATION = "sector_relative_valuation"
    REVENUE_GROWTH = "revenue_growth"
    NET_PROFIT_GROWTH = "net_profit_growth"
    EBITDA_GROWTH = "ebitda_growth"
    EPS_GROWTH = "eps_growth"
    CASH_FLOW_GROWTH = "cash_flow_growth"
    ROE = "roe"
    ROA = "roa"
    GROSS_MARGIN = "gross_margin"
    OPERATING_MARGIN = "operating_margin"
    NET_MARGIN = "net_margin"
    PIOTROSKI_SCORE = "piotroski_score"
    ALTMAN_Z = "altman_z"
    RSI = "rsi"
    MACD = "macd"
    ADX = "adx"
    ROC = "roc"
    RELATIVE_STRENGTH = "relative_strength"
    SMA_SIGNAL = "sma_signal"
    EMA_SIGNAL = "ema_signal"
    GOLDEN_CROSS = "golden_cross"
    SUPERTREND = "supertrend"
    ICHIMOKU = "ichimoku"
    VOLATILITY = "volatility"
    BETA = "beta"
    MAX_DRAWDOWN = "max_drawdown"
    LIQUIDITY_RISK = "liquidity_risk"
    OBV = "obv"
    CMF = "cmf"
    RELATIVE_VOLUME = "relative_volume"
    VOLUME_SPIKE = "volume_spike"
    INSTITUTIONAL_ACCUMULATION = "institutional_accumulation"
    GROSS_PROFIT_MARGIN = "gross_profit_margin"
    OPERATING_PROFITABILITY = "operating_profitability"
    ASSET_TURNOVER = "asset_turnover"
    INVENTORY_TURNOVER = "inventory_turnover"
    RECEIVABLE_TURNOVER = "receivable_turnover"
    CURRENT_RATIO = "current_ratio"
    DEBT_TO_EQUITY = "debt_to_equity"
    INTEREST_COVERAGE = "interest_coverage"
    FREE_CASH_FLOW_YIELD = "free_cash_flow_yield"
    ATR_STRENGTH = "atr_strength"
    BOLLINGER_STRENGTH = "bollinger_strength"
    VWAP_STRENGTH = "vwap_strength"
    DEPTH_OF_MARKET = "depth_of_market"
    BID_ASK_SPREAD = "bid_ask_spread"


class MarketRegime(str, Enum):
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


class InvestmentHorizon(str, Enum):
    WEEKLY = "weekly"
    MONTH_1 = "month_1"
    MONTH_3 = "month_3"
    MONTH_6 = "month_6"
    MONTH_12 = "month_12"


class ScoreStrength(str, Enum):
    VERY_STRONG = "very_strong"
    STRONG = "strong"
    NEUTRAL = "neutral"
    WEAK = "weak"
    VERY_WEAK = "very_weak"


class ReportType(str, Enum):
    FULL = "full"
    SUMMARY = "summary"
    FACTOR_BREAKDOWN = "factor_breakdown"
    RANKING = "ranking"
    COMPARISON = "comparison"
    REGIME_ADAPTED = "regime_adapted"


class BenchmarkResultStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

GROUP_FACTORS: Dict[FactorGroup, List[FactorName]] = {
    FactorGroup.VALUE: [
        FactorName.PRICE_TO_DIVIDEND,
        FactorName.PRICE_TO_CASHFLOW,
        FactorName.FORWARD_PE,
        FactorName.PEG,
        FactorName.ENTERPRISE_VALUE,
        FactorName.SECTOR_RELATIVE_VALUATION,
    ],
    FactorGroup.GROWTH: [
        FactorName.REVENUE_GROWTH,
        FactorName.NET_PROFIT_GROWTH,
        FactorName.EBITDA_GROWTH,
        FactorName.EPS_GROWTH,
        FactorName.CASH_FLOW_GROWTH,
    ],
    FactorGroup.QUALITY: [
        FactorName.ROE,
        FactorName.ROA,
        FactorName.GROSS_MARGIN,
        FactorName.OPERATING_MARGIN,
        FactorName.NET_MARGIN,
        FactorName.PIOTROSKI_SCORE,
        FactorName.ALTMAN_Z,
    ],
    FactorGroup.MOMENTUM: [
        FactorName.RSI,
        FactorName.MACD,
        FactorName.ADX,
        FactorName.ROC,
        FactorName.RELATIVE_STRENGTH,
    ],
    FactorGroup.TREND: [
        FactorName.SMA_SIGNAL,
        FactorName.EMA_SIGNAL,
        FactorName.GOLDEN_CROSS,
        FactorName.SUPERTREND,
        FactorName.ICHIMOKU,
    ],
    FactorGroup.RISK: [
        FactorName.VOLATILITY,
        FactorName.BETA,
        FactorName.MAX_DRAWDOWN,
        FactorName.LIQUIDITY_RISK,
    ],
    FactorGroup.SMART_MONEY: [
        FactorName.OBV,
        FactorName.CMF,
        FactorName.RELATIVE_VOLUME,
        FactorName.VOLUME_SPIKE,
        FactorName.INSTITUTIONAL_ACCUMULATION,
    ],
    FactorGroup.PROFITABILITY: [
        FactorName.GROSS_PROFIT_MARGIN,
        FactorName.OPERATING_PROFITABILITY,
        FactorName.NET_MARGIN,
        FactorName.ROE,
        FactorName.ROA,
    ],
    FactorGroup.EFFICIENCY: [
        FactorName.ASSET_TURNOVER,
        FactorName.INVENTORY_TURNOVER,
        FactorName.RECEIVABLE_TURNOVER,
    ],
    FactorGroup.FINANCIAL_STRENGTH: [
        FactorName.CURRENT_RATIO,
        FactorName.DEBT_TO_EQUITY,
        FactorName.INTEREST_COVERAGE,
        FactorName.FREE_CASH_FLOW_YIELD,
    ],
    FactorGroup.TECHNICAL_STRENGTH: [
        FactorName.RSI,
        FactorName.ADX,
        FactorName.SMA_SIGNAL,
        FactorName.EMA_SIGNAL,
        FactorName.ATR_STRENGTH,
        FactorName.BOLLINGER_STRENGTH,
        FactorName.VWAP_STRENGTH,
    ],
    FactorGroup.LIQUIDITY: [
        FactorName.DEPTH_OF_MARKET,
        FactorName.BID_ASK_SPREAD,
        FactorName.RELATIVE_VOLUME,
        FactorName.LIQUIDITY_RISK,
    ],
}

FACTOR_GROUP_MAP: Dict[FactorName, FactorGroup] = {}
for _grp, _factors in GROUP_FACTORS.items():
    for _f in _factors:
        FACTOR_GROUP_MAP.setdefault(_f, _grp)

DEFAULT_WEIGHTS: Dict[FactorGroup, float] = {
    FactorGroup.VALUE: 1.2,
    FactorGroup.GROWTH: 1.1,
    FactorGroup.QUALITY: 1.0,
    FactorGroup.MOMENTUM: 1.0,
    FactorGroup.TREND: 0.9,
    FactorGroup.RISK: 0.8,
    FactorGroup.SMART_MONEY: 0.9,
    FactorGroup.PROFITABILITY: 1.0,
    FactorGroup.EFFICIENCY: 0.7,
    FactorGroup.FINANCIAL_STRENGTH: 0.8,
        FactorGroup.TECHNICAL_STRENGTH: 1.0,
    FactorGroup.LIQUIDITY: 0.7,
}

HORIZON_WEIGHT_ADJUSTMENTS: Dict[InvestmentHorizon, Dict[FactorGroup, float]] = {
    InvestmentHorizon.WEEKLY: {
        FactorGroup.MOMENTUM: 1.5,
        FactorGroup.TREND: 1.3,
        FactorGroup.SMART_MONEY: 1.2,
        FactorGroup.VALUE: 0.5,
        FactorGroup.QUALITY: 0.6,
    },
    InvestmentHorizon.MONTH_1: {
        FactorGroup.MOMENTUM: 1.3,
        FactorGroup.TREND: 1.2,
        FactorGroup.VALUE: 0.7,
        FactorGroup.GROWTH: 0.8,
    },
    InvestmentHorizon.MONTH_3: {
        FactorGroup.VALUE: 1.1,
        FactorGroup.GROWTH: 1.1,
        FactorGroup.QUALITY: 1.0,
    },
    InvestmentHorizon.MONTH_6: {
        FactorGroup.VALUE: 1.2,
        FactorGroup.GROWTH: 1.2,
        FactorGroup.QUALITY: 1.1,
        FactorGroup.MOMENTUM: 0.8,
    },
    InvestmentHorizon.MONTH_12: {
        FactorGroup.VALUE: 1.3,
        FactorGroup.GROWTH: 1.3,
        FactorGroup.QUALITY: 1.2,
        FactorGroup.FINANCIAL_STRENGTH: 1.1,
        FactorGroup.MOMENTUM: 0.6,
        FactorGroup.TREND: 0.7,
    },
}

REGIME_WEIGHT_ADJUSTMENTS: Dict[MarketRegime, Dict[FactorGroup, float]] = {
    MarketRegime.STRONG_BULL: {
        FactorGroup.MOMENTUM: 1.3,
        FactorGroup.GROWTH: 1.2,
        FactorGroup.RISK: 0.7,
    },
    MarketRegime.BULL: {
        FactorGroup.MOMENTUM: 1.1,
        FactorGroup.GROWTH: 1.1,
        FactorGroup.VALUE: 0.9,
    },
    MarketRegime.SIDEWAYS: {
        FactorGroup.VALUE: 1.2,
        FactorGroup.QUALITY: 1.2,
        FactorGroup.FINANCIAL_STRENGTH: 1.1,
    },
    MarketRegime.BEAR: {
        FactorGroup.QUALITY: 1.3,
        FactorGroup.FINANCIAL_STRENGTH: 1.2,
        FactorGroup.RISK: 1.2,
        FactorGroup.MOMENTUM: 0.6,
    },
    MarketRegime.HIGH_VOLATILITY: {
        FactorGroup.RISK: 1.4,
        FactorGroup.LIQUIDITY: 1.3,
        FactorGroup.MOMENTUM: 0.7,
    },
    MarketRegime.RECOVERY: {
        FactorGroup.VALUE: 1.3,
        FactorGroup.GROWTH: 1.2,
        FactorGroup.FINANCIAL_STRENGTH: 1.1,
    },
}

TOTAL_FACTOR_COUNT: int = len(FactorName)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mean(values: List[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def score_to_strength(score: float) -> ScoreStrength:
    if score >= 80:
        return ScoreStrength.VERY_STRONG
    if score >= 60:
        return ScoreStrength.STRONG
    if score >= 40:
        return ScoreStrength.NEUTRAL
    if score >= 20:
        return ScoreStrength.WEAK
    return ScoreStrength.VERY_WEAK


def compute_weighted_score(
    scores: Dict[FactorName, float],
    weights: Dict[FactorGroup, float],
) -> float:
    if not scores:
        return 0.0
    total_weight = 0.0
    weighted_sum = 0.0
    for factor, score in scores.items():
        grp = FACTOR_GROUP_MAP.get(factor)
        w = weights.get(grp, 1.0) if grp else 1.0
        weighted_sum += score * w
        total_weight += w
    if total_weight == 0:
        return 0.0
    return _clamp(weighted_sum / total_weight)


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class FactorScore:
    factor: FactorName
    score: float
    weight: float = 1.0
    contribution: float = 0.0
    strength: ScoreStrength = ScoreStrength.NEUTRAL
    raw_value: Optional[float] = None
    normalized_value: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GroupScore:
    group: FactorGroup
    score: float
    weight: float = 1.0
    factors: List[FactorScore] = field(default_factory=list)
    strength: ScoreStrength = ScoreStrength.NEUTRAL
    rank: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class FactorProfile:
    symbol: str
    reference_date: str
    overall_score: float = 0.0
    overall_strength: ScoreStrength = ScoreStrength.NEUTRAL
    group_scores: List[GroupScore] = field(default_factory=list)
    factor_scores: List[FactorScore] = field(default_factory=list)
    radar_data: Dict[str, float] = field(default_factory=dict)
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    top_factors: List[str] = field(default_factory=list)
    bottom_factors: List[str] = field(default_factory=list)
    horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3
    regime: Optional[MarketRegime] = None
    sector: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class FactorAnalysisRequest:
    symbol: str
    reference_date: str = ""
    horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3
    regime: Optional[MarketRegime] = None
    sector: Optional[str] = None
    factors: Optional[List[FactorName]] = None
    market_data: Dict[str, Any] = field(default_factory=dict)
    financial_data: Dict[str, Any] = field(default_factory=dict)
    indicator_data: Dict[str, Any] = field(default_factory=dict)
    sector_data: Dict[str, Any] = field(default_factory=dict)
    include_history: bool = False
    include_ranking: bool = True
    include_profile: bool = True
    seed: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class FactorAnalysisResult:
    request: FactorAnalysisRequest
    profile: Optional[FactorProfile] = None
    ranking: Optional[FactorRanking] = None
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class FactorRanking:
    symbol: str
    overall_rank: int = 0
    group_ranks: Dict[str, int] = field(default_factory=dict)
    factor_ranks: Dict[str, int] = field(default_factory=dict)
    strength_factors: List[str] = field(default_factory=list)
    weakness_factors: List[str] = field(default_factory=list)
    percentile: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BenchmarkResult:
    name: str
    status: BenchmarkResultStatus = BenchmarkResultStatus.SUCCESS
    execution_time_ms: float = 0.0
    result: Any = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
