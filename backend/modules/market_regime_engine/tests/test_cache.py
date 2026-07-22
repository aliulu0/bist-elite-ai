from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import time

import pytest

from modules.market_regime_engine.cache.cache import RegimeCache


class TestRegimeCacheInit:
    def test_default_init(self):
        cache = RegimeCache()
        assert cache.size == 0
        assert cache.hits == 0
        assert cache.misses == 0
        assert cache.hit_rate == 0.0

    def test_custom_init(self):
        cache = RegimeCache(max_size=10, ttl_seconds=60.0)
        assert cache.size == 0


class TestPutAndGet:
    def test_put_and_get(self):
        cache = RegimeCache()
        cache.put("key1", "value1")
        assert cache.get("key1") == "value1"
        assert cache.size == 1

    def test_get_missing_key(self):
        cache = RegimeCache()
        assert cache.get("nonexistent") is None
        assert cache.misses == 1

    def test_overwrite_key(self):
        cache = RegimeCache()
        cache.put("key1", "value1")
        cache.put("key1", "value2")
        assert cache.get("key1") == "value2"
        assert cache.size == 1

    def test_multiple_entries(self):
        cache = RegimeCache()
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        assert cache.get("a") == 1
        assert cache.get("b") == 2
        assert cache.get("c") == 3
        assert cache.size == 3


class TestTTL:
    def test_entry_expires(self):
        cache = RegimeCache(ttl_seconds=0.01)
        cache.put("key1", "value1")
        time.sleep(0.02)
        assert cache.get("key1") is None
        assert cache.misses == 1

    def test_entry_valid_before_ttl(self):
        cache = RegimeCache(ttl_seconds=1.0)
        cache.put("key1", "value1")
        assert cache.get("key1") == "value1"
        assert cache.hits == 1


class TestLRUEviction:
    def test_evicts_when_full(self):
        cache = RegimeCache(max_size=3)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        cache.put("d", 4)
        assert cache.size == 3
        assert cache.get("a") is None
        assert cache.get("b") == 2
        assert cache.get("d") == 4

    def test_access_prevents_eviction(self):
        cache = RegimeCache(max_size=3)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        cache.get("a")
        cache.put("d", 4)
        assert cache.get("a") == 1
        assert cache.get("b") is None

    def test_overwrite_does_not_grow(self):
        cache = RegimeCache(max_size=2)
        cache.put("a", 1)
        cache.put("a", 2)
        cache.put("b", 3)
        assert cache.size == 2


class TestInvalidate:
    def test_invalidate_existing(self):
        cache = RegimeCache()
        cache.put("key1", "value1")
        assert cache.invalidate("key1") is True
        assert cache.get("key1") is None
        assert cache.size == 0

    def test_invalidate_nonexistent(self):
        cache = RegimeCache()
        assert cache.invalidate("nonexistent") is False


class TestClear:
    def test_clear(self):
        cache = RegimeCache()
        cache.put("a", 1)
        cache.put("b", 2)
        cache.get("a")
        cache.get("missing")
        cache.clear()
        assert cache.size == 0
        assert cache.hits == 0
        assert cache.misses == 0
        assert cache.hit_rate == 0.0


class TestHitRate:
    def test_hit_rate(self):
        cache = RegimeCache()
        cache.put("a", 1)
        cache.get("a")
        cache.get("a")
        cache.get("missing")
        assert cache.hits == 2
        assert cache.misses == 1
        assert cache.hit_rate == pytest.approx(2 / 3)

    def test_hit_rate_no_access(self):
        cache = RegimeCache()
        assert cache.hit_rate == 0.0


class TestMakeKey:
    def test_deterministic(self):
        cache = RegimeCache()
        key1 = cache.make_key("a", "b")
        key2 = cache.make_key("a", "b")
        assert key1 == key2

    def test_different_args_different_keys(self):
        cache = RegimeCache()
        key1 = cache.make_key("a")
        key2 = cache.make_key("b")
        assert key1 != key2

    def test_returns_string(self):
        cache = RegimeCache()
        key = cache.make_key(1, 2, 3)
        assert isinstance(key, str)
        assert len(key) == 32

    def test_kwargs(self):
        cache = RegimeCache()
        key1 = cache.make_key(x=1, y=2)
        key2 = cache.make_key(y=2, x=1)
        assert key1 == key2
