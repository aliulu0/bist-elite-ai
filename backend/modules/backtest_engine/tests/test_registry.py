import pytest
from modules.backtest_engine.registry.registry import BacktestRegistry, reset_backtest_registry


@pytest.fixture(autouse=True)
def fresh_registry():
    reset_backtest_registry()
    yield
    reset_backtest_registry()


class TestBacktestRegistry:
    def test_singleton(self):
        r1 = BacktestRegistry()
        r2 = BacktestRegistry()
        assert r1 is r2

    def test_register_strategy(self):
        reg = BacktestRegistry()
        reg.register_strategy("test_strat", object())
        assert reg.get_strategy("test_strat") is not None

    def test_get_strategy_unknown(self):
        reg = BacktestRegistry()
        assert reg.get_strategy("unknown") is None

    def test_list_strategies(self):
        reg = BacktestRegistry()
        reg.register_strategy("a", object())
        reg.register_strategy("b", object())
        assert len(reg.list_strategies()) == 2

    def test_register_calculator(self):
        reg = BacktestRegistry()
        reg.register_calculator("calc1", object())
        assert reg.get_calculator("calc1") is not None

    def test_list_calculators(self):
        reg = BacktestRegistry()
        reg.register_calculator("a", object())
        assert "a" in reg.list_calculators()

    def test_register_factory(self):
        reg = BacktestRegistry()
        reg.register_factory("f1", lambda: None)
        assert reg.get_factory("f1") is not None

    def test_list_factories(self):
        reg = BacktestRegistry()
        reg.register_factory("f", lambda: None)
        assert "f" in reg.list_factories()

    def test_clear(self):
        reg = BacktestRegistry()
        reg.register_strategy("s", object())
        reg.register_calculator("c", object())
        reg.register_factory("f", lambda: None)
        reg.clear()
        assert len(reg.list_strategies()) == 0

    def test_normalization(self):
        reg = BacktestRegistry()
        reg.register_strategy("MyStrat", object())
        assert reg.get_strategy("mystrat") is not None
