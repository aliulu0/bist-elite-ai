from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyRule,
    RuleType,
    RuleCondition,
    RuleParameters,
    ComparisonOp,
)


class MarketRules:

    @staticmethod
    def sector_outperformance(min_pct: float = 5.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="sector_outperformance",
            rule_type=RuleType.MARKET,
            description=f"Sector outperforming by {min_pct}%",
            conditions=[
                RuleCondition(metric="sector_relative_strength", operator=ComparisonOp.GT, value=min_pct),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def market_cap_above(min_cap: float = 1e9, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="market_cap_above",
            rule_type=RuleType.MARKET,
            description=f"Market cap above {min_cap:,.0f}",
            conditions=[
                RuleCondition(metric="market_cap", operator=ComparisonOp.GT, value=min_cap),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def market_cap_below(max_cap: float = 1e9, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="market_cap_below",
            rule_type=RuleType.MARKET,
            description=f"Market cap below {max_cap:,.0f}",
            conditions=[
                RuleCondition(metric="market_cap", operator=ComparisonOp.LT, value=max_cap),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def above_200_sma(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="above_200_sma",
            rule_type=RuleType.MARKET,
            description="Price above 200-day SMA (long-term uptrend)",
            conditions=[
                RuleCondition(metric="price_vs_sma200", operator=ComparisonOp.GT, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def above_50_sma(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="above_50_sma",
            rule_type=RuleType.MARKET,
            description="Price above 50-day SMA (medium-term uptrend)",
            conditions=[
                RuleCondition(metric="price_vs_sma50", operator=ComparisonOp.GT, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def relative_strength(min_rs: float = 1.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="relative_strength",
            rule_type=RuleType.MARKET,
            description=f"Relative strength above {min_rs}",
            conditions=[
                RuleCondition(metric="relative_strength", operator=ComparisonOp.GT, value=min_rs),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def average_volume(min_volume: float = 100000, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="average_volume",
            rule_type=RuleType.MARKET,
            description=f"Average volume above {min_volume:,.0f}",
            conditions=[
                RuleCondition(metric="avg_volume", operator=ComparisonOp.GT, value=min_volume),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )
