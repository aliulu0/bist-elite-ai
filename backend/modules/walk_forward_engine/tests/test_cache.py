import time
import pytest
from modules.walk_forward_engine.cache.cache import WalkForwardCache, reset_walk_forward_cache


class TestWalkForwardCache:
    def setup_method(self):
        reset_walk_forward_cache()

    def teardown_method(self):
        reset_walk_forward_cache()

    def test_singleton(self):
        c1 = WalkForwardCache()
        c2 = WalkForwardCache()
        assert c1 is c2

    def test_set_get(self):
        cache = WalkForwardCache()
        cache.set("key1", {"data": 42})
        result = cache.get("key1")
        assert result == {"data": 42}

    def test_get_miss(self):
        cache = WalkForwardCache()
        result = cache.get("missing")
        assert result is None

    def test_has(self):
        cache = WalkForwardCache()
        cache.set("key1", "val")
        assert cache.has("key1")
        assert not cache.has("missing")

    def test_delete(self):
        cache = WalkForwardCache()
        cache.set("key1", "val")
        assert cache.delete("key1")
        assert not cache.delete("key1")

    def test_clear(self):
        cache = WalkForwardCache()
        cache.set("a", 1)
        cache.set("b", 2)
        count = cache.clear()
        assert count == 2
        assert cache.get("a") is None

    def test_ttl_expiry(self):
        cache = WalkForwardCache(ttl=1)
        cache.set("key1", "val")
        time.sleep(1.1)
        assert cache.get("key1") is None

    def test_stats(self):
        cache = WalkForwardCache()
        cache.set("a", 1)
        cache.get("a")
        cache.get("missing")
        stats = cache.stats()
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["size"] == 1

    def test_reset_stats(self):
        cache = WalkForwardCache()
        cache.get("missing")
        cache.reset_stats()
        stats = cache.stats()
        assert stats["hits"] == 0
        assert stats["misses"] == 0

    def test_lru_eviction(self):
        cache = WalkForwardCache(max_size=2)
        cache.set("a", 1)
        cache.set("b", 2)
        cache.set("c", 3)
        assert cache.get("a") is None
        assert cache.get("b") == 2
        assert cache.get("c") == 3

    def test_cleanup(self):
        cache = WalkForwardCache(ttl=1)
        cache.set("key1", "val")
        time.sleep(1.1)
        removed = cache.cleanup()
        assert removed == 1

    def test_window_cache(self):
        cache = WalkForwardCache()
        cache.cache_window_result("TUPRS", 0, {"result": "ok"})
        result = cache.get_window_result("TUPRS", 0)
        assert result == {"result": "ok"}

    def test_window_cache_miss(self):
        cache = WalkForwardCache()
        assert cache.get_window_result("TUPRS", 0) is None

    def test_get_cached_windows(self):
        cache = WalkForwardCache()
        cache.cache_window_result("TUPRS", 0, {})
        cache.cache_window_result("TUPRS", 2, {})
        indices = cache.get_cached_windows("TUPRS")
        assert 0 in indices
        assert 2 in indices

    def test_window_cache_stats(self):
        cache = WalkForwardCache()
        cache.cache_window_result("TUPRS", 0, {})
        stats = cache.stats()
        assert stats["window_cache_size"] == 1

    def test_overwrite_key(self):
        cache = WalkForwardCache()
        cache.set("key1", "old")
        cache.set("key1", "new")
        assert cache.get("key1") == "new"

    def test_reset_singleton(self):
        c1 = WalkForwardCache()
        reset_walk_forward_cache()
        c2 = WalkForwardCache()
        assert c1 is not c2
