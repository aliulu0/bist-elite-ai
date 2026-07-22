import pytest
from modules.volume_engine.cache.volume_cache import VolumeCache
from modules.volume_engine.core.types import IndicatorResult


class TestVolumeCache:
    def setup_method(self):
        self.cache = VolumeCache()

    def test_set_get(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100, 200],
            dates=["2024-01-01", "2024-01-02"], current_value=200,
        )
        key = self.cache.build_key("obv", [], {})
        self.cache.set(key, result)
        cached = self.cache.get(key)
        assert cached is not None
        assert cached.indicator == "OBV"

    def test_get_miss(self):
        cached = self.cache.get("nonexistent")
        assert cached is None

    def test_build_key(self):
        key1 = self.cache.build_key("obv", [], {})
        key2 = self.cache.build_key("obv", [], {})
        assert key1 == key2

    def test_clear(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100],
            dates=["2024-01-01"], current_value=100,
        )
        key = self.cache.build_key("obv", [], {})
        self.cache.set(key, result)
        self.cache.clear()
        assert self.cache.get(key) is None

    def test_stats(self):
        self.cache.get("miss1")
        stats = self.cache.stats()
        assert "size" in stats
        assert "hits" in stats
        assert "misses" in stats
        assert stats["misses"] >= 1

    def test_max_size(self):
        cache = VolumeCache(max_size=3)
        for i in range(5):
            result = IndicatorResult(
                indicator=f"test{i}", parameters={}, values=[100],
                dates=["2024-01-01"], current_value=100,
            )
            key = cache.build_key(f"test{i}", [], {})
            cache.set(key, result)
        stats = cache.stats()
        assert stats["size"] <= 3
