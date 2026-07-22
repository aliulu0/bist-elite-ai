from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyRule,
    RuleType,
    RuleCondition,
    RuleParameters,
    ComparisonOp,
)


class VolumeRules:

    @staticmethod
    def volume_spike(multiplier: float = 2.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="volume_spike",
            rule_type=RuleType.VOLUME,
            description=f"Volume above {multiplier}x average",
            conditions=[
                RuleCondition(metric="volume_ratio", operator=ComparisonOp.GT, value=multiplier),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def obv_bullish(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="obv_bullish",
            rule_type=RuleType.VOLUME,
            description="OBV trending upward",
            conditions=[
                RuleCondition(metric="obv_trend", operator=ComparisonOp.GT, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def cmf_bullish(threshold: float = 0.05, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="cmf_bullish",
            rule_type=RuleType.VOLUME,
            description=f"CMF above {threshold} (accumulation)",
            conditions=[
                RuleCondition(metric="cmf", operator=ComparisonOp.GT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def cmf_bearish(threshold: float = -0.05, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="cmf_bearish",
            rule_type=RuleType.VOLUME,
            description=f"CMF below {threshold} (distribution)",
            conditions=[
                RuleCondition(metric="cmf", operator=ComparisonOp.LT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def mfi_oversold(threshold: float = 20.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="mfi_oversold",
            rule_type=RuleType.VOLUME,
            description=f"MFI below {threshold} (oversold)",
            conditions=[
                RuleCondition(metric="mfi", operator=ComparisonOp.LT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def mfi_overbought(threshold: float = 80.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="mfi_overbought",
            rule_type=RuleType.VOLUME,
            description=f"MFI above {threshold} (overbought)",
            conditions=[
                RuleCondition(metric="mfi", operator=ComparisonOp.GT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def relative_volume(min_ratio: float = 1.5, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="relative_volume",
            rule_type=RuleType.VOLUME,
            description=f"Relative volume above {min_ratio}x",
            conditions=[
                RuleCondition(metric="relative_volume", operator=ComparisonOp.GT, value=min_ratio),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def vwap_support(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="vwap_support",
            rule_type=RuleType.VOLUME,
            description="Price above VWAP",
            conditions=[
                RuleCondition(metric="close", operator=ComparisonOp.GT, value=0),
                RuleCondition(metric="vwap", operator=ComparisonOp.LT, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def negative_volume_index_rising(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="nvi_rising",
            rule_type=RuleType.VOLUME,
            description="Negative Volume Index rising",
            conditions=[
                RuleCondition(metric="nvi_trend", operator=ComparisonOp.GT, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )
