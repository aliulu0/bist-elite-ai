from __future__ import annotations

import time
import pytest
from modules.pattern_engine.cache.pattern_cache import PatternCache
from modules.pattern_engine.core.types import PriceBar


class TestPatternCache:
    def test_set_and_get(self):
        cache = PatternCache()
        cache.set("hammer", "hash1", {}, ["result1"])
        val = cache.get("hammer", "hash1", {})
        assert val == ["result1"]

    def test_get_miss(self):
        cache = PatternCache()
        assert cache.get("hammer", "hash1", {}) is None

    def test_ttl_expiry(self):
        cache = PatternCache(ttl_seconds=1)
        cache.set("hammer", "hash1", {}, ["result1"])
        time.sleep(1.1)
        assert cache.get("hammer", "hash1", {}) is None

    def test_max_size_eviction(self):
        cache = PatternCache(max_size=3)
        cache.set("a", "h1", {}, [1])
        cache.set("b", "h1", {}, [2])
        cache.set("c", "h1", {}, [3])
        cache.set("d", "h1", {}, [4])
        assert cache.size == 3

    def test_invalidate_all(self):
        cache = PatternCache()
        cache.set("a", "h1", {}, [1])
        cache.set("b", "h1", {}, [2])
        count = cache.invalidate()
        assert count == 2
        assert cache.size == 0

    def test_invalidate_pattern(self):
        cache = PatternCache()
        cache.set("hammer", "h1", {}, [1])
        cache.set("doji", "h1", {}, [2])
        count = cache.invalidate("hammer")
        assert count == 1
        assert cache.get("hammer", "h1", {}) is None
        assert cache.get("doji", "h1", {}) == [2]

    def test_cleanup(self):
        cache = PatternCache(ttl_seconds=1)
        cache.set("a", "h1", {}, [1])
        cache.set("b", "h1", {}, [2])
        time.sleep(1.1)
        removed = cache.cleanup()
        assert removed == 2
        assert cache.size == 0

    def test_hash_prices_empty(self):
        assert PatternCache.hash_prices([]) == "empty"

    def test_hash_prices_deterministic(self):
        bars = [
            PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100),
            PriceBar(date="2024-01-02", open=101, high=102, low=100, close=101),
        ]
        h1 = PatternCache.hash_prices(bars)
        h2 = PatternCache.hash_prices(bars)
        assert h1 == h2

    def test_different_prices_different_hash(self):
        bars1 = [PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100)]
        bars2 = [PriceBar(date="2024-01-01", open=100, high=102, low=98, close=100)]
        assert PatternCache.hash_prices(bars1) != PatternCache.hash_prices(bars2)

    def test_params_change_key(self):
        cache = PatternCache()
        cache.set("hammer", "h1", {"tolerance": 0.01}, [1])
        cache.set("hammer", "h1", {"tolerance": 0.02}, [2])
        assert cache.get("hammer", "h1", {"tolerance": 0.01}) == [1]
        assert cache.get("hammer", "h1", {"tolerance": 0.02}) == [2]
