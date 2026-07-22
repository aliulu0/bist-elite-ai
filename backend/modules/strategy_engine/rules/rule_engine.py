from __future__ import annotations

from modules.strategy_engine.core.types import (
    RuleCondition,
    RuleGroup,
    RuleOperator,
    ComparisonOp,
    RuleEvaluation,
    GroupEvaluation,
    StrategyRule,
)


class RuleEngine:

    def evaluate_condition(
        self,
        condition: RuleCondition,
        metrics: dict,
    ) -> tuple[bool, float | None, float | None, str]:
        actual = metrics.get(condition.metric)
        if actual is None:
            return False, None, None, f"Metric '{condition.metric}' not found"

        if isinstance(actual, str):
            try:
                actual = float(actual)
            except (ValueError, TypeError):
                if condition.operator == ComparisonOp.EQ:
                    return str(actual) == str(condition.value), actual, condition.value, ""
                elif condition.operator == ComparisonOp.NEQ:
                    return str(actual) != str(condition.value), actual, condition.value, ""
                return False, None, None, f"Cannot compare non-numeric value"

        expected = condition.value
        op = condition.operator
        tol = condition.tolerance

        if op == ComparisonOp.GT:
            passed = actual > expected
            details = f"{condition.metric}: {actual:.4f} > {expected:.4f}"
        elif op == ComparisonOp.GTE:
            passed = actual >= expected
            details = f"{condition.metric}: {actual:.4f} >= {expected:.4f}"
        elif op == ComparisonOp.LT:
            passed = actual < expected
            details = f"{condition.metric}: {actual:.4f} < {expected:.4f}"
        elif op == ComparisonOp.LTE:
            passed = actual <= expected
            details = f"{condition.metric}: {actual:.4f} <= {expected:.4f}"
        elif op == ComparisonOp.EQ:
            passed = abs(actual - expected) <= max(tol, 1e-9)
            details = f"{condition.metric}: {actual:.4f} == {expected:.4f} (tol={tol})"
        elif op == ComparisonOp.NEQ:
            passed = abs(actual - expected) > tol
            details = f"{condition.metric}: {actual:.4f} != {expected:.4f}"
        elif op == ComparisonOp.BETWEEN:
            val2 = condition.value2 if condition.value2 is not None else expected
            lo, hi = min(expected, val2), max(expected, val2)
            passed = lo <= actual <= hi
            details = f"{condition.metric}: {actual:.4f} in [{lo:.4f}, {hi:.4f}]"
        elif op == ComparisonOp.CROSS_ABOVE:
            prev = metrics.get(f"{condition.metric}_prev")
            if prev is None:
                return False, actual, expected, f"Previous value for '{condition.metric}_prev' not found"
            passed = prev <= expected and actual > expected
            details = f"{condition.metric}: {prev:.4f}->{actual:.4f} crossed above {expected:.4f}"
        elif op == ComparisonOp.CROSS_BELOW:
            prev = metrics.get(f"{condition.metric}_prev")
            if prev is None:
                return False, actual, expected, f"Previous value for '{condition.metric}_prev' not found"
            passed = prev >= expected and actual < expected
            details = f"{condition.metric}: {prev:.4f}->{actual:.4f} crossed below {expected:.4f}"
        else:
            return False, actual, expected, f"Unknown operator: {op}"

        return passed, actual, expected, details

    def evaluate_rule(
        self,
        rule: StrategyRule,
        metrics: dict,
    ) -> RuleEvaluation:
        if not rule.enabled:
            return RuleEvaluation(
                rule_name=rule.name,
                passed=False,
                confidence=0.0,
                weight=rule.parameters.weight,
                details="Rule disabled",
            )

        if not rule.conditions:
            return RuleEvaluation(
                rule_name=rule.name,
                passed=True,
                confidence=rule.parameters.confidence,
                weight=rule.parameters.weight,
                details="No conditions - default pass",
            )

        results = []
        for cond in rule.conditions:
            passed, actual, expected, details = self.evaluate_condition(cond, metrics)
            results.append((passed, actual, expected, details))

        all_passed = all(r[0] for r in results)
        any_passed = any(r[0] for r in results)

        if not results:
            all_passed = True

        avg_actual = None
        avg_expected = None
        if results and results[0][1] is not None:
            actuals = [r[1] for r in results if r[1] is not None]
            if actuals:
                avg_actual = sum(actuals) / len(actuals)
            expecteds = [r[2] for r in results if r[2] is not None]
            if expecteds:
                avg_expected = sum(expecteds) / len(expecteds)

        details_list = [r[3] for r in results if r[3]]
        combined_details = "; ".join(details_list) if details_list else "All conditions met"

        confidence = rule.parameters.confidence if all_passed else 0.0

        return RuleEvaluation(
            rule_name=rule.name,
            passed=all_passed,
            confidence=confidence,
            weight=rule.parameters.weight,
            value=avg_actual,
            expected=avg_expected,
            details=combined_details,
        )

    def evaluate_group(
        self,
        group: RuleGroup,
        metrics: dict,
    ) -> GroupEvaluation:
        rule_evals: list[RuleEvaluation] = []
        group_evals: list[GroupEvaluation] = []

        for rule in group.rules:
            rule_evals.append(self.evaluate_rule(rule, metrics))

        for sub_group in group.groups:
            group_evals.append(self.evaluate_group(sub_group, metrics))

        all_bools = [e.passed for e in rule_evals] + [e.result for e in group_evals]

        if not all_bools:
            result = True if group.operator == RuleOperator.AND else False
        elif group.operator == RuleOperator.AND:
            result = all(all_bools)
        elif group.operator == RuleOperator.OR:
            result = any(all_bools)
        elif group.operator == RuleOperator.XOR:
            result = sum(all_bools) == 1
        else:
            result = all(all_bools)

        if group.negate:
            result = not result

        return GroupEvaluation(
            operator=group.operator,
            result=result,
            evaluations=rule_evals,
            group_evaluations=group_evals,
        )

    def collect_rule_evals(
        self,
        group: GroupEvaluation,
    ) -> tuple[list[RuleEvaluation], list[RuleEvaluation]]:
        triggered: list[RuleEvaluation] = []
        failed: list[RuleEvaluation] = []

        for e in group.evaluations:
            if e.passed:
                triggered.append(e)
            else:
                failed.append(e)

        for sub in group.group_evaluations:
            t, f = self.collect_rule_evals(sub)
            triggered.extend(t)
            failed.extend(f)

        return triggered, failed

    def calculate_weighted_score(
        self,
        triggered: list[RuleEvaluation],
        failed: list[RuleEvaluation],
    ) -> float:
        total_weight = 0.0
        passed_weight = 0.0

        all_evals = triggered + failed
        for e in all_evals:
            w = e.weight
            total_weight += w
            if e.passed:
                passed_weight += w * e.confidence

        if total_weight == 0:
            return 0.0

        return passed_weight / total_weight
