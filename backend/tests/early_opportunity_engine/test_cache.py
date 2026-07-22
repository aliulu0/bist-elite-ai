import time
import pytest
from modules.early_opportunity_engine.cache.opportunity_cache import OpportunityCache


class TestOpportunityCache:
    def setup_method(self):
        self.cache = OpportunityCache(ttl=60, max_size=10)

    def test_get_miss(self):
        assert self.cache.get("TEST") is None

    def test_set_get(self):
        self.cache.set("TEST", {"score": 80.0})
        result = self.cache.get("TEST")
        assert result == {"score": 80.0}

    def test_ttl_expiry(self):
        cache = OpportunityCache(ttl=0)
        cache.set("TEST", {"score": 80.0})
        time.sleep(0.01)
        assert cache.get("TEST") is None

    def test_max_size(self):
        for i in range(15):
            self.cache.set(f"S{i}", {"i": i})
        assert self.cache.size <= 10

    def test_invalidate(self):
        self.cache.set("TEST", {"a": 1})
        removed = self.cache.invalidate("TEST")
        assert removed == 1
        assert self.cache.get("TEST") is None

    def test_invalidate_nonexistent(self):
        assert self.cache.invalidate("NONE") == 0

    def test_stats(self):
        self.cache.set("A", {"a": 1})
        self.cache.get("A")
        self.cache.get("B")
        stats = self.cache.stats()
        assert stats["hits"] >= 1
        assert stats["misses"] >= 1

    def test_clear(self):
        self.cache.set("A", {"a": 1})
        self.cache.clear()
        assert self.cache.size == 0

    def test_cleanup_expired(self):
        cache = OpportunityCache(ttl=0)
        cache.set("A", {"a": 1})
        time.sleep(0.01)
        removed = cache.cleanup_expired()
        assert removed == 1

    def test_hit_rate_empty(self):
        assert self.cache.hit_rate == 0.0

    def test_lru_eviction(self):
        cache = OpportunityCache(ttl=60, max_size=3)
        cache.set("A", {"a": 1})
        cache.set("B", {"b": 2})
        cache.set("C", {"c": 3})
        cache.set("D", {"d": 4})
        assert cache.size == 3
        assert cache.get("A") is None
