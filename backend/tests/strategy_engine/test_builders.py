import pytest
from modules.strategy_engine.builders.strategy_builder import StrategyBuilder
from modules.strategy_engine.core.types import (
    StrategyType,
    Timeframe,
    RuleGroup,
    RuleOperator,
)
from modules.strategy_engine.rules.financial_rules import FinancialRules
from modules.strategy_engine.rules.technical_rules import TechnicalRules


class TestStrategyBuilder:
    def test_build_simple(self):
        builder = StrategyBuilder()
        defn = (
            builder
            .set_name("My Strategy")
            .set_type(StrategyType.VALUE)
            .set_description("A value strategy")
            .build()
        )
        assert defn.name == "My Strategy"
        assert defn.strategy_type == StrategyType.VALUE
        assert defn.description == "A value strategy"

    def test_build_requires_name(self):
        builder = StrategyBuilder()
        with pytest.raises(ValueError, match="name is required"):
            builder.build()

    def test_set_version(self):
        defn = StrategyBuilder().set_name("Test").set_version("2.0.0").build()
        assert defn.version == "2.0.0"

    def test_set_author(self):
        defn = StrategyBuilder().set_name("Test").set_author("John").build()
        assert defn.author == "John"

    def test_set_min_confidence(self):
        defn = StrategyBuilder().set_name("Test").set_min_confidence(0.8).build()
        assert defn.min_confidence == 0.8

    def test_set_max_results(self):
        defn = StrategyBuilder().set_name("Test").set_max_results(10).build()
        assert defn.max_results == 10

    def test_set_timeframes(self):
        defn = (
            StrategyBuilder()
            .set_name("Test")
            .set_timeframes([Timeframe.DAILY, Timeframe.WEEKLY])
            .build()
        )
        assert len(defn.timeframes) == 2

    def test_set_parameters(self):
        defn = (
            StrategyBuilder()
            .set_name("Test")
            .set_parameters({"threshold": 0.5})
            .build()
        )
        assert defn.parameters["threshold"] == 0.5

    def test_set_tags(self):
        defn = (
            StrategyBuilder()
            .set_name("Test")
            .set_tags(["value", "long-term"])
            .build()
        )
        assert "value" in defn.tags

    def test_add_rule_group(self):
        group = RuleGroup(
            operator=RuleOperator.AND,
            rules=[FinancialRules.pe_ratio()],
        )
        defn = (
            StrategyBuilder()
            .set_name("Test")
            .add_rule_group(group)
            .build()
        )
        assert len(defn.rule_groups) == 1

    def test_fluid_chaining(self):
        defn = (
            StrategyBuilder()
            .set_name("Chained")
            .set_type(StrategyType.MOMENTUM)
            .set_description("Chained strategy")
            .set_version("1.0.0")
            .set_author("Test")
            .set_min_confidence(0.6)
            .set_max_results(20)
            .set_timeframes([Timeframe.DAILY])
            .set_tags(["test"])
            .add_rule_group(RuleGroup(operator=RuleOperator.AND, rules=[FinancialRules.pe_ratio()]))
            .build()
        )
        assert defn.name == "Chained"
        assert defn.strategy_type == StrategyType.MOMENTUM
        assert defn.min_confidence == 0.6
        assert defn.max_results == 20

    def test_reset(self):
        builder = StrategyBuilder()
        builder.set_name("Test").set_type(StrategyType.VALUE)
        builder.reset()
        defn = builder.set_name("New").build()
        assert defn.name == "New"

    def test_build_with_financial_rules(self):
        defn = (
            StrategyBuilder()
            .set_name("Financial Test")
            .add_rule_group(RuleGroup(
                operator=RuleOperator.AND,
                rules=[
                    FinancialRules.pe_ratio(max_value=15.0),
                    FinancialRules.roe(min_value=15.0),
                ],
            ))
            .build()
        )
        assert len(defn.rule_groups) == 1
        assert len(defn.rule_groups[0].rules) == 2
