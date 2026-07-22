from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyRule,
    RuleType,
    RuleCondition,
    RuleParameters,
    ComparisonOp,
)


class RiskRules:

    @staticmethod
    def max_drawdown(max_pct: float = 20.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="max_drawdown",
            rule_type=RuleType.RISK,
            description=f"Max drawdown below {max_pct}%",
            conditions=[
                RuleCondition(metric="max_drawdown", operator=ComparisonOp.LT, value=max_pct),
            ],
            parameters=RuleParameters(weight=weight, priority=3),
        )

    @staticmethod
    def volatility(max_vol: float = 30.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="volatility",
            rule_type=RuleType.RISK,
            description=f"Volatility below {max_vol}%",
            conditions=[
                RuleCondition(metric="volatility", operator=ComparisonOp.LT, value=max_vol),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def sharpe_ratio(min_sharpe: float = 1.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="sharpe_ratio",
            rule_type=RuleType.RISK,
            description=f"Sharpe ratio above {min_sharpe}",
            conditions=[
                RuleCondition(metric="sharpe_ratio", operator=ComparisonOp.GT, value=min_sharpe),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def beta_range(min_beta: float = 0.5, max_beta: float = 1.5, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="beta_range",
            rule_type=RuleType.RISK,
            description=f"Beta in [{min_beta}, {max_beta}]",
            conditions=[
                RuleCondition(
                    metric="beta",
                    operator=ComparisonOp.BETWEEN,
                    value=min_beta,
                    value2=max_beta,
                ),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def value_at_risk(max_var: float = 5.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="value_at_risk",
            rule_type=RuleType.RISK,
            description=f"VaR below {max_var}%",
            conditions=[
                RuleCondition(metric="var_95", operator=ComparisonOp.LT, value=max_var),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def sortino_ratio(min_sortino: float = 1.5, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="sortino_ratio",
            rule_type=RuleType.RISK,
            description=f"Sortino ratio above {min_sortino}",
            conditions=[
                RuleCondition(metric="sortino_ratio", operator=ComparisonOp.GT, value=min_sortino),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )
