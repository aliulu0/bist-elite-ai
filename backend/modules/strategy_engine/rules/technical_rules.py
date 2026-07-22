from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyRule,
    RuleType,
    RuleCondition,
    RuleParameters,
    ComparisonOp,
    Timeframe,
)


class TechnicalRules:

    @staticmethod
    def rsi_oversold(threshold: float = 30.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="rsi_oversold",
            rule_type=RuleType.TECHNICAL,
            description=f"RSI below {threshold} (oversold)",
            conditions=[
                RuleCondition(metric="rsi", operator=ComparisonOp.LT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def rsi_overbought(threshold: float = 70.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="rsi_overbought",
            rule_type=RuleType.TECHNICAL,
            description=f"RSI above {threshold} (overbought)",
            conditions=[
                RuleCondition(metric="rsi", operator=ComparisonOp.GT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def macd_bullish(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="macd_bullish",
            rule_type=RuleType.TECHNICAL,
            description="MACD above signal line",
            conditions=[
                RuleCondition(metric="macd", operator=ComparisonOp.CROSS_ABOVE, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def macd_above_zero(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="macd_above_zero",
            rule_type=RuleType.TECHNICAL,
            description="MACD above zero",
            conditions=[
                RuleCondition(metric="macd", operator=ComparisonOp.GT, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def price_above_sma(period: int = 200, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name=f"price_above_sma_{period}",
            rule_type=RuleType.TECHNICAL,
            description=f"Price above {period}-SMA",
            conditions=[
                RuleCondition(metric=f"sma_{period}", operator=ComparisonOp.GT, value=0),
                RuleCondition(metric="close", operator=ComparisonOp.GT, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def price_below_sma(period: int = 200, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name=f"price_below_sma_{period}",
            rule_type=RuleType.TECHNICAL,
            description=f"Price below {period}-SMA",
            conditions=[
                RuleCondition(metric=f"sma_{period}", operator=ComparisonOp.LT, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def golden_cross(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="golden_cross",
            rule_type=RuleType.TECHNICAL,
            description="50-SMA crossed above 200-SMA",
            conditions=[
                RuleCondition(metric="sma_50", operator=ComparisonOp.CROSS_ABOVE, value=200),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def bollinger_lower_bounce(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="bollinger_lower_bounce",
            rule_type=RuleType.TECHNICAL,
            description="Price bouncing from lower Bollinger Band",
            conditions=[
                RuleCondition(metric="close", operator=ComparisonOp.GT, value=0),
                RuleCondition(metric="bb_lower", operator=ComparisonOp.LT, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def atr_breakout(atr_multiplier: float = 2.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="atr_breakout",
            rule_type=RuleType.TECHNICAL,
            description=f"Price broke above ATR channel ({atr_multiplier}x)",
            conditions=[
                RuleCondition(metric="close", operator=ComparisonOp.GT, value=0),
                RuleCondition(metric="atr_upper", operator=ComparisonOp.GT, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def adx_strong_trend(threshold: float = 25.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="adx_strong_trend",
            rule_type=RuleType.TECHNICAL,
            description=f"ADX above {threshold} (strong trend)",
            conditions=[
                RuleCondition(metric="adx", operator=ComparisonOp.GT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def stochastic_oversold(threshold: float = 20.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="stochastic_oversold",
            rule_type=RuleType.TECHNICAL,
            description=f"Stochastic below {threshold}",
            conditions=[
                RuleCondition(metric="stochastic_k", operator=ComparisonOp.LT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def stochastic_overbought(threshold: float = 80.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="stochastic_overbought",
            rule_type=RuleType.TECHNICAL,
            description=f"Stochastic above {threshold}",
            conditions=[
                RuleCondition(metric="stochastic_k", operator=ComparisonOp.GT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def cci_oversold(threshold: float = -100.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="cci_oversold",
            rule_type=RuleType.TECHNICAL,
            description=f"CCI below {threshold}",
            conditions=[
                RuleCondition(metric="cci", operator=ComparisonOp.LT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def williams_oversold(threshold: float = -80.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="williams_oversold",
            rule_type=RuleType.TECHNICAL,
            description=f"Williams %R below {threshold}",
            conditions=[
                RuleCondition(metric="williams_r", operator=ComparisonOp.LT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def momentum_positive(weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="momentum_positive",
            rule_type=RuleType.TECHNICAL,
            description="Momentum indicator positive",
            conditions=[
                RuleCondition(metric="momentum", operator=ComparisonOp.GT, value=0),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )
