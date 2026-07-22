import pytest
from modules.strategy_engine.validators.strategy_validator import StrategyValidator
from modules.strategy_engine.core.types import (
    StrategyDefinition,
    StrategyType,
    StrategyStatus,
    Timeframe,
    RuleGroup,
    RuleOperator,
    StrategyRule,
    RuleType,
    RuleCondition,
    ComparisonOp,
    RuleParameters,
)


class TestStrategyValidator:
    def _valid_definition(self) -> StrategyDefinition:
        return StrategyDefinition(
            name="Valid Strategy",
            strategy_type=StrategyType.VALUE,
            min_confidence=0.5,
            max_results=25,
            timeframes=[Timeframe.DAILY],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        StrategyRule(
                            name="test_rule",
                            rule_type=RuleType.FINANCIAL,
                            conditions=[
                                RuleCondition(metric="pe_ratio", operator=ComparisonOp.LT, value=15.0),
                            ],
                            parameters=RuleParameters(weight=1.0, confidence=0.8),
                        ),
                    ],
                ),
            ],
        )

    def test_valid_definition(self):
        defn = self._valid_definition()
        errors = StrategyValidator.validate_definition(defn)
        assert len(errors) == 0

    def test_empty_name(self):
        defn = self._valid_definition()
        defn.name = ""
        errors = StrategyValidator.validate_definition(defn)
        assert len(errors) > 0
        assert any("name" in e.lower() for e in errors)

    def test_invalid_confidence(self):
        defn = self._valid_definition()
        defn.min_confidence = 1.5
        errors = StrategyValidator.validate_definition(defn)
        assert any("confidence" in e.lower() for e in errors)

    def test_negative_confidence(self):
        defn = self._valid_definition()
        defn.min_confidence = -0.5
        errors = StrategyValidator.validate_definition(defn)
        assert any("confidence" in e.lower() for e in errors)

    def test_invalid_max_results(self):
        defn = self._valid_definition()
        defn.max_results = 0
        errors = StrategyValidator.validate_definition(defn)
        assert any("max_results" in e.lower() for e in errors)

    def test_no_timeframes(self):
        defn = self._valid_definition()
        defn.timeframes = []
        errors = StrategyValidator.validate_definition(defn)
        assert any("timeframe" in e.lower() for e in errors)

    def test_empty_group(self):
        defn = self._valid_definition()
        defn.rule_groups = [RuleGroup(operator=RuleOperator.AND)]
        errors = StrategyValidator.validate_definition(defn)
        assert any("empty" in e.lower() for e in errors)

    def test_rule_no_name(self):
        defn = self._valid_definition()
        defn.rule_groups[0].rules[0].name = ""
        errors = StrategyValidator.validate_definition(defn)
        assert any("rule name" in e.lower() for e in errors)

    def test_rule_negative_weight(self):
        defn = self._valid_definition()
        defn.rule_groups[0].rules[0].parameters.weight = -1.0
        errors = StrategyValidator.validate_definition(defn)
        assert any("weight" in e.lower() for e in errors)

    def test_rule_invalid_confidence(self):
        defn = self._valid_definition()
        defn.rule_groups[0].rules[0].parameters.confidence = 2.0
        errors = StrategyValidator.validate_definition(defn)
        assert any("confidence" in e.lower() for e in errors)

    def test_condition_no_metric(self):
        defn = self._valid_definition()
        defn.rule_groups[0].rules[0].conditions[0].metric = ""
        errors = StrategyValidator.validate_definition(defn)
        assert any("metric" in e.lower() for e in errors)

    def test_between_requires_value2(self):
        defn = self._valid_definition()
        defn.rule_groups[0].rules[0].conditions[0] = RuleCondition(
            metric="beta",
            operator=ComparisonOp.BETWEEN,
            value=0.5,
            value2=None,
        )
        errors = StrategyValidator.validate_definition(defn)
        assert any("value2" in e.lower() for e in errors)

    def test_validate_metrics_missing(self):
        defn = self._valid_definition()
        errors = StrategyValidator.validate_metrics(defn, {})
        assert len(errors) > 0
        assert "missing" in errors[0].lower()

    def test_validate_metrics_present(self):
        defn = self._valid_definition()
        errors = StrategyValidator.validate_metrics(defn, {"pe_ratio": 10.0})
        assert len(errors) == 0

    def test_validate_for_execution_active(self):
        defn = self._valid_definition()
        errors = StrategyValidator.validate_for_execution(defn)
        assert len(errors) == 0

    def test_validate_for_execution_inactive(self):
        defn = self._valid_definition()
        defn.status = StrategyStatus.INACTIVE
        errors = StrategyValidator.validate_for_execution(defn)
        assert any("inactive" in e.lower() for e in errors)
