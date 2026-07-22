from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyDefinition,
    StrategyType,
    StrategyStatus,
    Timeframe,
    RuleGroup,
    RuleOperator,
)
from modules.strategy_engine.rules.financial_rules import FinancialRules
from modules.strategy_engine.rules.technical_rules import TechnicalRules
from modules.strategy_engine.rules.volume_rules import VolumeRules
from modules.strategy_engine.rules.pattern_rules import PatternRules
from modules.strategy_engine.rules.smc_rules import SmartMoneyRules
from modules.strategy_engine.rules.risk_rules import RiskRules
from modules.strategy_engine.rules.market_rules import MarketRules
from modules.strategy_engine.rules.time_rules import TimeRules
from modules.strategy_engine.rules.custom_rules import CustomRules


class StrategyBuilder:

    def __init__(self) -> None:
        self._name: str = ""
        self._strategy_type: StrategyType = StrategyType.CUSTOM
        self._description: str = ""
        self._version: str = "1.0.0"
        self._author: str = ""
        self._rule_groups: list[RuleGroup] = []
        self._min_confidence: float = 0.5
        self._max_results: int = 50
        self._timeframes: list[Timeframe] = [Timeframe.DAILY]
        self._parameters: dict = {}
        self._tags: list[str] = []

    def set_name(self, name: str) -> StrategyBuilder:
        self._name = name
        return self

    def set_type(self, strategy_type: StrategyType) -> StrategyBuilder:
        self._strategy_type = strategy_type
        return self

    def set_description(self, description: str) -> StrategyBuilder:
        self._description = description
        return self

    def set_version(self, version: str) -> StrategyBuilder:
        self._version = version
        return self

    def set_author(self, author: str) -> StrategyBuilder:
        self._author = author
        return self

    def set_min_confidence(self, min_conf: float) -> StrategyBuilder:
        self._min_confidence = min_conf
        return self

    def set_max_results(self, max_results: int) -> StrategyBuilder:
        self._max_results = max_results
        return self

    def set_timeframes(self, timeframes: list[Timeframe]) -> StrategyBuilder:
        self._timeframes = timeframes
        return self

    def set_parameters(self, parameters: dict) -> StrategyBuilder:
        self._parameters = parameters
        return self

    def set_tags(self, tags: list[str]) -> StrategyBuilder:
        self._tags = tags
        return self

    def add_rule_group(self, group: RuleGroup) -> StrategyBuilder:
        self._rule_groups.append(group)
        return self

    def add_and_group(self, *rules) -> StrategyBuilder:
        group = RuleGroup(operator=RuleOperator.AND, rules=list(rules))
        self._rule_groups.append(group)
        return self

    def add_or_group(self, *rules) -> StrategyBuilder:
        group = RuleGroup(operator=RuleOperator.OR, rules=list(rules))
        self._rule_groups.append(group)
        return self

    def with_financial(self) -> StrategyBuilder:
        return self

    def with_technical(self) -> StrategyBuilder:
        return self

    def with_volume(self) -> StrategyBuilder:
        return self

    def with_pattern(self) -> StrategyBuilder:
        return self

    def with_smc(self) -> StrategyBuilder:
        return self

    def with_risk(self) -> StrategyBuilder:
        return self

    def with_market(self) -> StrategyBuilder:
        return self

    def with_time(self) -> StrategyBuilder:
        return self

    def build(self) -> StrategyDefinition:
        if not self._name:
            raise ValueError("Strategy name is required")

        return StrategyDefinition(
            name=self._name,
            strategy_type=self._strategy_type,
            description=self._description,
            version=self._version,
            rule_groups=self._rule_groups,
            min_confidence=self._min_confidence,
            max_results=self._max_results,
            timeframes=self._timeframes,
            parameters=self._parameters,
            status=StrategyStatus.ACTIVE,
            tags=self._tags,
            author=self._author,
        )

    def reset(self) -> StrategyBuilder:
        self.__init__()
        return self
