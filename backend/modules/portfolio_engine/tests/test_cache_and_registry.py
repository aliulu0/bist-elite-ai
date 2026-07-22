from __future__ import annotations

import sys
import os
import time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.portfolio_engine.cache.cache import PortfolioCache, reset_portfolio_cache
from modules.portfolio_engine.registry.registry import (
    PortfolioRegistry,
    get_registry,
    reset_registry,
)


@pytest.fixture(autouse=True)
def _reset_cache():
    reset_portfolio_cache()
    yield
    reset_portfolio_cache()


@pytest.fixture(autouse=True)
def _reset_reg():
    reset_registry()
    yield
    reset_registry()


class TestCacheInit:
    def test_singleton_returns_same(self):
        c1 = PortfolioCache()
        c2 = PortfolioCache()
        assert c1 is c2

    def test_default_ttl(self):
        c = PortfolioCache()
        assert c._ttl == 3600

    def test_custom_ttl(self):
        c = PortfolioCache(ttl=120, max_size=50)
        assert c._ttl == 120
        assert c._max_size == 50


class TestCachePutGet:
    def test_put_and_get(self):
        c = PortfolioCache()
        c.put("k1", {"data": 42})
        assert c.get("k1") == {"data": 42}

    def test_get_missing(self):
        c = PortfolioCache()
        assert c.get("nonexistent") is None

    def test_overwrite(self):
        c = PortfolioCache()
        c.put("k1", "old")
        c.put("k1", "new")
        assert c.get("k1") == "new"


class TestCacheTTLExpiry:
    def test_expired_entry_returns_none(self):
        c = PortfolioCache(ttl=0.01, max_size=100)
        c.put("k1", "value")
        time.sleep(0.02)
        assert c.get("k1") is None


class TestCacheLRU:
    def test_evicts_oldest_when_full(self):
        c = PortfolioCache(ttl=3600, max_size=3)
        c.put("a", 1)
        c.put("b", 2)
        c.put("c", 3)
        c.put("d", 4)
        assert c.get("a") is None
        assert c.get("b") == 2
        assert c.get("d") == 4

    def test_get_refreshes_lru_order(self):
        c = PortfolioCache(ttl=3600, max_size=3)
        c.put("a", 1)
        c.put("b", 2)
        c.put("c", 3)
        c.get("a")
        c.put("d", 4)
        assert c.get("a") == 1
        assert c.get("b") is None


class TestCacheInvalidate:
    def test_invalidate_existing(self):
        c = PortfolioCache()
        c.put("k1", "value")
        assert c.invalidate("k1") is True
        assert c.get("k1") is None

    def test_invalidate_missing(self):
        c = PortfolioCache()
        assert c.invalidate("nope") is False


class TestCacheClear:
    def test_clear_returns_count(self):
        c = PortfolioCache()
        c.put("a", 1)
        c.put("b", 2)
        assert c.clear() == 2

    def test_clear_empties_store(self):
        c = PortfolioCache()
        c.put("a", 1)
        c.clear()
        assert c.get("a") is None
        assert c.stats()["size"] == 0


class TestCacheHitRate:
    def test_hit_rate_no_accesses(self):
        c = PortfolioCache()
        assert c.hit_rate() == 0.0

    def test_hit_rate_all_hits(self):
        c = PortfolioCache()
        c.put("k1", "v")
        c.get("k1")
        assert c.hit_rate() == 1.0

    def test_hit_rate_mixed(self):
        c = PortfolioCache()
        c.put("k1", "v")
        c.get("k1")
        c.get("miss")
        assert c.hit_rate() == pytest.approx(0.5)

    def test_miss_increases_counter(self):
        c = PortfolioCache()
        c.get("nope")
        assert c._misses == 1
        assert c._hits == 0


class TestCacheMakeKey:
    def test_make_key_deterministic(self):
        c = PortfolioCache()
        k1 = c.make_key("2026-01-01", "month_3", 10, 2)
        k2 = c.make_key("2026-01-01", "month_3", 10, 2)
        assert k1 == k2

    def test_make_key_different_inputs(self):
        c = PortfolioCache()
        k1 = c.make_key("2026-01-01", "month_3", 10, 2)
        k2 = c.make_key("2026-02-01", "month_3", 10, 2)
        assert k1 != k2

    def test_make_key_is_string(self):
        c = PortfolioCache()
        key = c.make_key("2026-01-01", "month_3", 10, 2)
        assert isinstance(key, str)
        assert len(key) == 32


