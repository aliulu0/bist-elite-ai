import pytest
from modules.strategy_engine.services.strategy_service import StrategyService
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
)
from tests.strategy_engine.conftest import (
    _simple_rule,
    _simple_group,
    _all_metrics,
)


class TestStrategyService:
    def setup_method(self):
        self.service = StrategyService()

    def test_list_strategies(self):
        strategies = self.service.list_strategies()
        assert len(strategies) >= 11
        assert any(s.name == "Value Investing" for s in strategies)

    def test_get_strategy(self):
        defn = self.service.get_strategy("value_investing")
        assert defn is not None
        assert defn.name == "Value Investing"

    def test_get_strategy_not_found(self):
        assert self.service.get_strategy("nonexistent") is None

    def test_list_templates(self):
        templates = self.service.list_templates()
        assert len(templates) >= 11

    def test_run_strategy(self):
        symbols = ["THYAO", "GARAN"]
        metrics_map = {
            "THYAO": _all_metrics(),
            "GARAN": _all_metrics(),
        }
        results, rankings, summary = self.service.run_strategy(
            "value_investing", symbols, metrics_map,
        )
        assert len(results) == 2
        assert len(rankings) == 2
        assert "total" in summary

    def test_run_strategy_not_found(self):
        with pytest.raises(ValueError, match="not found"):
            self.service.run_strategy("nonexistent", ["THYAO"], {"THYAO": {}})

    def test_run_strategy_inactive(self):
        defn = StrategyDefinition(
            name="Inactive",
            strategy_type=StrategyType.CUSTOM,
            status=StrategyStatus.INACTIVE,
            rule_groups=[_simple_group(_simple_rule())],
        )
        self.service.create_strategy(defn)
        with pytest.raises(ValueError, match="not active"):
            self.service.run_strategy("Inactive", ["THYAO"], {"THYAO": {}})

    def test_create_strategy(self):
        defn = StrategyDefinition(
            name="My Strategy",
            strategy_type=StrategyType.CUSTOM,
            rule_groups=[_simple_group(_simple_rule())],
        )
        errors = self.service.create_strategy(defn)
        assert len(errors) == 0
        assert self.service.get_strategy("my strategy") is not None

    def test_create_strategy_invalid(self):
        defn = StrategyDefinition(
            name="",
            strategy_type=StrategyType.CUSTOM,
        )
        errors = self.service.create_strategy(defn)
        assert len(errors) > 0

    def test_update_strategy(self):
        defn = StrategyDefinition(
            name="To Update",
            strategy_type=StrategyType.CUSTOM,
            rule_groups=[_simple_group(_simple_rule())],
        )
        self.service.create_strategy(defn)
        defn.description = "Updated"
        errors = self.service.update_strategy(defn)
        assert len(errors) == 0

    def test_delete_strategy(self):
        defn = StrategyDefinition(
            name="To Delete",
            strategy_type=StrategyType.CUSTOM,
            rule_groups=[_simple_group(_simple_rule())],
        )
        self.service.create_strategy(defn)
        removed = self.service.delete_strategy("To Delete")
        assert removed is True
        assert self.service.get_strategy("to delete") is None

    def test_delete_nonexistent(self):
        removed = self.service.delete_strategy("nonexistent")
        assert removed is False

    def test_validate_strategy(self):
        defn = StrategyDefinition(
            name="Valid",
            strategy_type=StrategyType.CUSTOM,
            rule_groups=[_simple_group(_simple_rule())],
        )
        result = self.service.validate_strategy(defn)
        assert result.valid is True

    def test_validate_invalid(self):
        defn = StrategyDefinition(name="", strategy_type=StrategyType.CUSTOM)
        result = self.service.validate_strategy(defn)
        assert result.valid is False
        assert len(result.errors) > 0

    def test_get_history(self):
        symbols = ["THYAO"]
        metrics_map = {"THYAO": _all_metrics()}
        self.service.run_strategy("value_investing", symbols, metrics_map)
        history = self.service.get_history()
        assert len(history) >= 1

    def test_get_history_filtered(self):
        self.service.run_strategy("value_investing", ["THYAO"], {"THYAO": _all_metrics()})
        history = self.service.get_history(strategy_name="value_investing")
        assert all(e["strategy_name"] == "value_investing" for e in history)

    def test_clear_cache(self):
        self.service.run_strategy("value_investing", ["THYAO"], {"THYAO": _all_metrics()})
        self.service.clear_cache()
        stats = self.service.cache_stats()
        assert stats["size"] == 0

    def test_cache_stats(self):
        stats = self.service.cache_stats()
        assert "size" in stats
        assert "hits" in stats

    def test_benchmark(self):
        result = self.service.benchmark("value_investing", _all_metrics(), iterations=10)
        assert result["iterations"] == 10
        assert result["total_seconds"] >= 0
        assert result["avg_ms"] >= 0

    def test_benchmark_not_found(self):
        with pytest.raises(ValueError, match="not found"):
            self.service.benchmark("nonexistent", {}, iterations=10)

    def test_convert_to_schema(self):
        defn = self.service.get_strategy("value_investing")
        schema = self.service.convert_to_schema(defn)
        assert schema.name == "Value Investing"
        assert schema.strategy_type == "value"

    def test_convert_result_to_schema(self):
        results, _, _ = self.service.run_strategy(
            "value_investing", ["THYAO"], {"THYAO": _all_metrics()},
        )
        schema = self.service.convert_result_to_schema(results[0])
        assert schema.symbol == "THYAO"
        assert isinstance(schema.signal, str)
