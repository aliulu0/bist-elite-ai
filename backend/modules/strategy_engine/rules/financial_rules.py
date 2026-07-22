from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyRule,
    RuleType,
    RuleCondition,
    RuleParameters,
    ComparisonOp,
    Timeframe,
)


class FinancialRules:

    @staticmethod
    def pe_ratio(max_value: float = 15.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="pe_ratio",
            rule_type=RuleType.FINANCIAL,
            description=f"P/E ratio below {max_value}",
            conditions=[
                RuleCondition(metric="pe_ratio", operator=ComparisonOp.LT, value=max_value),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def pb_ratio(max_value: float = 1.5, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="pb_ratio",
            rule_type=RuleType.FINANCIAL,
            description=f"P/B ratio below {max_value}",
            conditions=[
                RuleCondition(metric="pb_ratio", operator=ComparisonOp.LT, value=max_value),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def roe(min_value: float = 15.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="roe",
            rule_type=RuleType.FINANCIAL,
            description=f"ROE above {min_value}%",
            conditions=[
                RuleCondition(metric="roe", operator=ComparisonOp.GT, value=min_value),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def roa(min_value: float = 5.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="roa",
            rule_type=RuleType.FINANCIAL,
            description=f"ROA above {min_value}%",
            conditions=[
                RuleCondition(metric="roa", operator=ComparisonOp.GT, value=min_value),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def debt_to_equity(max_value: float = 1.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="debt_to_equity",
            rule_type=RuleType.FINANCIAL,
            description=f"Debt/Equity below {max_value}",
            conditions=[
                RuleCondition(metric="debt_to_equity", operator=ComparisonOp.LT, value=max_value),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def dividend_yield(min_value: float = 2.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="dividend_yield",
            rule_type=RuleType.FINANCIAL,
            description=f"Dividend yield above {min_value}%",
            conditions=[
                RuleCondition(metric="dividend_yield", operator=ComparisonOp.GT, value=min_value),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def earnings_growth(min_value: float = 10.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="earnings_growth",
            rule_type=RuleType.FINANCIAL,
            description=f"Earnings growth above {min_value}%",
            conditions=[
                RuleCondition(metric="earnings_growth", operator=ComparisonOp.GT, value=min_value),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def revenue_growth(min_value: float = 10.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="revenue_growth",
            rule_type=RuleType.FINANCIAL,
            description=f"Revenue growth above {min_value}%",
            conditions=[
                RuleCondition(metric="revenue_growth", operator=ComparisonOp.GT, value=min_value),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def current_ratio(min_value: float = 1.5, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="current_ratio",
            rule_type=RuleType.FINANCIAL,
            description=f"Current ratio above {min_value}",
            conditions=[
                RuleCondition(metric="current_ratio", operator=ComparisonOp.GT, value=min_value),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def net_margin(min_value: float = 10.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="net_margin",
            rule_type=RuleType.FINANCIAL,
            description=f"Net margin above {min_value}%",
            conditions=[
                RuleCondition(metric="net_margin", operator=ComparisonOp.GT, value=min_value),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def price_to_sales(max_value: float = 2.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="price_to_sales",
            rule_type=RuleType.FINANCIAL,
            description=f"P/S ratio below {max_value}",
            conditions=[
                RuleCondition(metric="price_to_sales", operator=ComparisonOp.LT, value=max_value),
            ],
            parameters=RuleParameters(weight=weight, priority=1),
        )

    @staticmethod
    def peg_ratio(max_value: float = 1.0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="peg_ratio",
            rule_type=RuleType.FINANCIAL,
            description=f"PEG ratio below {max_value}",
            conditions=[
                RuleCondition(metric="peg_ratio", operator=ComparisonOp.LT, value=max_value),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )

    @staticmethod
    def free_cash_flow(min_value: float = 0, weight: float = 1.0) -> StrategyRule:
        return StrategyRule(
            name="free_cash_flow",
            rule_type=RuleType.FINANCIAL,
            description=f"Free cash flow above {min_value}",
            conditions=[
                RuleCondition(metric="free_cash_flow", operator=ComparisonOp.GT, value=min_value),
            ],
            parameters=RuleParameters(weight=weight, priority=2),
        )