class TestCacheStats:
    def test_stats_structure(self):
        c = PortfolioCache(ttl=600, max_size=50)
        stats = c.stats()
        assert stats["size"] == 0
        assert stats["max_size"] == 50
        assert stats["hits"] == 0
        assert stats["misses"] == 0
        assert stats["hit_rate"] == 0.0
        assert stats["ttl_seconds"] == 600

    def test_stats_after_operations(self):
        c = PortfolioCache(ttl=3600, max_size=100)
        c.put("k1", "v1")
        c.get("k1")
        c.get("missing")
        stats = c.stats()
        assert stats["size"] == 1
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["hit_rate"] == pytest.approx(0.5)


class TestCacheReset:
    def test_reset_singleton(self):
        c1 = PortfolioCache()
        c1.put("k1", "v")
        reset_portfolio_cache()
        c2 = PortfolioCache()
        assert c1 is not c2
        assert c2.get("k1") is None


class TestRegistrySingleton:
    def test_singleton(self):
        r1 = PortfolioRegistry()
        r2 = PortfolioRegistry()
        assert r1 is r2

    def test_get_registry(self):
        r1 = get_registry()
        r2 = get_registry()
        assert r1 is r2


class TestRegistryReset:
    def test_reset_creates_new(self):
        r1 = PortfolioRegistry()
        reset_registry()
        r2 = PortfolioRegistry()
        assert r1 is not r2


class TestRegistryGetRanker:
    def test_get_ranker_returns_same(self):
        reg = PortfolioRegistry()
        r1 = reg.get_ranker()
        r2 = reg.get_ranker()
        assert r1 is r2

    def test_ranker_type(self):
        from modules.portfolio_engine.ranking.ranker import StockRanker
        reg = PortfolioRegistry()
        assert isinstance(reg.get_ranker(), StockRanker)


class TestRegistryGetSelector:
    def test_get_selector_returns_same(self):
        reg = PortfolioRegistry()
        s1 = reg.get_selector()
        s2 = reg.get_selector()
        assert s1 is s2

    def test_selector_type(self):
        from modules.portfolio_engine.selection.selector import PortfolioSelector
        reg = PortfolioRegistry()
        assert isinstance(reg.get_selector(), PortfolioSelector)


class TestRegistryGetDiversifier:
    def test_get_diversifier_returns_same(self):
        reg = PortfolioRegistry()
        d1 = reg.get_diversifier()
        d2 = reg.get_diversifier()
        assert d1 is d2

    def test_diversifier_type(self):
        from modules.portfolio_engine.diversification.diversifier import Diversifier
        reg = PortfolioRegistry()
        assert isinstance(reg.get_diversifier(), Diversifier)


class TestRegistryGetValidator:
    def test_get_validator_returns_same(self):
        reg = PortfolioRegistry()
        v1 = reg.get_validator()
        v2 = reg.get_validator()
        assert v1 is v2

    def test_validator_type(self):
        from modules.portfolio_engine.validators.validator import RequestValidator, ResultValidator
        reg = PortfolioRegistry()
        v = reg.get_validator()
        assert isinstance(v, tuple)
        assert isinstance(v[0], RequestValidator)
        assert isinstance(v[1], ResultValidator)


class TestRegistryGetReportGenerator:
    def test_get_report_generator_returns_same(self):
        reg = PortfolioRegistry()
        rg1 = reg.get_report_generator()
        rg2 = reg.get_report_generator()
        assert rg1 is rg2

    def test_report_generator_type(self):
        from modules.portfolio_engine.reports.generator import ReportGenerator
        reg = PortfolioRegistry()
        assert isinstance(reg.get_report_generator(), ReportGenerator)


class TestRegistryGetCache:
    def test_get_cache_returns_same(self):
        reg = PortfolioRegistry()
        c1 = reg.get_cache()
        c2 = reg.get_cache()
        assert c1 is c2

    def test_cache_type(self):
        reg = PortfolioRegistry()
        assert isinstance(reg.get_cache(), PortfolioCache)


class TestRegistryClear:
    def test_clear_resets_all(self):
        reg = PortfolioRegistry()
        reg.get_ranker()
        reg.get_selector()
        reg.clear()
        assert reg._ranker is None
        assert reg._selector is None
        assert reg._diversifier is None
        assert reg._validator is None
        assert reg._report_generator is None
        assert reg._cache is None

    def test_clear_allows_recreation(self):
        reg = PortfolioRegistry()
        r1 = reg.get_ranker()
        reg.clear()
        r2 = reg.get_ranker()
        assert r1 is not r2
