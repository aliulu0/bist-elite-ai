from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyDefinition,
    StrategyRule,
    RuleGroup,
    RuleCondition,
    RuleType,
    StrategyStatus,
    Timeframe,
)


class StrategyValidator:

    @staticmethod
    def validate_definition(definition: StrategyDefinition) -> list[str]:
        errors: list[str] = []

        if not definition.name or not definition.name.strip():
            errors.append("Strategy name is required")

        if definition.min_confidence < 0 or definition.min_confidence > 1:
            errors.append("min_confidence must be between 0 and 1")

        if definition.max_results < 1:
            errors.append("max_results must be at least 1")

        if not definition.timeframes:
            errors.append("At least one timeframe is required")

        for i, group in enumerate(definition.rule_groups):
            group_errors = StrategyValidator._validate_group(group, f"rule_groups[{i}]")
            errors.extend(group_errors)

        return errors

    @staticmethod
    def _validate_group(group: RuleGroup, path: str) -> list[str]:
        errors: list[str] = []

        if not group.rules and not group.groups:
            errors.append(f"{path}: Group is empty (no rules or sub-groups)")

        for i, rule in enumerate(group.rules):
            rule_errors = StrategyValidator._validate_rule(rule, f"{path}.rules[{i}]")
            errors.extend(rule_errors)

        for i, sub_group in enumerate(group.groups):
            sub_errors = StrategyValidator._validate_group(sub_group, f"{path}.groups[{i}]")
            errors.extend(sub_errors)

        return errors

    @staticmethod
    def _validate_rule(rule: StrategyRule, path: str) -> list[str]:
        errors: list[str] = []

        if not rule.name or not rule.name.strip():
            errors.append(f"{path}: Rule name is required")

        if rule.parameters.weight < 0:
            errors.append(f"{path}: Weight must be non-negative")

        if rule.parameters.confidence < 0 or rule.parameters.confidence > 1:
            errors.append(f"{path}: Confidence must be between 0 and 1")

        if not rule.conditions:
            errors.append(f"{path}: Rule must have at least one condition")

        for j, cond in enumerate(rule.conditions):
            cond_errors = StrategyValidator._validate_condition(cond, f"{path}.conditions[{j}]")
            errors.extend(cond_errors)

        return errors

    @staticmethod
    def _validate_condition(condition: RuleCondition, path: str) -> list[str]:
        errors: list[str] = []

        if not condition.metric:
            errors.append(f"{path}: Metric name is required")

        if condition.operator.value in ("between",) and condition.value2 is None:
            errors.append(f"{path}: value2 is required for BETWEEN operator")

        if condition.tolerance < 0:
            errors.append(f"{path}: Tolerance must be non-negative")

        return errors

    @staticmethod
    def validate_metrics(
        definition: StrategyDefinition,
        metrics: dict,
    ) -> list[str]:
        required = set()
        for group in definition.rule_groups:
            StrategyValidator._collect_required_metrics(group, required)

        missing = [m for m in required if m not in metrics]
        if missing:
            return [f"Missing required metrics: {', '.join(missing)}"]
        return []

    @staticmethod
    def _collect_required_metrics(group: RuleGroup, required: set) -> None:
        for rule in group.rules:
            for cond in rule.conditions:
                required.add(cond.metric)
                if cond.operator.value in ("cross_above", "cross_below"):
                    required.add(f"{cond.metric}_prev")
        for sub in group.groups:
            StrategyValidator._collect_required_metrics(sub, required)

    @staticmethod
    def validate_for_execution(definition: StrategyDefinition) -> list[str]:
        errors = StrategyValidator.validate_definition(definition)

        if definition.status != StrategyStatus.ACTIVE:
            errors.append(f"Strategy status is '{definition.status.value}', must be 'active' to execute")

        return errors
