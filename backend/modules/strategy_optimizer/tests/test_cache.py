from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.strategy_optimizer.cache.cache import OptimizationCache


class TestOptimizationCacheConstruction:
    def test_init(self):
        cache = OptimizationCache()
        assert cache.size == 0
        assert cache.hits == 0
        assert cache.misses == 0

    def test_custom_params(self):
        cache = OptimizationCache(max_size=10, ttl_seconds=60.0)
        assert cache.size == 0


class TestPutAndGet:
    def test_put_and_get(self):
        cache = OptimizationCache()
        cache.put("key1", {"value": 42})
        result = cache.get("key1")
        assert result == {"value": 42}
        assert cache.hits == 1

    def test_get_miss(self):
        cache = OptimizationCache()
        result = cache.get("nonexistent")
        assert result is None
        assert cache.misses == 1

    def test_put_overwrite(self):
        cache = OptimizationCache()
        cache.put("key1", "old")
        cache.put("key1", "new")
        result = cache.get("key1")
        assert result == "new"
        assert cache.size == 1

    def test_lru_eviction(self):
        cache = OptimizationCache(max_size=3)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        cache.put("d", 4)
        assert cache.size == 3
        assert cache.get("a") is None

    def test_lru_access_prevents_eviction(self):
        cache = OptimizationCache(max_size=3)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        cache.get("a")
        cache.put("d", 4)
        assert cache.get("a") == 1
        assert cache.get("b") is None


class TestTTL:
    def test_expired_entry(self):
        import time
        cache = OptimizationCache(ttl_seconds=0.01)
        cache.put("key1", "value1")
        time.sleep(0.02)
        result = cache.get("key1")
        assert result is None


class TestInvalidate:
    def test_invalidate_existing(self):
        cache = OptimizationCache()
        cache.put("key1", "value1")
        result = cache.invalidate("key1")
        assert result is True
        assert cache.get("key1") is None

    def test_invalidate_nonexistent(self):
        cache = OptimizationCache()
        result = cache.invalidate("key1")
        assert result is False


class TestClear:
    def test_clear(self):
        cache = OptimizationCache()
        cache.put("a", 1)
        cache.put("b", 2)
        cache.clear()
        assert cache.size == 0
        assert cache.hits == 0
        assert cache.misses == 0


class TestHitRate:
    def test_hit_rate(self):
        cache = OptimizationCache()
        cache.put("a", 1)
        cache.get("a")
        cache.get("b")
        cache.get("c")
        assert abs(cache.hit_rate - 1 / 3) < 0.01

    def test_hit_rate_empty(self):
        cache = OptimizationCache()
        assert cache.hit_rate == 0.0


class TestMakeKey:
    def test_make_key_deterministic(self):
        cache = OptimizationCache()
        k1 = cache.make_key("a", "b")
        k2 = cache.make_key("a", "b")
        assert k1 == k2

    def test_make_key_different(self):
        cache = OptimizationCache()
        k1 = cache.make_key("a")
        k2 = cache.make_key("b")
        assert k1 != k2

    def test_make_key_with_kwargs(self):
        cache = OptimizationCache()
        k1 = cache.make_key("a", x=1)
        k2 = cache.make_key("a", x=2)
        assert k1 != k2
