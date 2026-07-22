from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class StrategyType(str, Enum):
    EARLY_OPPORTUNITY = "early_opportunity"
    VALUE = "value"
    GROWTH = "growth"
    MOMENTUM = "momentum"
    BREAKOUT = "breakout"
    SWING = "swing"
    TREND_FOLLOWING = "trend_following"
    SMART_MONEY = "smart_money"
    DIVIDEND_GROWTH = "dividend_growth"
    LOW_RISK = "low_risk"
    HIGH_CONVICTION = "high_conviction"
    CUSTOM = "custom"


class RuleType(str, Enum):
    FINANCIAL = "financial"
    TECHNICAL = "technical"
    VOLUME = "volume"
    PATTERN = "pattern"
    SMART_MONEY = "smart_money"
    RISK = "risk"
    MARKET = "market"
    TIME = "time"
    CUSTOM = "custom"


class RuleOperator(str, Enum):
    AND = "and"
    OR = "or"
    NOT = "not"
    XOR = "xor"


class Timeframe(str, Enum):
    M5 = "5m"
    M15 = "15m"
    H1 = "1h"
    H4 = "4h"
    DAILY = "1d"
    WEEKLY = "1w"
    MONTHLY = "1m"


class SignalType(str, Enum):
    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    NEUTRAL = "NEUTRAL"
    SELL = "SELL"
    STRONG_SELL = "STRONG_SELL"
    WAIT = "WAIT"


class ComparisonOp(str, Enum):
    GT = "gt"
    GTE = "gte"
    LT = "lt"
    LTE = "lte"
    EQ = "eq"
    NEQ = "neq"
    BETWEEN = "between"
    CROSS_ABOVE = "cross_above"
    CROSS_BELOW = "cross_below"


class StrategyStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"
    ARCHIVED = "archived"


@dataclass
class RuleCondition:
    metric: str
    operator: ComparisonOp
    value: float
    value2: float | None = None
    timeframe: Timeframe = Timeframe.DAILY
    tolerance: float = 0.0


@dataclass
class RuleParameters:
    weight: float = 1.0
    priority: int = 0
    tolerance: float = 0.0
    confidence: float = 1.0
    timeframe: Timeframe = Timeframe.DAILY


@dataclass
class StrategyRule:
    name: str
    rule_type: RuleType
    conditions: list[RuleCondition] = field(default_factory=list)
    parameters: RuleParameters = field(default_factory=RuleParameters)
    enabled: bool = True
    description: str = ""


@dataclass
class RuleGroup:
    operator: RuleOperator = RuleOperator.AND
    rules: list[StrategyRule] = field(default_factory=list)
    groups: list[RuleGroup] = field(default_factory=list)
    negate: bool = False


@dataclass
class StrategyDefinition:
    name: str
    strategy_type: StrategyType
    description: str = ""
    version: str = "1.0.0"
    rule_groups: list[RuleGroup] = field(default_factory=list)
    min_confidence: float = 0.5
    max_results: int = 50
    timeframes: list[Timeframe] = field(default_factory=lambda: [Timeframe.DAILY])
    parameters: dict = field(default_factory=dict)
    status: StrategyStatus = StrategyStatus.ACTIVE
    tags: list[str] = field(default_factory=list)
    author: str = ""
    created_at: str = ""
    updated_at: str = ""


@dataclass
class RuleEvaluation:
    rule_name: str
    passed: bool
    confidence: float
    weight: float
    value: float | None = None
    expected: float | None = None
    details: str = ""


@dataclass
class GroupEvaluation:
    operator: RuleOperator
    result: bool
    evaluations: list[RuleEvaluation] = field(default_factory=list)
    group_evaluations: list[GroupEvaluation] = field(default_factory=list)


@dataclass
class StrategyResult:
    strategy_name: str
    symbol: str
    signal: SignalType
    strategy_score: float
    opportunity_score: float
    confidence: float
    risk: float
    expected_return: float = 0.0
    holding_period: str = ""
    triggered_rules: list[RuleEvaluation] = field(default_factory=list)
    failed_rules: list[RuleEvaluation] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    explanations: list[str] = field(default_factory=list)
    timestamp: str = ""
    timeframe: str = "1d"


@dataclass
class RankedStock:
    symbol: str
    strategy_score: float
    opportunity_score: float
    confidence: float
    risk: float
    signal: SignalType
    strategy_name: str


@dataclass
class StrategyMetadata:
    name: str
    strategy_type: StrategyType
    description: str
    version: str
    author: str
    status: StrategyStatus
    rule_count: int
    tags: list[str] = field(default_factory=list)


@dataclass
class BenchmarkResult:
    strategy_name: str
    iterations: int
    total_seconds: float
    avg_ms: float
    ops_per_second: float
