import pytest
from modules.strategy_engine.core.types import (
    StrategyDefinition,
    StrategyResult,
    StrategyRule,
    RuleGroup,
    RuleCondition,
    RuleOperator,
    RuleType,
    RuleParameters,
    ComparisonOp,
    SignalType,
    StrategyType,
    StrategyStatus,
    Timeframe,
    RuleEvaluation,
    GroupEvaluation,
    RankedStock,
    StrategyMetadata,
)


def _value_metrics() -> dict:
    return {
        "pe_ratio": 10.0,
        "pb_ratio": 1.2,
        "roe": 20.0,
        "roa": 8.0,
        "debt_to_equity": 0.5,
        "dividend_yield": 3.0,
        "earnings_growth": 25.0,
        "revenue_growth": 15.0,
        "current_ratio": 2.0,
        "net_margin": 12.0,
        "price_to_sales": 1.5,
        "peg_ratio": 0.8,
        "free_cash_flow": 500000,
    }


def _technical_metrics() -> dict:
    return {
        "rsi": 25.0,
        "rsi_prev": 30.0,
        "macd": 0.5,
        "macd_prev": -0.2,
        "adx": 35.0,
        "stochastic_k": 15.0,
        "cci": -150.0,
        "williams_r": -85.0,
        "momentum": 5.0,
        "close": 100.0,
        "bb_lower": 95.0,
        "atr_upper": 105.0,
        "sma_50": 98.0,
        "sma_50_prev": 97.0,
        "sma_200": 90.0,
        "sma_200_prev": 89.0,
        "close_prev": 98.0,
    }


def _volume_metrics() -> dict:
    return {
        "volume_ratio": 2.5,
        "obv_trend": 1.0,
        "cmf": 0.1,
        "mfi": 15.0,
        "relative_volume": 2.0,
        "vwap": 98.0,
        "nvi_trend": 1.0,
    }


def _smc_metrics() -> dict:
    return {
        "order_block": 1,
        "breaker_block": 1,
        "fair_value_gap": 1,
        "liquidity_sweep": 1,
        "bos_bullish": 1,
        "choc_bullish": 1,
        "in_discount_zone": 1,
        "mitigation_block": 1,
        "equal_lows": 1,
    }


def _pattern_metrics() -> dict:
    return {
        "classical_pattern_score": 0.8,
        "candlestick_bullish_score": 0.7,
        "candlestick_bearish_score": 0.3,
        "double_bottom": 1,
        "double_top": 0,
        "cup_handle": 0,
        "ascending_triangle": 0,
        "bull_flag": 1,
        "hammer": 1,
        "bullish_engulfing": 1,
        "morning_star": 0,
    }


def _risk_metrics() -> dict:
    return {
        "max_drawdown": 10.0,
        "volatility": 15.0,
        "sharpe_ratio": 1.5,
        "beta": 1.0,
        "var_95": 3.0,
        "sortino_ratio": 2.0,
    }


def _market_metrics() -> dict:
    return {
        "sector_relative_strength": 8.0,
        "market_cap": 5e9,
        "price_vs_sma200": 1.0,
        "price_vs_sma50": 1.0,
        "relative_strength": 1.5,
        "avg_volume": 500000,
    }


def _time_metrics() -> dict:
    return {
        "hour": 14,
        "days_held": 10,
        "day_of_month": 15,
        "day_of_week": 2,
    }


def _all_metrics() -> dict:
    m = {}
    m.update(_value_metrics())
    m.update(_technical_metrics())
    m.update(_volume_metrics())
    m.update(_smc_metrics())
    m.update(_pattern_metrics())
    m.update(_risk_metrics())
    m.update(_market_metrics())
    m.update(_time_metrics())
    return m


def _simple_rule(
    name: str = "test_rule",
    metric: str = "pe_ratio",
    op: ComparisonOp = ComparisonOp.LT,
    value: float = 15.0,
    weight: float = 1.0,
    enabled: bool = True,
) -> StrategyRule:
    return StrategyRule(
        name=name,
        rule_type=RuleType.CUSTOM,
        conditions=[RuleCondition(metric=metric, operator=op, value=value)],
        parameters=RuleParameters(weight=weight),
        enabled=enabled,
    )


def _simple_group(
    *rules: StrategyRule,
    operator: RuleOperator = RuleOperator.AND,
) -> RuleGroup:
    return RuleGroup(operator=operator, rules=list(rules))


def _simple_definition(
    name: str = "Test Strategy",
    groups: list[RuleGroup] | None = None,
    min_confidence: float = 0.5,
) -> StrategyDefinition:
    if groups is None:
        groups = [_simple_group(_simple_rule())]
    return StrategyDefinition(
        name=name,
        strategy_type=StrategyType.CUSTOM,
        description="Test strategy",
        rule_groups=groups,
        min_confidence=min_confidence,
    )
