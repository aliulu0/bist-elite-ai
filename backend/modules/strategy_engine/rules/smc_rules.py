from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyRule,
    RuleType,
    RuleCondition,
    RuleParameters,
    ComparisonOp,
)


class SmartMoneyRules:

    @staticmethod
    def order_block_detected(weight: float = 1.5) -> StrategyRule:
        return StrategyRule(
            name="order_block",
            rule_type=RuleType.SMART_MONEY,
            description="Order block detected",
            conditions=[
                RuleCondition(metric="order_block", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def breaker_block_detected(weight: float = 1.5) -> StrategyRule:
        return StrategyRule(
            name="breaker_block",
            rule_type=RuleType.SMART_MONEY,
            description="Breaker block detected",
            conditions=[
                RuleCondition(metric="breaker_block", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def fair_value_gap(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="fair_value_gap",
            rule_type=RuleType.SMART_MONEY,
            description="Fair value gap detected",
            conditions=[
                RuleCondition(metric="fair_value_gap", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def liquidity_sweep(weight: float = 1.5) -> StrategyRule:
        return StrategyRule(
            name="liquidity_sweep",
            rule_type=RuleType.SMART_MONEY,
            description="Liquidity sweep detected",
            conditions=[
                RuleCondition(metric="liquidity_sweep", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def break_of_structure_bullish(weight: float = 1.5) -> StrategyRule:
        return StrategyRule(
            name="bos_bullish",
            rule_type=RuleType.SMART_MONEY,
            description="Bullish break of structure",
            conditions=[
                RuleCondition(metric="bos_bullish", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def change_of_character_bullish(weight: float = 1.5) -> StrategyRule:
        return StrategyRule(
            name="choc_bullish",
            rule_type=RuleType.SMART_MONEY,
            description="Bullish change of character",
            conditions=[
                RuleCondition(metric="choc_bullish", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def in_discount_zone(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="discount_zone",
            rule_type=RuleType.SMART_MONEY,
            description="Price in discount zone",
            conditions=[
                RuleCondition(metric="in_discount_zone", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def mitigation_block(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="mitigation_block",
            rule_type=RuleType.SMART_MONEY,
            description="Mitigation block detected",
            conditions=[
                RuleCondition(metric="mitigation_block", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def equal_lows_sweep(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="equal_lows_sweep",
            rule_type=RuleType.SMART_MONEY,
            description="Equal lows liquidity sweep",
            conditions=[
                RuleCondition(metric="equal_lows", operator=ComparisonOp.GTE, value=1),
                RuleCondition(metric="liquidity_sweep", operator=ComparisonOp.GTE, value=1),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )
