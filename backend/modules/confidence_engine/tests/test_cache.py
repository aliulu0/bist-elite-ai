import pytest
import time
from modules.confidence_engine.cache.cache import ConfidenceCache, reset_confidence_cache


@pytest.fixture(autouse=True)
def fresh_cache():
    reset_confidence_cache()
    yield
    reset_confidence_cache()


class TestConfidenceCache:
    def test_singleton(self):
        c1 = ConfidenceCache()
        c2 = ConfidenceCache()
        assert c1 is c2

    def test_set_get(self):
        cache = ConfidenceCache()
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_get_miss(self):
        cache = ConfidenceCache()
        assert cache.get("nonexistent") is None

    def test_has(self):
        cache = ConfidenceCache()
        cache.set("key1", "value1")
        assert cache.has("key1") is True

    def test_has_expired(self):
        reset_confidence_cache()
        cache = ConfidenceCache(ttl=0)
        cache.set("key1", "value1")
        time.sleep(0.01)
        assert cache.has("key1") is False

    def test_delete(self):
        cache = ConfidenceCache()
        cache.set("key1", "value1")
        assert cache.delete("key1") is True
        assert cache.get("key1") is None

    def test_delete_nonexistent(self):
        cache = ConfidenceCache()
        assert cache.delete("nonexistent") is False

    def test_clear(self):
        cache = ConfidenceCache()
        cache.set("a", 1)
        cache.set("b", 2)
        cleared = cache.clear()
        assert cleared == 2
        assert cache.get("a") is None

    def test_lru_eviction(self):
        cache = ConfidenceCache(max_size=2)
        cache.set("a", 1)
        cache.set("b", 2)
        cache.set("c", 3)
        assert cache.get("a") is None
        assert cache.get("b") == 2
        assert cache.get("c") == 3

    def test_hit_miss_stats(self):
        cache = ConfidenceCache()
        cache.set("a", 1)
        cache.get("a")
        cache.get("b")
        stats = cache.stats()
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["hit_rate"] == 0.5

    def test_cleanup(self):
        reset_confidence_cache()
        cache = ConfidenceCache(ttl=0)
        cache.set("a", 1)
        cache.set("b", 2)
        time.sleep(0.01)
        removed = cache.cleanup()
        assert removed == 2

    def test_overwrite(self):
        cache = ConfidenceCache()
        cache.set("a", 1)
        cache.set("a", 2)
        assert cache.get("a") == 2
        stats = cache.stats()
        assert stats["size"] == 1
