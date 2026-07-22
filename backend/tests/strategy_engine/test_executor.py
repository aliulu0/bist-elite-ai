import pytest
from modules.strategy_engine.executors.strategy_executor import StrategyExecutor
from modules.strategy_engine.core.types import (
    StrategyDefinition,
    StrategyType,
    SignalType,
    Timeframe,
    RuleGroup,
    RuleOperator,
    StrategyRule,
    RuleType,
    RuleCondition,
    RuleParameters,
    ComparisonOp,
)
from tests.strategy_engine.conftest import (
    _simple_rule,
    _simple_group,
    _simple_definition,
    _all_metrics,
    _value_metrics,
    _technical_metrics,
)


class TestStrategyExecutor:
    def setup_method(self):
        self.executor = StrategyExecutor()

    def test_execute_basic(self):
        defn = _simple_definition(
            groups=[_simple_group(_simple_rule("pe", "pe_ratio", ComparisonOp.LT, 20.0))],
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert result.symbol == "THYAO"
        assert result.strategy_name == "Test Strategy"
        assert isinstance(result.signal, SignalType)
        assert 0.0 <= result.strategy_score <= 1.0
        assert 0.0 <= result.confidence <= 1.0

    def test_execute_strong_signal(self):
        defn = _simple_definition(
            groups=[_simple_group(
                _simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0),
                _simple_rule("r2", "roe", ComparisonOp.GT, 15.0),
            )],
            min_confidence=0.3,
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert result.signal in (SignalType.STRONG_BUY, SignalType.BUY)

    def test_execute_weak_signal(self):
        defn = _simple_definition(
            groups=[_simple_group(
                _simple_rule("r1", "pe_ratio", ComparisonOp.GT, 100.0),
                _simple_rule("r2", "roe", ComparisonOp.LT, 1.0),
            )],
            min_confidence=0.0,
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert result.signal in (SignalType.SELL, SignalType.STRONG_SELL, SignalType.NEUTRAL)

    def test_execute_wait_signal(self):
        low_conf_rule = StrategyRule(
            name="pe",
            rule_type=RuleType.CUSTOM,
            conditions=[RuleCondition(metric="pe_ratio", operator=ComparisonOp.LT, value=20.0)],
            parameters=RuleParameters(weight=1.0, confidence=0.5),
        )
        defn = _simple_definition(
            groups=[_simple_group(low_conf_rule)],
            min_confidence=0.99,
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert result.signal == SignalType.WAIT

    def test_execute_triggers_rules(self):
        defn = _simple_definition(
            groups=[_simple_group(_simple_rule("pe", "pe_ratio", ComparisonOp.LT, 20.0))],
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert len(result.triggered_rules) >= 1
        assert len(result.failed_rules) == 0

    def test_execute_fails_rules(self):
        defn = _simple_definition(
            groups=[_simple_group(_simple_rule("pe", "pe_ratio", ComparisonOp.GT, 100.0))],
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert len(result.failed_rules) >= 1

    def test_execute_generates_explanations(self):
        defn = _simple_definition(
            groups=[_simple_group(_simple_rule("pe", "pe_ratio", ComparisonOp.LT, 20.0))],
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert len(result.explanations) > 0

    def test_execute_multiple_groups(self):
        defn = StrategyDefinition(
            name="Multi",
            strategy_type=StrategyType.CUSTOM,
            rule_groups=[
                _simple_group(_simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0)),
                _simple_group(_simple_rule("r2", "roe", ComparisonOp.GT, 15.0)),
            ],
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert len(result.triggered_rules) == 2

    def test_execute_nested_groups(self):
        inner = RuleGroup(
            operator=RuleOperator.AND,
            rules=[_simple_rule("r2", "roe", ComparisonOp.GT, 15.0)],
        )
        outer = RuleGroup(
            operator=RuleOperator.AND,
            rules=[_simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0)],
            groups=[inner],
        )
        defn = StrategyDefinition(
            name="Nested",
            strategy_type=StrategyType.CUSTOM,
            rule_groups=[outer],
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert len(result.triggered_rules) == 2

    def test_execute_risk_warnings(self):
        defn = _simple_definition(
            groups=[_simple_group(
                StrategyRule(
                    name="max_drawdown",
                    rule_type=RuleType.RISK,
                    conditions=[RuleCondition(metric="max_drawdown", operator=ComparisonOp.LT, value=5.0)],
                ),
            )],
            min_confidence=0.1,
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert any("Risk rule" in w for w in result.warnings)

    def test_execute_batch(self):
        defn = _simple_definition(
            groups=[_simple_group(_simple_rule("pe", "pe_ratio", ComparisonOp.LT, 20.0))],
        )
        symbols = ["THYAO", "GARAN", "ASELS"]
        metrics_map = {
            "THYAO": _all_metrics(),
            "GARAN": _all_metrics(),
            "ASELS": _all_metrics(),
        }
        results = self.executor.execute_batch(defn, symbols, metrics_map)
        assert len(results) == 3

    def test_execute_batch_missing_metrics(self):
        defn = _simple_definition()
        results = self.executor.execute_batch(
            defn, ["THYAO", "MISSING"], {"THYAO": _all_metrics()},
        )
        assert len(results) == 1

    def test_opportunity_score(self):
        defn = _simple_definition(
            groups=[_simple_group(_simple_rule("pe", "pe_ratio", ComparisonOp.LT, 20.0))],
            min_confidence=0.1,
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert 0.0 <= result.opportunity_score <= 1.0

    def test_execute_with_timeframe(self):
        defn = _simple_definition()
        defn.timeframes = [Timeframe.DAILY, Timeframe.WEEKLY]
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert result.timeframe == "1d"

    def test_execute_empty_groups(self):
        defn = StrategyDefinition(
            name="Empty",
            strategy_type=StrategyType.CUSTOM,
            rule_groups=[],
        )
        result = self.executor.execute(defn, "THYAO", {})
        assert result.signal in (SignalType.WAIT, SignalType.NEUTRAL)


class TestStrategyExecutorScoring:
    def setup_method(self):
        self.executor = StrategyExecutor()

    def test_confidence_range(self):
        defn = _simple_definition(
            groups=[_simple_group(
                _simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0),
                _simple_rule("r2", "roe", ComparisonOp.GT, 15.0),
            )],
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert 0.0 <= result.confidence <= 1.0

    def test_risk_range(self):
        defn = _simple_definition(
            groups=[_simple_group(_simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0))],
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert 0.0 <= result.risk <= 1.0

    def test_score_range(self):
        defn = _simple_definition(
            groups=[_simple_group(_simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0))],
        )
        result = self.executor.execute(defn, "THYAO", _all_metrics())
        assert 0.0 <= result.strategy_score <= 1.0
