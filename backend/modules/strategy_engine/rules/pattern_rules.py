from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyRule,
    RuleType,
    RuleCondition,
    RuleParameters,
    ComparisonOp,
)


class PatternRules:

    @staticmethod
    def classical_pattern_detected(min_score: float = 0.6, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="classical_pattern",
            rule_type=RuleType.PATTERN,
            description=f"Classical pattern detected (score >= {min_score})",
            conditions=[
                RuleCondition(metric="classical_pattern_score", operator=ComparisonOp.GTE, value=min_score),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def candlestick_bullish(min_score: float = 0.6, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="candlestick_bullish",
            rule_type=RuleType.PATTERN,
            description=f"Bullish candlestick pattern (score >= {min_score})",
            conditions=[
                RuleCondition(metric="candlestick_bullish_score", operator=ComparisonOp.GTE, value=min_score),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def candlestick_bearish(min_score: float = 0.6, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="candlestick_bearish",
            rule_type=RuleType.PATTERN,
            description=f"Bearish candlestick pattern (score >= {min_score})",
            conditions=[
                RuleCondition(metric="candlestick_bearish_score", operator=ComparisonOp.GTE, value=min_score),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def double_bottom(weight: float = 1.5) -> StrategyRule:
        return StrategyRule(
            name="double_bottom",
            rule_type=RuleType.PATTERN,
            description="Double bottom pattern detected",
            conditions=[
                RuleCondition(metric="double_bottom", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def double_top(weight: float = 1.5) -> StrategyRule:
        return StrategyRule(
            name="double_top",
            rule_type=RuleType.PATTERN,
            description="Double top pattern detected",
            conditions=[
                RuleCondition(metric="double_top", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def cup_handle(weight: float = 1.5) -> StrategyRule:
        return StrategyRule(
            name="cup_handle",
            rule_type=RuleType.PATTERN,
            description="Cup and handle pattern detected",
            conditions=[
                RuleCondition(metric="cup_handle", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def ascending_triangle(weight: float = 1.5) -> StrategyRule:
        return StrategyRule(
            name="ascending_triangle",
            rule_type=RuleType.PATTERN,
            description="Ascending triangle pattern detected",
            conditions=[
                RuleCondition(metric="ascending_triangle", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def bull_flag(weight: float = 1.5) -> StrategyRule:
        return StrategyRule(
            name="bull_flag",
            rule_type=RuleType.PATTERN,
            description="Bull flag pattern detected",
            conditions=[
                RuleCondition(metric="bull_flag", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def hammer_candlestick(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="hammer_candlestick",
            rule_type=RuleType.PATTERN,
            description="Hammer candlestick detected",
            conditions=[
                RuleCondition(metric="hammer", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def engulfing_bullish(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="engulfing_bullish",
            rule_type=RuleType.PATTERN,
            description="Bullish engulfing pattern detected",
            conditions=[
                RuleCondition(metric="bullish_engulfing", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def morning_star(weight: float = 1.5) -> StrategyRule:
        return StrategyRule(
            name="morning_star",
            rule_type=RuleType.PATTERN,
            description="Morning star pattern detected",
            conditions=[
                RuleCondition(metric="morning_star", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )
