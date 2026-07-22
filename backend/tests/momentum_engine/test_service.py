import pytest
from modules.momentum_engine.services.momentum_service import MomentumService
from modules.momentum_engine.schemas.momentum_schemas import PriceBarSchema


def _price_bars(n=100, start=100.0, step=0.5) -> list[PriceBarSchema]:
    return [
        PriceBarSchema(
            date=f"2024-01-{(i%28)+1:02d}",
            open=start + i * step,
            high=start + i * step + 3,
            low=start + i * step - 2,
            close=start + i * step,
            volume=1000 + i * 10,
        )
        for i in range(n)
    ]


class TestMomentumService:
    def setup_method(self):
        self.service = MomentumService()

    def test_calculate_rsi(self):
        result = self.service.calculate("rsi", _price_bars(100))
        assert result.indicator == "Relative Strength Index"
        assert result.current_value is not None

    def test_calculate_macd(self):
        result = self.service.calculate("macd", _price_bars(100))
        assert result.indicator == "MACD"

    def test_calculate_unknown(self):
        with pytest.raises(ValueError):
            self.service.calculate("xyz", _price_bars(100))

    def test_get_signals(self):
        signals = self.service.get_signals("rsi", _price_bars(100))
        assert len(signals) > 0
        assert signals[0].signal_type in ["BUY", "STRONG_BUY", "SELL", "STRONG_SELL", "NEUTRAL"]

    def test_get_available_indicators(self):
        result = self.service.get_available_indicators()
        assert "rsi" in result.indicators
        assert len(result.indicators) >= 10

    def test_get_cache_stats(self):
        stats = self.service.get_cache_stats()
        assert stats.size >= 0

    def test_custom_params(self):
        result = self.service.calculate("rsi", _price_bars(100), period=21)
        assert result.parameters["period"] == 21

    def test_all_indicators(self):
        bars = _price_bars(100)
        for name in self.service.get_available_indicators().indicators:
            result = self.service.calculate(name, bars)
            assert result.indicator is not None
