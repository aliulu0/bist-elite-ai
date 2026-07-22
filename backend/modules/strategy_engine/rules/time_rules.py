from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyRule,
    RuleType,
    RuleCondition,
    RuleParameters,
    ComparisonOp,
)


class TimeRules:

    @staticmethod
    def trading_hours_only(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="trading_hours",
            rule_type=RuleType.TIME,
            description="Only generate signals during trading hours",
            conditions=[
                RuleCondition(metric="hour", operator=ComparisonOp.BETWEEN, value=9, value2=18),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def minimum_holding_days(min_days: int = 5, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="min_holding_days",
            rule_type=RuleType.TIME,
            description=f"Minimum holding period of {min_days} days",
            conditions=[
                RuleCondition(metric="days_held", operator=ComparisonOp.GTE, value=min_days),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def maximum_holding_days(max_days: int = 30, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="max_holding_days",
            rule_type=RuleType.TIME,
            description=f"Maximum holding period of {max_days} days",
            conditions=[
                RuleCondition(metric="days_held", operator=ComparisonOp.LTE, value=max_days),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def not_month_end(days_before: int = 2, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="not_month_end",
            rule_type=RuleType.TIME,
            description=f"Avoid last {days_before} trading days of month",
            conditions=[
                RuleCondition(metric="day_of_month", operator=ComparisonOp.LT, value=29 - days_before),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def not_weekend(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="not_weekend",
            rule_type=RuleType.TIME,
            description="Not Saturday or Sunday",
            conditions=[
                RuleCondition(metric="day_of_week", operator=ComparisonOp.LT, value=5),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )
