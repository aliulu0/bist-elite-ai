import pytest
from modules.backtest_engine.datasets.manager import DatasetManager
from modules.backtest_engine.core.types import MarketPeriod


class TestDatasetManager:
    def setup_method(self):
        self.dm = DatasetManager()

    def test_get_data(self):
        data = self.dm.get_data("TUPRS")
        assert len(data) > 0
        assert data[0].symbol == "TUPRS"

    def test_get_data_cached(self):
        d1 = self.dm.get_data("TUPRS")
        d2 = self.dm.get_data("TUPRS")
        assert len(d1) == len(d2)

    def test_different_symbols(self):
        d1 = self.dm.get_data("TUPRS")
        d2 = self.dm.get_data("GARAN")
        assert d1[0].close != d2[0].close

    def test_add_data(self):
        from modules.backtest_engine.core.types import PriceBar
        bars = [PriceBar(timestamp=f"2024-01-{i:02d}", open=100, high=105, low=95, close=102, volume=1000) for i in range(1, 11)]
        self.dm.add_data("CUSTOM", bars)
        data = self.dm.get_data("CUSTOM")
        assert len(data) == 10

    def test_get_latest_price(self):
        data = self.dm.get_data("TUPRS")
        latest = self.dm.get_latest_price("TUPRS")
        assert latest is not None
        assert latest.timestamp == data[-1].timestamp

    def test_get_latest_price_empty(self):
        assert self.dm.get_latest_price("NONEXISTENT") is None

    def test_symbols(self):
        self.dm.get_data("TUPRS")
        self.dm.get_data("GARAN")
        syms = self.dm.symbols()
        assert "TUPRS" in syms
        assert "GARAN" in syms

    def test_clear(self):
        self.dm.get_data("TUPRS")
        cleared = self.dm.clear()
        assert cleared >= 1

    def test_detect_market_period(self):
        self.dm.get_data("TUPRS")
        period = self.dm.detect_market_period("TUPRS")
        assert isinstance(period, MarketPeriod)

    def test_detect_market_period_empty(self):
        assert self.dm.detect_market_period("NONEXISTENT") == MarketPeriod.SIDEWAYS

    def test_bar_count(self):
        self.dm.get_data("TUPRS")
        count = self.dm.bar_count("TUPRS")
        assert count > 0

    def test_data_bars_have_prices(self):
        data = self.dm.get_data("GARAN")
        for bar in data[:10]:
            assert bar.open > 0
            assert bar.high >= bar.open
            assert bar.low <= bar.open
            assert bar.close > 0
            assert bar.volume > 0
