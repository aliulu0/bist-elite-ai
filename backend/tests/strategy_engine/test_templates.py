import pytest
from modules.strategy_engine.templates.builtin_templates import BuiltinTemplates
from modules.strategy_engine.core.types import StrategyType


class TestBuiltinTemplates:
    def test_get_all(self):
        templates = BuiltinTemplates.get_all()
        assert len(templates) == 11
        assert "early_opportunity" in templates
        assert "value_investing" in templates
        assert "growth_investing" in templates
        assert "momentum_investing" in templates
        assert "breakout" in templates
        assert "swing_trading" in templates
        assert "trend_following" in templates
        assert "smart_money" in templates
        assert "dividend_growth" in templates
        assert "low_risk" in templates
        assert "high_conviction" in templates

    def test_early_opportunity(self):
        defn = BuiltinTemplates.early_opportunity()
        assert defn.name == "Early Opportunity"
        assert defn.strategy_type == StrategyType.EARLY_OPPORTUNITY
        assert len(defn.rule_groups) == 3
        assert "early" in defn.tags

    def test_value_investing(self):
        defn = BuiltinTemplates.value_investing()
        assert defn.name == "Value Investing"
        assert defn.strategy_type == StrategyType.VALUE
        assert len(defn.rule_groups) == 3

    def test_growth_investing(self):
        defn = BuiltinTemplates.growth_investing()
        assert defn.name == "Growth Investing"
        assert defn.strategy_type == StrategyType.GROWTH
        assert len(defn.rule_groups) == 3

    def test_momentum_investing(self):
        defn = BuiltinTemplates.momentum_investing()
        assert defn.name == "Momentum Investing"
        assert defn.strategy_type == StrategyType.MOMENTUM

    def test_breakout(self):
        defn = BuiltinTemplates.breakout()
        assert defn.name == "Breakout"
        assert defn.strategy_type == StrategyType.BREAKOUT

    def test_swing_trading(self):
        defn = BuiltinTemplates.swing_trading()
        assert defn.name == "Swing Trading"
        assert defn.strategy_type == StrategyType.SWING

    def test_trend_following(self):
        defn = BuiltinTemplates.trend_following()
        assert defn.name == "Trend Following"
        assert defn.strategy_type == StrategyType.TREND_FOLLOWING

    def test_smart_money(self):
        defn = BuiltinTemplates.smart_money()
        assert defn.name == "Smart Money"
        assert defn.strategy_type == StrategyType.SMART_MONEY

    def test_dividend_growth(self):
        defn = BuiltinTemplates.dividend_growth()
        assert defn.name == "Dividend Growth"
        assert defn.strategy_type == StrategyType.DIVIDEND_GROWTH

    def test_low_risk(self):
        defn = BuiltinTemplates.low_risk()
        assert defn.name == "Low Risk"
        assert defn.strategy_type == StrategyType.LOW_RISK

    def test_high_conviction(self):
        defn = BuiltinTemplates.high_conviction()
        assert defn.name == "High Conviction"
        assert defn.strategy_type == StrategyType.HIGH_CONVICTION
        assert defn.min_confidence == 0.7

    def test_get_template_found(self):
        defn = BuiltinTemplates.get_template("value_investing")
        assert defn is not None
        assert defn.name == "Value Investing"

    def test_get_template_with_spaces(self):
        defn = BuiltinTemplates.get_template("Value Investing")
        assert defn is not None

    def test_get_template_not_found(self):
        assert BuiltinTemplates.get_template("nonexistent") is None

    def test_all_have_rule_groups(self):
        for name, defn in BuiltinTemplates.get_all().items():
            assert len(defn.rule_groups) > 0, f"{name} has no rule groups"

    def test_all_have_tags(self):
        for name, defn in BuiltinTemplates.get_all().items():
            assert len(defn.tags) > 0, f"{name} has no tags"

    def test_all_have_versions(self):
        for name, defn in BuiltinTemplates.get_all().items():
            assert defn.version == "1.0.0", f"{name} has wrong version"
