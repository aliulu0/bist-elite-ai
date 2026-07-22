import pytest
from modules.strategy_engine.core.types import (
    StrategyType,
    RuleType,
    RuleOperator,
    Timeframe,
    SignalType,
    ComparisonOp,
    StrategyStatus,
    StrategyDefinition,
    StrategyResult,
    StrategyRule,
    RuleGroup,
    RuleCondition,
    RuleParameters,
    RuleEvaluation,
    GroupEvaluation,
    RankedStock,
    StrategyMetadata,
)


class TestEnums:
    def test_strategy_type_values(self):
        assert StrategyType.EARLY_OPPORTUNITY == "early_opportunity"
        assert StrategyType.VALUE == "value"
        assert StrategyType.GROWTH == "growth"
        assert StrategyType.MOMENTUM == "momentum"
        assert StrategyType.BREAKOUT == "breakout"
        assert StrategyType.SWING == "swing"
        assert StrategyType.TREND_FOLLOWING == "trend_following"
        assert StrategyType.SMART_MONEY == "smart_money"
        assert StrategyType.DIVIDEND_GROWTH == "dividend_growth"
        assert StrategyType.LOW_RISK == "low_risk"
        assert StrategyType.HIGH_CONVICTION == "high_conviction"
        assert StrategyType.CUSTOM == "custom"

    def test_rule_type_values(self):
        assert RuleType.FINANCIAL == "financial"
        assert RuleType.TECHNICAL == "technical"
        assert RuleType.VOLUME == "volume"
        assert RuleType.PATTERN == "pattern"
        assert RuleType.SMART_MONEY == "smart_money"
        assert RuleType.RISK == "risk"
        assert RuleType.MARKET == "market"
        assert RuleType.TIME == "time"
        assert RuleType.CUSTOM == "custom"

    def test_rule_operator_values(self):
        assert RuleOperator.AND == "and"
        assert RuleOperator.OR == "or"
        assert RuleOperator.NOT == "not"
        assert RuleOperator.XOR == "xor"

    def test_timeframe_values(self):
        assert Timeframe.M5 == "5m"
        assert Timeframe.M15 == "15m"
        assert Timeframe.H1 == "1h"
        assert Timeframe.H4 == "4h"
        assert Timeframe.DAILY == "1d"
        assert Timeframe.WEEKLY == "1w"
        assert Timeframe.MONTHLY == "1m"

    def test_signal_type_values(self):
        assert SignalType.STRONG_BUY == "STRONG_BUY"
        assert SignalType.BUY == "BUY"
        assert SignalType.NEUTRAL == "NEUTRAL"
        assert SignalType.SELL == "SELL"
        assert SignalType.STRONG_SELL == "STRONG_SELL"
        assert SignalType.WAIT == "WAIT"

    def test_comparison_op_values(self):
        assert ComparisonOp.GT == "gt"
        assert ComparisonOp.GTE == "gte"
        assert ComparisonOp.LT == "lt"
        assert ComparisonOp.LTE == "lte"
        assert ComparisonOp.EQ == "eq"
        assert ComparisonOp.NEQ == "neq"
        assert ComparisonOp.BETWEEN == "between"
        assert ComparisonOp.CROSS_ABOVE == "cross_above"
        assert ComparisonOp.CROSS_BELOW == "cross_below"

    def test_strategy_status_values(self):
        assert StrategyStatus.ACTIVE == "active"
        assert StrategyStatus.INACTIVE == "inactive"
        assert StrategyStatus.DRAFT == "draft"
        assert StrategyStatus.ARCHIVED == "archived"


class TestRuleCondition:
    def test_creation(self):
        cond = RuleCondition(metric="pe_ratio", operator=ComparisonOp.LT, value=15.0)
        assert cond.metric == "pe_ratio"
        assert cond.operator == ComparisonOp.LT
        assert cond.value == 15.0
        assert cond.value2 is None
        assert cond.tolerance == 0.0

    def test_between(self):
        cond = RuleCondition(metric="beta", operator=ComparisonOp.BETWEEN, value=0.5, value2=1.5)
        assert cond.value2 == 1.5


class TestStrategyRule:
    def test_creation(self):
        rule = StrategyRule(name="test", rule_type=RuleType.FINANCIAL)
        assert rule.name == "test"
        assert rule.enabled is True
        assert len(rule.conditions) == 0

    def test_with_parameters(self):
        params = RuleParameters(weight=2.0, priority=3, confidence=0.9)
        rule = StrategyRule(name="test", rule_type=RuleType.TECHNICAL, parameters=params)
        assert rule.parameters.weight == 2.0
        assert rule.parameters.priority == 3


class TestRuleGroup:
    def test_creation(self):
        group = RuleGroup(operator=RuleOperator.AND)
        assert group.operator == RuleOperator.AND
        assert len(group.rules) == 0
        assert len(group.groups) == 0

    def test_nested(self):
        inner = RuleGroup(operator=RuleOperator.OR, rules=[
            StrategyRule(name="r1", rule_type=RuleType.CUSTOM),
        ])
        outer = RuleGroup(operator=RuleOperator.AND, groups=[inner])
        assert len(outer.groups) == 1
        assert outer.groups[0].operator == RuleOperator.OR


class TestStrategyDefinition:
    def test_creation(self):
        defn = StrategyDefinition(name="Test", strategy_type=StrategyType.VALUE)
        assert defn.name == "Test"
        assert defn.min_confidence == 0.5
        assert defn.max_results == 50
        assert defn.status == StrategyStatus.ACTIVE

    def test_custom_fields(self):
        defn = StrategyDefinition(
            name="Custom",
            strategy_type=StrategyType.MOMENTUM,
            min_confidence=0.8,
            max_results=10,
            timeframes=[Timeframe.DAILY, Timeframe.WEEKLY],
            tags=["test"],
        )
        assert defn.min_confidence == 0.8
        assert len(defn.timeframes) == 2
        assert "test" in defn.tags
