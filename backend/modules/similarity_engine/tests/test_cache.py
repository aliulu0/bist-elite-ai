from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import time

import pytest

from modules.similarity_engine.cache.cache import SimilarityCache


class TestCacheInit:
    def test_defaults(self):
        cache = SimilarityCache()
        assert cache.size == 0
        assert cache.hits == 0
        assert cache.misses == 0
        assert cache.hit_rate == 0.0

    def test_custom_params(self):
        cache = SimilarityCache(max_size=10, ttl_seconds=5.0)
        assert cache.size == 0


class TestPutGet:
    def test_put_and_get(self):
        cache = SimilarityCache()
        cache.put("key1", "value1")
        assert cache.get("key1") == "value1"
        assert cache.size == 1

    def test_get_missing(self):
        cache = SimilarityCache()
        assert cache.get("missing") is None

    def test_overwrite(self):
        cache = SimilarityCache()
        cache.put("k", "v1")
        cache.put("k", "v2")
        assert cache.get("k") == "v2"
        assert cache.size == 1


class TestTTLExpiry:
    def test_expiry(self):
        cache = SimilarityCache(ttl_seconds=0.01)
        cache.put("k", "v")
        time.sleep(0.02)
        assert cache.get("k") is None
        assert cache.size == 0


class TestLRUEviction:
    def test_evicts_oldest(self):
        cache = SimilarityCache(max_size=2)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        assert cache.size == 2
        assert cache.get("a") is None
        assert cache.get("b") == 2
        assert cache.get("c") == 3

    def test_access_refreshes_lru(self):
        cache = SimilarityCache(max_size=2)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.get("a")
        cache.put("c", 3)
        assert cache.get("a") == 1
        assert cache.get("b") is None


class TestInvalidate:
    def test_invalidate_existing(self):
        cache = SimilarityCache()
        cache.put("k", "v")
        assert cache.invalidate("k") is True
        assert cache.get("k") is None

    def test_invalidate_missing(self):
        cache = SimilarityCache()
        assert cache.invalidate("k") is False


class TestClear:
    def test_clear(self):
        cache = SimilarityCache()
        cache.put("a", 1)
        cache.put("b", 2)
        cache.get("a")
        cache.clear()
        assert cache.size == 0
        assert cache.hits == 0
        assert cache.misses == 0


class TestHitRate:
    def test_hit_rate(self):
        cache = SimilarityCache()
        cache.put("a", 1)
        cache.get("a")
        cache.get("a")
        cache.get("missing")
        assert cache.hit_rate == pytest.approx(2.0 / 3.0)

    def test_hit_rate_empty(self):
        cache = SimilarityCache()
        assert cache.hit_rate == 0.0


class TestMakeKey:
    def test_deterministic(self):
        cache = SimilarityCache()
        k1 = cache.make_key("a", "b", x=1)
        k2 = cache.make_key("a", "b", x=1)
        assert k1 == k2

    def test_different_inputs_different_keys(self):
        cache = SimilarityCache()
        k1 = cache.make_key("a", "b")
        k2 = cache.make_key("a", "c")
        assert k1 != k2
