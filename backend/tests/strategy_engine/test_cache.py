import time
import pytest
from modules.strategy_engine.cache.strategy_cache import StrategyCache


class TestStrategyCache:
    def test_set_and_get(self):
        cache = StrategyCache()
        cache.set("key1", {"data": "value"}, name="strategy1")
        result = cache.get("key1")
        assert result == {"data": "value"}

    def test_get_miss(self):
        cache = StrategyCache()
        result = cache.get("nonexistent")
        assert result is None

    def test_ttl_expiration(self):
        cache = StrategyCache(ttl_seconds=0)
        cache.set("key1", "value1", name="s1")
        time.sleep(0.01)
        result = cache.get("key1")
        assert result is None

    def test_max_size(self):
        cache = StrategyCache(max_size=3)
        cache.set("k1", "v1")
        cache.set("k2", "v2")
        cache.set("k3", "v3")
        cache.set("k4", "v4")
        assert cache.size() == 3
        assert cache.get("k1") is None

    def test_invalidate_by_name(self):
        cache = StrategyCache()
        cache.set("k1", "v1", name="s1")
        cache.set("k2", "v2", name="s1")
        cache.set("k3", "v3", name="s2")
        count = cache.invalidate("s1")
        assert count == 2
        assert cache.get("k1") is None
        assert cache.get("k3") is not None

    def test_clear(self):
        cache = StrategyCache()
        cache.set("k1", "v1")
        cache.set("k2", "v2")
        cache.clear()
        assert cache.size() == 0

    def test_stats(self):
        cache = StrategyCache()
        cache.set("k1", "v1")
        cache.get("k1")
        cache.get("k2")
        stats = cache.stats()
        assert stats["size"] == 1
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["hit_ratio"] == 0.5

    def test_make_key(self):
        key = StrategyCache.make_key("strategy1", "THYAO", "hash123")
        assert isinstance(key, str)
        assert len(key) == 32

    def test_make_key_deterministic(self):
        k1 = StrategyCache.make_key("s1", "THYAO", "h1")
        k2 = StrategyCache.make_key("s1", "THYAO", "h1")
        assert k1 == k2

    def test_update_existing_key(self):
        cache = StrategyCache()
        cache.set("k1", "old")
        cache.set("k1", "new")
        assert cache.get("k1") == "new"
        assert cache.size() == 1

    def test_lru_eviction_order(self):
        cache = StrategyCache(max_size=2)
        cache.set("k1", "v1")
        cache.set("k2", "v2")
        cache.get("k1")
        cache.set("k3", "v3")
        assert cache.get("k1") is not None
        assert cache.get("k2") is None
