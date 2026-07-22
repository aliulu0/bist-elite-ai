import time
import pytest
from modules.monte_carlo_engine.cache.cache import MonteCarloCache, reset_monte_carlo_cache


class TestMonteCarloCache:
    def setup_method(self):
        reset_monte_carlo_cache()

    def teardown_method(self):
        reset_monte_carlo_cache()

    def test_singleton(self):
        c1 = MonteCarloCache()
        c2 = MonteCarloCache()
        assert c1 is c2

    def test_set_get(self):
        cache = MonteCarloCache()
        cache.set("key1", {"data": 42})
        assert cache.get("key1") == {"data": 42}

    def test_get_miss(self):
        cache = MonteCarloCache()
        assert cache.get("missing") is None

    def test_has(self):
        cache = MonteCarloCache()
        cache.set("key1", "val")
        assert cache.has("key1")
        assert not cache.has("missing")

    def test_delete(self):
        cache = MonteCarloCache()
        cache.set("key1", "val")
        assert cache.delete("key1")
        assert not cache.delete("key1")

    def test_clear(self):
        cache = MonteCarloCache()
        cache.set("a", 1)
        count = cache.clear()
        assert count == 1

    def test_ttl_expiry(self):
        cache = MonteCarloCache(ttl=1)
        cache.set("key1", "val")
        time.sleep(1.1)
        assert cache.get("key1") is None

    def test_stats(self):
        cache = MonteCarloCache()
        cache.set("a", 1)
        cache.get("a")
        cache.get("missing")
        stats = cache.stats()
        assert stats["hits"] == 1
        assert stats["misses"] == 1

    def test_lru_eviction(self):
        cache = MonteCarloCache(max_size=2)
        cache.set("a", 1)
        cache.set("b", 2)
        cache.set("c", 3)
        assert cache.get("a") is None
        assert cache.get("c") == 3

    def test_cleanup(self):
        cache = MonteCarloCache(ttl=1)
        cache.set("key1", "val")
        time.sleep(1.1)
        removed = cache.cleanup()
        assert removed == 1

    def test_reset_stats(self):
        cache = MonteCarloCache()
        cache.get("missing")
        cache.reset_stats()
        assert cache.stats()["hits"] == 0

    def test_reset_singleton(self):
        c1 = MonteCarloCache()
        reset_monte_carlo_cache()
        c2 = MonteCarloCache()
        assert c1 is not c2
