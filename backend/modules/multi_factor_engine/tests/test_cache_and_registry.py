from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import time

import pytest

from modules.multi_factor_engine.cache.cache import FactorCache
from modules.multi_factor_engine.registry.registry import (
    MultiFactorRegistry,
    get_registry,
    reset_registry,
)
from modules.multi_factor_engine.core.types import FactorGroup
from modules.multi_factor_engine.factors.calculators import BaseFactorCalculator
from modules.multi_factor_engine.ranking.ranker import FactorRanker
from modules.multi_factor_engine.profiles.generator import FactorProfileGenerator
from modules.multi_factor_engine.validators.validator import RequestValidator, ResultValidator


# ---------------------------------------------------------------------------
# FactorCache
# ---------------------------------------------------------------------------

class TestFactorCacheInit:
    def test_default_params(self):
        cache = FactorCache()
        stats = cache.stats()
        assert stats["max_size"] == 256
        assert stats["ttl_seconds"] == 300.0
        assert stats["size"] == 0
        assert stats["hits"] == 0
        assert stats["misses"] == 0

    def test_custom_params(self):
        cache = FactorCache(max_size=10, ttl_seconds=60.0)
        stats = cache.stats()
        assert stats["max_size"] == 10
        assert stats["ttl_seconds"] == 60.0


class TestFactorCachePutGet:
    def test_put_get_basic(self):
        cache = FactorCache()
        cache.put("k1", "v1")
        assert cache.get("k1") == "v1"

    def test_get_missing_key(self):
        cache = FactorCache()
        assert cache.get("missing") is None

    def test_overwrite_key(self):
        cache = FactorCache()
        cache.put("k1", "old")
        cache.put("k1", "new")
        assert cache.get("k1") == "new"

    def test_put_increases_size(self):
        cache = FactorCache()
        cache.put("k1", "v1")
        assert cache.stats()["size"] == 1

    def test_get_nonexistent_increases_misses(self):
        cache = FactorCache()
        cache.get("missing")
        assert cache.stats()["misses"] == 1
        assert cache.stats()["hits"] == 0

    def test_get_existing_increases_hits(self):
        cache = FactorCache()
        cache.put("k1", "v1")
        cache.get("k1")
        assert cache.stats()["hits"] == 1
        assert cache.stats()["misses"] == 0


class TestFactorCacheTTL:
    def test_ttl_expiry(self):
        cache = FactorCache(ttl_seconds=0.01)
        cache.put("k1", "v1")
        time.sleep(0.02)
        assert cache.get("k1") is None

    def test_ttl_not_expired(self):
        cache = FactorCache(ttl_seconds=1.0)
        cache.put("k1", "v1")
        assert cache.get("k1") == "v1"


class TestFactorCacheLRU:
    def test_lru_eviction(self):
        cache = FactorCache(max_size=3)
        cache.put("k1", "v1")
        cache.put("k2", "v2")
        cache.put("k3", "v3")
        cache.put("k4", "v4")
        assert cache.get("k1") is None
        assert cache.get("k4") == "v4"

    def test_lru_access_prevents_eviction(self):
        cache = FactorCache(max_size=3)
        cache.put("k1", "v1")
        cache.put("k2", "v2")
        cache.put("k3", "v3")
        cache.get("k1")
        cache.put("k4", "v4")
        assert cache.get("k1") == "v1"
        assert cache.get("k2") is None

    def test_lru_size_stays_at_max(self):
        cache = FactorCache(max_size=2)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        assert cache.stats()["size"] == 2


class TestFactorCacheInvalidate:
    def test_invalidate_existing(self):
        cache = FactorCache()
        cache.put("k1", "v1")
        assert cache.invalidate("k1") is True
        assert cache.get("k1") is None

    def test_invalidate_nonexistent(self):
        cache = FactorCache()
        assert cache.invalidate("missing") is False


