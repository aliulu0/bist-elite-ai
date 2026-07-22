from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyRule,
    RuleType,
    RuleCondition,
    RuleParameters,
    ComparisonOp,
    RuleGroup,
    RuleOperator,
)


class CustomRules:

    @staticmethod
    def metric_above(
        metric: str,
        threshold: float,
        name: str = "",
        weight: float = 1.0,
    ) -> StrategyRule:
        rule_name = name or f"{metric}_above_{threshold}"
        return StrategyRule(
            name=rule_name,
            rule_type=RuleType.CUSTOM,
            description=f"{metric} above {threshold}",
            conditions=[
                RuleCondition(metric=metric, operator=ComparisonOp.GT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def metric_below(
        metric: str,
        threshold: float,
        name: str = "",
        weight: float = 1.0,
    ) -> StrategyRule:
        rule_name = name or f"{metric}_below_{threshold}"
        return StrategyRule(
            name=rule_name,
            rule_type=RuleType.CUSTOM,
            description=f"{metric} below {threshold}",
            conditions=[
                RuleCondition(metric=metric, operator=ComparisonOp.LT, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def metric_between(
        metric: str,
        low: float,
        high: float,
        name: str = "",
        weight: float = 1.0,
    ) -> StrategyRule:
        rule_name = name or f"{metric}_between_{low}_{high}"
        return StrategyRule(
            name=rule_name,
            rule_type=RuleType.CUSTOM,
            description=f"{metric} between {low} and {high}",
            conditions=[
                RuleCondition(
                    metric=metric,
                    operator=ComparisonOp.BETWEEN,
                    value=low,
                    value2=high,
                ),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def metric_cross_above(
        metric: str,
        threshold: float,
        name: str = "",
        weight: float = 1.0,
    ) -> StrategyRule:
        rule_name = name or f"{metric}_cross_above_{threshold}"
        return StrategyRule(
            name=rule_name,
            rule_type=RuleType.CUSTOM,
            description=f"{metric} crossed above {threshold}",
            conditions=[
                RuleCondition(metric=metric, operator=ComparisonOp.CROSS_ABOVE, value=threshold),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def compound(
        rules: list[StrategyRule],
        operator: RuleOperator = RuleOperator.AND,
        name: str = "compound_rule",
        weight: float = 1.0,
    ) -> RuleGroup:
        return RuleGroup(
            operator=operator,
            rules=rules,
        )

    @staticmethod
    def from_dict(config: dict) -> StrategyRule:
        metric = config.get("metric", "")
        op_str = config.get("operator", "gt")
        value = config.get("value", 0)
        value2 = config.get("value2")
        name = config.get("name", "")
        weight = config.get("weight", 1.0)

        op_map = {
            "gt": ComparisonOp.GT,
            "gte": ComparisonOp.GTE,
            "lt": ComparisonOp.LT,
            "lte": ComparisonOp.LTE,
            "eq": ComparisonOp.EQ,
            "neq": ComparisonOp.NEQ,
            "between": ComparisonOp.BETWEEN,
            "cross_above": ComparisonOp.CROSS_ABOVE,
            "cross_below": ComparisonOp.CROSS_BELOW,
        }
        operator = op_map.get(op_str, ComparisonOp.GT)

        cond = RuleCondition(
            metric=metric,
            operator=operator,
            value=value,
            value2=value2,
        )

        return StrategyRule(
            name=name or f"{metric}_{op_str}_{value}",
            rule_type=RuleType.CUSTOM,
            description=config.get("description", f"{metric} {op_str} {value}"),
            conditions=[cond],
            parameters=RuleParameters(weight=weight),
        )
