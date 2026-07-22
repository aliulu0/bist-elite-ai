import pytest
from modules.strategy_engine.rules.rule_engine import RuleEngine
from modules.strategy_engine.core.types import (
    RuleCondition,
    ComparisonOp,
    StrategyRule,
    RuleType,
    RuleParameters,
    RuleGroup,
    RuleOperator,
    RuleEvaluation,
    GroupEvaluation,
)
from tests.strategy_engine.conftest import _simple_rule, _simple_group, _all_metrics


class TestRuleEngineCondition:
    def setup_method(self):
        self.engine = RuleEngine()

    def test_gt_pass(self):
        cond = RuleCondition(metric="pe_ratio", operator=ComparisonOp.GT, value=5.0)
        passed, actual, expected, details = self.engine.evaluate_condition(cond, {"pe_ratio": 10.0})
        assert passed is True
        assert actual == 10.0

    def test_gt_fail(self):
        cond = RuleCondition(metric="pe_ratio", operator=ComparisonOp.GT, value=15.0)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"pe_ratio": 10.0})
        assert passed is False

    def test_gte_pass(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.GTE, value=10.0)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 10.0})
        assert passed is True

    def test_gte_fail(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.GTE, value=11.0)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 10.0})
        assert passed is False

    def test_lt_pass(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.LT, value=15.0)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 10.0})
        assert passed is True

    def test_lt_fail(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.LT, value=5.0)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 10.0})
        assert passed is False

    def test_lte_pass(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.LTE, value=10.0)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 10.0})
        assert passed is True

    def test_eq_pass(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.EQ, value=10.0, tolerance=0.1)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 10.05})
        assert passed is True

    def test_eq_fail(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.EQ, value=10.0, tolerance=0.1)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 10.5})
        assert passed is False

    def test_neq_pass(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.NEQ, value=10.0)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 20.0})
        assert passed is True

    def test_neq_fail(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.NEQ, value=10.0, tolerance=0.1)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 10.0})
        assert passed is False

    def test_between_pass(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.BETWEEN, value=5.0, value2=15.0)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 10.0})
        assert passed is True

    def test_between_fail(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.BETWEEN, value=5.0, value2=15.0)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 20.0})
        assert passed is False

    def test_cross_above_pass(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.CROSS_ABOVE, value=10.0)
        metrics = {"x": 12.0, "x_prev": 8.0}
        passed, _, _, _ = self.engine.evaluate_condition(cond, metrics)
        assert passed is True

    def test_cross_above_fail_no_prev(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.CROSS_ABOVE, value=10.0)
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": 12.0})
        assert passed is False

    def test_cross_above_fail_not_crossing(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.CROSS_ABOVE, value=10.0)
        metrics = {"x": 12.0, "x_prev": 11.0}
        passed, _, _, _ = self.engine.evaluate_condition(cond, metrics)
        assert passed is False

    def test_cross_below_pass(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.CROSS_BELOW, value=10.0)
        metrics = {"x": 8.0, "x_prev": 12.0}
        passed, _, _, _ = self.engine.evaluate_condition(cond, metrics)
        assert passed is True

    def test_missing_metric(self):
        cond = RuleCondition(metric="missing", operator=ComparisonOp.GT, value=0)
        passed, actual, expected, details = self.engine.evaluate_condition(cond, {})
        assert passed is False
        assert actual is None
        assert "not found" in details

    def test_string_eq(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.EQ, value="hello")
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": "hello"})
        assert passed is True

    def test_string_neq(self):
        cond = RuleCondition(metric="x", operator=ComparisonOp.NEQ, value="hello")
        passed, _, _, _ = self.engine.evaluate_condition(cond, {"x": "world"})
        assert passed is True


class TestRuleEngineRule:
    def setup_method(self):
        self.engine = RuleEngine()

    def test_disabled_rule(self):
        rule = _simple_rule(enabled=False)
        eval = self.engine.evaluate_rule(rule, _all_metrics())
        assert eval.passed is False
        assert eval.confidence == 0.0

    def test_no_conditions_passes(self):
        rule = StrategyRule(name="empty", rule_type=RuleType.CUSTOM)
        eval = self.engine.evaluate_rule(rule, {})
        assert eval.passed is True

    def test_single_condition_pass(self):
        rule = _simple_rule(metric="pe_ratio", op=ComparisonOp.LT, value=15.0)
        eval = self.engine.evaluate_rule(rule, _all_metrics())
        assert eval.passed is True
        assert eval.confidence > 0

    def test_single_condition_fail(self):
        rule = _simple_rule(metric="pe_ratio", op=ComparisonOp.LT, value=5.0)
        eval = self.engine.evaluate_rule(rule, _all_metrics())
        assert eval.passed is False

    def test_multiple_conditions_all_pass(self):
        rule = StrategyRule(
            name="multi",
            rule_type=RuleType.FINANCIAL,
            conditions=[
                RuleCondition(metric="pe_ratio", operator=ComparisonOp.LT, value=20.0),
                RuleCondition(metric="roe", operator=ComparisonOp.GT, value=15.0),
            ],
            parameters=RuleParameters(confidence=0.8),
        )
        eval = self.engine.evaluate_rule(rule, _all_metrics())
        assert eval.passed is True

    def test_multiple_conditions_partial_fail(self):
        rule = StrategyRule(
            name="multi",
            rule_type=RuleType.FINANCIAL,
            conditions=[
                RuleCondition(metric="pe_ratio", operator=ComparisonOp.LT, value=20.0),
                RuleCondition(metric="roe", operator=ComparisonOp.GT, value=50.0),
            ],
        )
        eval = self.engine.evaluate_rule(rule, _all_metrics())
        assert eval.passed is False


