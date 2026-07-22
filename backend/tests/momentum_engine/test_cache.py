import pytest
from modules.momentum_engine.cache.momentum_cache import MomentumCache
from modules.momentum_engine.core.types import IndicatorResult, TrendDirection


class TestMomentumCache:
    def setup_method(self):
        self.cache = MomentumCache(max_size=10, ttl_seconds=60)

    def test_set_get(self):
        result = IndicatorResult(
            indicator="RSI", parameters={}, values=[50], dates=["d1"],
            current_value=50, trend=TrendDirection.NEUTRAL,
        )
        key = "test_key"
        self.cache.set(key, result)
        assert self.cache.get(key) is not None

    def test_miss(self):
        assert self.cache.get("nonexistent") is None

    def test_build_key(self):
        from tests.momentum_engine.conftest import _bars
        key = MomentumCache.build_key("rsi", _bars(10), {"period": 14})
        assert isinstance(key, str)

    def test_stats(self):
        stats = self.cache.stats()
        assert "size" in stats
        assert "hit_ratio" in stats

    def test_clear(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[], dates=[],
            trend=TrendDirection.NEUTRAL,
        )
        self.cache.set("k", result)
        self.cache.clear()
        assert self.cache.stats()["size"] == 0

    def test_max_size_eviction(self):
        cache = MomentumCache(max_size=2, ttl_seconds=60)
        for i in range(4):
            r = IndicatorResult(
                indicator="test", parameters={}, values=[], dates=[],
                trend=TrendDirection.NEUTRAL,
            )
            cache.set(f"key_{i}", r)
        assert cache.stats()["size"] <= 2
