import pytest
import time
from modules.backtest_engine.cache.cache import BacktestCache, reset_backtest_cache


@pytest.fixture(autouse=True)
def fresh_cache():
    reset_backtest_cache()
    yield
    reset_backtest_cache()


class TestBacktestCache:
    def test_singleton(self):
        c1 = BacktestCache()
        c2 = BacktestCache()
        assert c1 is c2

    def test_set_get(self):
        cache = BacktestCache()
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_get_miss(self):
        cache = BacktestCache()
        assert cache.get("nonexistent") is None

    def test_has(self):
        cache = BacktestCache()
        cache.set("key1", "value1")
        assert cache.has("key1") is True

    def test_has_expired(self):
        reset_backtest_cache()
        cache = BacktestCache(ttl=0)
        cache.set("key1", "value1")
        time.sleep(0.01)
        assert cache.has("key1") is False

    def test_delete(self):
        cache = BacktestCache()
        cache.set("key1", "value1")
        assert cache.delete("key1") is True
        assert cache.get("key1") is None

    def test_delete_nonexistent(self):
        cache = BacktestCache()
        assert cache.delete("nonexistent") is False

    def test_clear(self):
        cache = BacktestCache()
        cache.set("a", 1)
        cache.set("b", 2)
        cleared = cache.clear()
        assert cleared == 2
        assert cache.get("a") is None

    def test_lru_eviction(self):
        cache = BacktestCache(max_size=2)
        cache.set("a", 1)
        cache.set("b", 2)
        cache.set("c", 3)
        assert cache.get("a") is None
        assert cache.get("b") == 2
        assert cache.get("c") == 3

    def test_hit_miss_stats(self):
        cache = BacktestCache()
        cache.set("a", 1)
        cache.get("a")
        cache.get("b")
        stats = cache.stats()
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["hit_rate"] == 0.5

    def test_cleanup(self):
        reset_backtest_cache()
        cache = BacktestCache(ttl=0)
        cache.set("a", 1)
        cache.set("b", 2)
        time.sleep(0.01)
        removed = cache.cleanup()
        assert removed == 2

    def test_overwrite(self):
        cache = BacktestCache()
        cache.set("a", 1)
        cache.set("a", 2)
        assert cache.get("a") == 2
        stats = cache.stats()
        assert stats["size"] == 1

    def test_reset_stats(self):
        cache = BacktestCache()
        cache.set("a", 1)
        cache.get("a")
        cache.reset_stats()
        stats = cache.stats()
        assert stats["hits"] == 0
        assert stats["misses"] == 0