class TestFactorCacheClear:
    def test_clear(self):
        cache = FactorCache()
        cache.put("k1", "v1")
        cache.get("k1")
        cache.clear()
        assert cache.stats()["size"] == 0
        assert cache.stats()["hits"] == 0
        assert cache.stats()["misses"] == 0

    def test_clear_after_ttl_expiry(self):
        cache = FactorCache(ttl_seconds=0.01)
        cache.put("k1", "v1")
        time.sleep(0.02)
        cache.clear()
        stats = cache.stats()
        assert stats["size"] == 0


class TestFactorCacheHitRate:
    def test_hit_rate_empty(self):
        cache = FactorCache()
        assert cache.hit_rate() == 0.0

    def test_hit_rate_calculation(self):
        cache = FactorCache()
        cache.put("k1", "v1")
        cache.get("k1")
        cache.get("k1")
        cache.get("missing")
        assert abs(cache.hit_rate() - 2 / 3) < 1e-6


class TestFactorCacheMakeKey:
    def test_make_key_basic(self):
        cache = FactorCache()
        key = cache.make_key("AAPL", "2024-01-01")
        assert key == "AAPL|2024-01-01"

    def test_make_key_with_kwargs(self):
        cache = FactorCache()
        key = cache.make_key("AAPL", "2024-01-01", horizon="month_3")
        assert key == "AAPL|2024-01-01|horizon=month_3"

    def test_make_key_kwargs_sorted(self):
        cache = FactorCache()
        key = cache.make_key("AAPL", "2024-01-01", z="last", a="first")
        assert key == "AAPL|2024-01-01|a=first|z=last"


class TestFactorCacheStats:
    def test_stats_keys(self):
        cache = FactorCache()
        stats = cache.stats()
        expected_keys = {"size", "max_size", "ttl_seconds", "hits", "misses", "hit_rate"}
        assert set(stats.keys()) == expected_keys

    def test_stats_after_operations(self):
        cache = FactorCache(max_size=5)
        cache.put("k1", "v1")
        cache.put("k2", "v2")
        cache.get("k1")
        cache.get("missing")
        stats = cache.stats()
        assert stats["size"] == 2
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["hit_rate"] == 0.5


# ---------------------------------------------------------------------------
# MultiFactorRegistry
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _reset_registry():
    reset_registry()
    yield
    reset_registry()


class TestRegistrySingleton:
    def test_get_registry_returns_same_instance(self):
        r1 = get_registry()
        r2 = get_registry()
        assert r1 is r2

    def test_reset_registry_returns_new_instance(self):
        r1 = get_registry()
        reset_registry()
        r2 = get_registry()
        assert r1 is not r2


class TestRegistryGetters:
    def test_get_calculator_valid_group(self):
        reg = get_registry()
        calc = reg.get_calculator(FactorGroup.VALUE)
        assert calc is not None
        assert isinstance(calc, BaseFactorCalculator)

    def test_get_calculator_invalid_group(self):
        reg = get_registry()
        calc = reg.get_calculator("nonexistent")
        assert calc is None

    def test_get_all_calculators(self):
        reg = get_registry()
        all_calcs = reg.get_all_calculators()
        assert len(all_calcs) == 12

    def test_get_ranker(self):
        reg = get_registry()
        ranker = reg.get_ranker()
        assert isinstance(ranker, FactorRanker)

    def test_get_profile_generator(self):
        reg = get_registry()
        gen = reg.get_profile_generator()
        assert isinstance(gen, FactorProfileGenerator)

    def test_get_request_validator(self):
        reg = get_registry()
        val = reg.get_request_validator()
        assert isinstance(val, RequestValidator)

    def test_get_result_validator(self):
        reg = get_registry()
        val = reg.get_result_validator()
        assert isinstance(val, ResultValidator)

    def test_get_cache(self):
        reg = get_registry()
        cache = reg.get_cache()
        assert isinstance(cache, FactorCache)

    def test_same_ranker_instance(self):
        reg = get_registry()
        r1 = reg.get_ranker()
        r2 = reg.get_ranker()
        assert r1 is r2
