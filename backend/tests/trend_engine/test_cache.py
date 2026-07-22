import pytest
from modules.trend_engine.cache.trend_cache import TrendCache
from modules.trend_engine.core.types import IndicatorResult, TrendDirection
from tests.trend_engine.conftest import _bars


class TestTrendCache:
    def setup_method(self):
        self.cache = TrendCache()

    def test_build_key(self):
        bars = _bars(50)
        key = TrendCache.build_key("supertrend", bars, {"period": 10})
        assert isinstance(key, str)
        assert len(key) == 32

    def test_set_get(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
            current_value=50.0,
        )
        self.cache.set("key1", result)
        cached = self.cache.get("key1")
        assert cached is not None
        assert cached.current_value == 50.0

    def test_get_miss(self):
        assert self.cache.get("nonexistent") is None

    def test_stats(self):
        self.cache.get("miss1")
        stats = self.cache.stats()
        assert stats["misses"] == 1
        assert stats["hits"] == 0
        assert stats["size"] == 0

    def test_hit_stats(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
        )
        self.cache.set("k1", result)
        self.cache.get("k1")
        stats = self.cache.stats()
        assert stats["hits"] == 1

    def test_clear(self):
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
        )
        self.cache.set("k1", result)
        self.cache.clear()
        stats = self.cache.stats()
        assert stats["size"] == 0
        assert stats["hits"] == 0
        assert stats["misses"] == 0

    def test_max_size_eviction(self):
        small_cache = TrendCache(max_size=2)
        for i in range(4):
            result = IndicatorResult(
                indicator="test", parameters={}, values=[None]*10,
                dates=[f"2024-01-{j+1:02d}" for j in range(10)],
            )
            small_cache.set(f"k{i}", result)
        assert small_cache.stats()["size"] <= 2

    def test_ttl_expiry(self):
        import time
        ttl_cache = TrendCache(ttl_seconds=0)
        result = IndicatorResult(
            indicator="test", parameters={}, values=[None]*10,
            dates=[f"2024-01-{i+1:02d}" for i in range(10)],
        )
        ttl_cache.set("k1", result)
        time.sleep(0.01)
        assert ttl_cache.get("k1") is None