class TestRuleEngineGroup:
    def setup_method(self):
        self.engine = RuleEngine()

    def test_and_group_all_pass(self):
        group = _simple_group(
            _simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0),
            _simple_rule("r2", "roe", ComparisonOp.GT, 15.0),
            operator=RuleOperator.AND,
        )
        result = self.engine.evaluate_group(group, _all_metrics())
        assert result.result is True
        assert len(result.evaluations) == 2

    def test_and_group_one_fails(self):
        group = _simple_group(
            _simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0),
            _simple_rule("r2", "roe", ComparisonOp.GT, 50.0),
            operator=RuleOperator.AND,
        )
        result = self.engine.evaluate_group(group, _all_metrics())
        assert result.result is False

    def test_or_group_one_passes(self):
        group = _simple_group(
            _simple_rule("r1", "pe_ratio", ComparisonOp.LT, 5.0),
            _simple_rule("r2", "roe", ComparisonOp.GT, 15.0),
            operator=RuleOperator.OR,
        )
        result = self.engine.evaluate_group(group, _all_metrics())
        assert result.result is True

    def test_or_group_all_fail(self):
        group = _simple_group(
            _simple_rule("r1", "pe_ratio", ComparisonOp.LT, 5.0),
            _simple_rule("r2", "roe", ComparisonOp.GT, 50.0),
            operator=RuleOperator.OR,
        )
        result = self.engine.evaluate_group(group, _all_metrics())
        assert result.result is False

    def test_xor_group_exactly_one(self):
        group = _simple_group(
            _simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0),
            _simple_rule("r2", "roe", ComparisonOp.GT, 50.0),
            operator=RuleOperator.XOR,
        )
        result = self.engine.evaluate_group(group, _all_metrics())
        assert result.result is True

    def test_xor_group_both_pass(self):
        group = _simple_group(
            _simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0),
            _simple_rule("r2", "roe", ComparisonOp.GT, 15.0),
            operator=RuleOperator.XOR,
        )
        result = self.engine.evaluate_group(group, _all_metrics())
        assert result.result is False

    def test_negate_group(self):
        group = RuleGroup(
            operator=RuleOperator.AND,
            rules=[_simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0)],
            negate=True,
        )
        result = self.engine.evaluate_group(group, _all_metrics())
        assert result.result is False

    def test_nested_groups(self):
        inner = _simple_group(
            _simple_rule("r2", "roe", ComparisonOp.GT, 15.0),
            operator=RuleOperator.AND,
        )
        outer = RuleGroup(
            operator=RuleOperator.AND,
            rules=[_simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0)],
            groups=[inner],
        )
        result = self.engine.evaluate_group(outer, _all_metrics())
        assert result.result is True

    def test_empty_group(self):
        group = RuleGroup(operator=RuleOperator.AND)
        result = self.engine.evaluate_group(group, {})
        assert result.result is True


class TestRuleEngineScoring:
    def setup_method(self):
        self.engine = RuleEngine()

    def test_collect_evals(self):
        inner = _simple_group(
            _simple_rule("r1", "pe_ratio", ComparisonOp.LT, 20.0),
            _simple_rule("r2", "roe", ComparisonOp.GT, 50.0),
        )
        result = self.engine.evaluate_group(inner, _all_metrics())
        triggered, failed = self.engine.collect_rule_evals(result)
        assert len(triggered) == 1
        assert len(failed) == 1

    def test_weighted_score(self):
        triggered = [
            RuleEvaluation("r1", True, 0.8, 1.0),
            RuleEvaluation("r2", True, 0.9, 2.0),
        ]
        failed = [
            RuleEvaluation("r3", False, 0.0, 1.0),
        ]
        score = self.engine.calculate_weighted_score(triggered, failed)
        assert 0.0 <= score <= 1.0
        assert score > 0.5

    def test_weighted_score_all_passed(self):
        triggered = [
            RuleEvaluation("r1", True, 0.8, 1.0),
            RuleEvaluation("r2", True, 0.9, 1.0),
        ]
        failed = []
        score = self.engine.calculate_weighted_score(triggered, failed)
        assert score >= 0.8

    def test_weighted_score_none_passed(self):
        triggered = []
        failed = [
            RuleEvaluation("r1", False, 0.0, 1.0),
        ]
        score = self.engine.calculate_weighted_score(triggered, failed)
        assert score == 0.0

    def test_weighted_score_no_weight(self):
        triggered = []
        failed = []
        score = self.engine.calculate_weighted_score(triggered, failed)
        assert score == 0.0
