import pytest
from modules.moving_average.core.engine import MovingAverageEngine
from modules.moving_average.core.registry import get_registry
from modules.moving_average.core.types import PriceBar


def _bars(n=50, start=100.0, step=1.0) -> list[PriceBar]:
    return [
        PriceBar(
            date=f"2024-01-{i+1:02d}",
            open=start + i * step,
            high=start + i * step + 2,
            low=start + i * step - 1,
            close=start + i * step,
            volume=1000.0 + i * 10,
        )
        for i in range(n)
    ]


def _create_engine() -> MovingAverageEngine:
    engine = MovingAverageEngine()
    registry = get_registry()
    for name in registry.list_all():
        plugin = registry.get(name)
        if plugin:
            engine.register_plugin(plugin)
    return engine


class TestMovingAverageEngine:
    def setup_method(self):
        self.engine = _create_engine()

    def test_list_plugins(self):
        plugins = self.engine.list_plugins()
        assert "sma" in plugins
        assert "ema" in plugins

    def test_register_plugin(self):
        from modules.moving_average.plugins.sma_plugin import SMAPlugin
        engine = MovingAverageEngine()
        engine.register_plugin(SMAPlugin())
        assert engine.get_plugin("sma") is not None

    def test_get_unknown_plugin(self):
        assert self.engine.get_plugin("unknown") is None

    def test_calculate_unknown_type(self):
        with pytest.raises(ValueError, match="Unknown MA type"):
            self.engine.calculate("xyz", 5, _bars(10))

    def test_calculate_sma(self):
        result = self.engine.calculate("sma", 10, _bars(30))
        assert result.indicator == "SMA"
        assert result.period == 10
        assert len(result.values) == 30
        assert result.current_value is not None
        assert result.previous_value is not None

    def test_calculate_insufficient_data(self):
        result = self.engine.calculate("sma", 50, _bars(10))
        assert all(v is None for v in result.values)
        assert result.current_value is None

    def test_calculate_with_slope(self):
        result = self.engine.calculate("sma", 10, _bars(30), include_slope=True)
        assert result.slope is not None

    def test_calculate_without_slope(self):
        result = self.engine.calculate("sma", 10, _bars(30), include_slope=False)
        assert result.slope is None

    def test_calculate_with_distance(self):
        result = self.engine.calculate("sma", 10, _bars(30), include_distance=True)
        assert result.distance_from_price is not None

    def test_calculate_with_trend(self):
        result = self.engine.calculate("sma", 10, _bars(30), include_trend=True)
        assert result.trend is not None

    def test_calculate_with_scores(self):
        result = self.engine.calculate("sma", 10, _bars(30), include_scores=True)
        assert result.scores is not None
        assert result.scores.ma_score >= 0

    def test_calculate_multiple(self):
        results = self.engine.calculate_multiple("sma", [5, 10, 20], _bars(30))
        assert len(results) == 3
        assert results[0].period == 5
        assert results[1].period == 10
        assert results[2].period == 20

    def test_calculate_crossovers(self):
        result = self.engine.calculate_crossovers("sma", 5, 20, _bars(50))
        assert result["fast_period"] == 5
        assert result["slow_period"] == 20
        assert isinstance(result["crosses"], list)

    def test_calculate_crossovers_insufficient_data(self):
        result = self.engine.calculate_crossovers("sma", 5, 20, _bars(5))
        assert result["crosses"] == []
        assert result["estimated_bars"] is None

    def test_calculation_time_positive(self):
        result = self.engine.calculate("sma", 5, _bars(20))
        assert result.calculation_time_ms >= 0

    def test_ema_calculation(self):
        result = self.engine.calculate("ema", 10, _bars(30))
        assert result.indicator == "EMA"
        assert result.current_value is not None

    def test_wma_calculation(self):
        result = self.engine.calculate("wma", 10, _bars(30))
        assert result.indicator == "WMA"
        assert result.current_value is not None

    def test_hma_calculation(self):
        result = self.engine.calculate("hma", 9, _bars(30))
        assert result.indicator == "HMA"

    def test_smma_calculation(self):
        result = self.engine.calculate("smma", 10, _bars(30))
        assert result.indicator == "SMMA"
        assert result.current_value is not None
