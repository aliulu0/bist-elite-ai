from __future__ import annotations

import sys
import os
import time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.position_sizing_engine.cache.cache import (
    PositionSizingCache,
    reset_position_sizing_cache,
)
from modules.position_sizing_engine.core.types import (
    InvestmentHorizon,
    PositionGrade,
    PositionInput,
    PositionSizing,
    PositionSizingRequest,
    PositionSizingResult,
    RiskProfile,
)
from modules.position_sizing_engine.validators.validator import (
    RequestValidator,
    ResultValidator,
)


def _make_positions():
    return [
        PositionInput(symbol="THYAO", sector="aviation", elite_score=85, confidence=75, risk=30, liquidity=70, avg_daily_volume=1000000, atr=2.5, volatility=25, beta=1.1, market_regime="bull", sector_exposure=15, correlation=0.3, agreement_score=0.8, price=100),
        PositionInput(symbol="GARAN", sector="banking", elite_score=78, confidence=68, risk=40, liquidity=65, avg_daily_volume=800000, atr=3.0, volatility=30, beta=1.2, market_regime="bull", sector_exposure=20, correlation=0.4, agreement_score=0.7, price=50),
        PositionInput(symbol="ASELS", sector="defense", elite_score=72, confidence=62, risk=35, liquidity=55, avg_daily_volume=500000, atr=2.0, volatility=22, beta=0.9, market_regime="sideways", sector_exposure=10, correlation=0.2, agreement_score=0.6, price=80),
        PositionInput(symbol="SISE", sector="glass", elite_score=68, confidence=58, risk=45, liquidity=50, avg_daily_volume=300000, atr=3.5, volatility=35, beta=1.3, market_regime="bull", sector_exposure=12, correlation=0.5, agreement_score=0.5, price=40),
        PositionInput(symbol="SAHOL", sector="banking", elite_score=35, confidence=25, risk=70, liquidity=30, avg_daily_volume=200000, atr=4.0, volatility=40, beta=1.5, market_regime="bear", sector_exposure=25, correlation=0.6, agreement_score=0.3, price=20),
    ]


def _make_request(positions=None):
    return PositionSizingRequest(
        reference_date="2025-01-01",
        horizon=InvestmentHorizon.MONTH_3,
        risk_profile=RiskProfile.BALANCED,
        total_capital=100000.0,
        positions=positions if positions is not None else _make_positions(),
        max_sector_exposure=30.0,
        max_correlation=0.7,
    )


@pytest.fixture(autouse=True)
def fresh_cache():
    reset_position_sizing_cache()
    yield
    reset_position_sizing_cache()


class TestCacheInit:
    def test_singleton(self):
        c1 = PositionSizingCache()
        c2 = PositionSizingCache()
        assert c1 is c2

    def test_default_params(self):
        cache = PositionSizingCache()
        stats = cache.stats()
        assert stats["ttl_seconds"] == 3600
        assert stats["max_size"] == 200

    def test_custom_params(self):
        reset_position_sizing_cache()
        cache = PositionSizingCache(ttl=60, max_size=10)
        stats = cache.stats()
        assert stats["ttl_seconds"] == 60
        assert stats["max_size"] == 10
        reset_position_sizing_cache()


class TestCachePutGet:
    def test_put_and_get(self):
        cache = PositionSizingCache()
        cache.put("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_get_missing_key(self):
        cache = PositionSizingCache()
        assert cache.get("nonexistent") is None

    def test_put_overwrites(self):
        cache = PositionSizingCache()
        cache.put("k", "v1")
        cache.put("k", "v2")
        assert cache.get("k") == "v2"

    def test_put_complex_value(self):
        cache = PositionSizingCache()
        data = {"positions": [1, 2, 3]}
        cache.put("complex", data)
        assert cache.get("complex") == data


class TestCacheTTL:
    def test_ttl_expiry(self):
        reset_position_sizing_cache()
        cache = PositionSizingCache(ttl=0.01)
        cache.put("expire", "data")
        assert cache.get("expire") == "data"
        time.sleep(0.02)
        assert cache.get("expire") is None
        reset_position_sizing_cache()

    def test_not_expired_within_ttl(self):
        reset_position_sizing_cache()
        cache = PositionSizingCache(ttl=10)
        cache.put("alive", "data")
        time.sleep(0.01)
        assert cache.get("alive") == "data"
        reset_position_sizing_cache()


class TestCacheLRU:
    def test_lru_eviction(self):
        reset_position_sizing_cache()
        cache = PositionSizingCache(ttl=3600, max_size=3)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        cache.put("d", 4)
        assert cache.get("a") is None
        assert cache.get("b") == 2
        assert cache.get("c") == 3
        assert cache.get("d") == 4
        reset_position_sizing_cache()

    def test_access_refreshes_lru(self):
        reset_position_sizing_cache()
        cache = PositionSizingCache(ttl=3600, max_size=3)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        cache.get("a")
        cache.put("d", 4)
        assert cache.get("a") == 1
        assert cache.get("b") is None
        reset_position_sizing_cache()


class TestCacheInvalidate:
    def test_invalidate_existing(self):
        cache = PositionSizingCache()
        cache.put("inv", "data")
        assert cache.invalidate("inv") is True
        assert cache.get("inv") is None

    def test_invalidate_nonexistent(self):
        cache = PositionSizingCache()
        assert cache.invalidate("nope") is False


class TestCacheClear:
    def test_clear_returns_count(self):
        cache = PositionSizingCache()
        cache.put("x", 1)
        cache.put("y", 2)
        count = cache.clear()
        assert count == 2
        assert cache.get("x") is None

    def test_clear_empty(self):
        cache = PositionSizingCache()
        cache.clear()
        count = cache.clear()
        assert count == 0


class TestCacheHitRate:
    def test_hit_rate_no_access(self):
        cache = PositionSizingCache()
        assert cache.hit_rate() == 0.0

    def test_hit_rate_mixed(self):
        cache = PositionSizingCache()
        cache.put("a", 1)
        cache.get("a")
        cache.get("miss")
        rate = cache.hit_rate()
        assert abs(rate - 0.5) < 1e-9


class TestCacheMakeKey:
    def test_make_key_deterministic(self):
        cache = PositionSizingCache()
        k1 = cache.make_key("2025-01-01", "month_3", "balanced", 100000.0, 5)
        k2 = cache.make_key("2025-01-01", "month_3", "balanced", 100000.0, 5)
        assert k1 == k2

    def test_make_key_different_inputs(self):
        cache = PositionSizingCache()
        k1 = cache.make_key("2025-01-01", "month_3", "balanced", 100000.0, 5)
        k2 = cache.make_key("2025-01-02", "month_3", "balanced", 100000.0, 5)
        assert k1 != k2


class TestCacheStats:
    def test_stats_keys(self):
        cache = PositionSizingCache()
        stats = cache.stats()
        assert "size" in stats
        assert "max_size" in stats
        assert "hits" in stats
        assert "misses" in stats
        assert "hit_rate" in stats
        assert "ttl_seconds" in stats

    def test_stats_after_operations(self):
        cache = PositionSizingCache()
        cache.put("a", 1)
        cache.get("a")
        cache.get("miss")
        stats = cache.stats()
        assert stats["size"] >= 1
        assert stats["hits"] >= 1
        assert stats["misses"] >= 1


class TestRequestValidator:
    def setup_method(self):
        self.validator = RequestValidator()

    def test_valid_request(self):
        req = _make_request()
        errors = self.validator.validate(req)
        assert errors == []

    def test_empty_positions(self):
        req = _make_request(positions=[])
        errors = self.validator.validate(req)
        assert any("empty" in e.lower() for e in errors)

    def test_missing_reference_date(self):
        req = _make_request()
        req.reference_date = ""
        errors = self.validator.validate(req)
        assert any("reference date" in e.lower() for e in errors)

    def test_zero_capital(self):
        req = _make_request()
        req.total_capital = 0.0
        errors = self.validator.validate(req)
        assert any("capital" in e.lower() for e in errors)

    def test_negative_capital(self):
        req = _make_request()
        req.total_capital = -1000.0
        errors = self.validator.validate(req)
        assert any("capital" in e.lower() for e in errors)

    def test_invalid_sector_exposure(self):
        req = _make_request()
        req.max_sector_exposure = 0.0
        errors = self.validator.validate(req)
        assert any("sector exposure" in e.lower() for e in errors)

    def test_sector_exposure_over_100(self):
        req = _make_request()
        req.max_sector_exposure = 150.0
        errors = self.validator.validate(req)
        assert any("sector exposure" in e.lower() for e in errors)

    def test_invalid_correlation(self):
        req = _make_request()
        req.max_correlation = 1.5
        errors = self.validator.validate(req)
        assert any("correlation" in e.lower() for e in errors)

    def test_negative_correlation(self):
        req = _make_request()
        req.max_correlation = -0.5
        errors = self.validator.validate(req)
        assert any("correlation" in e.lower() for e in errors)

    def test_position_with_out_of_range_elite_score(self):
        pos = PositionInput(symbol="BAD", elite_score=150, confidence=50, risk=50)
        req = _make_request(positions=[pos])
        errors = self.validator.validate(req)
        assert any("elite score" in e.lower() for e in errors)

    def test_position_with_negative_risk(self):
        pos = PositionInput(symbol="BAD", elite_score=50, confidence=50, risk=-10)
        req = _make_request(positions=[pos])
        errors = self.validator.validate(req)
        assert any("risk" in e.lower() for e in errors)

    def test_is_valid_true(self):
        req = _make_request()
        assert self.validator.is_valid(req) is True

    def test_is_valid_false(self):
        req = _make_request(positions=[])
        assert self.validator.is_valid(req) is False


class TestResultValidator:
    def setup_method(self):
        self.validator = ResultValidator()

    def _make_position(self, symbol="T", pct=5.0):
        return PositionSizing(
            symbol=symbol,
            recommended_pct=pct,
            min_pct=1.0,
            max_pct=15.0,
            position_grade=PositionGrade.B,
        )

    def test_valid_result(self):
        result = PositionSizingResult(
            positions=[self._make_position()],
            execution_time_ms=10.0,
        )
        errors = self.validator.validate_result(result)
        assert errors == []

    def test_empty_positions(self):
        result = PositionSizingResult(positions=[], execution_time_ms=10.0)
        errors = self.validator.validate_result(result)
        assert any("no positions" in e.lower() for e in errors)

    def test_negative_execution_time(self):
        result = PositionSizingResult(
            positions=[self._make_position()],
            execution_time_ms=-1.0,
        )
        errors = self.validator.validate_result(result)
        assert any("execution time" in e.lower() for e in errors)

    def test_valid_position(self):
        pos = self._make_position()
        errors = self.validator.validate_position(pos)
        assert errors == []

    def test_position_without_symbol(self):
        pos = PositionSizing(symbol="", recommended_pct=5.0, min_pct=1.0, max_pct=15.0)
        errors = self.validator.validate_position(pos)
        assert any("symbol" in e.lower() for e in errors)

    def test_negative_recommended_pct(self):
        pos = self._make_position()
        pos.recommended_pct = -1.0
        errors = self.validator.validate_position(pos)
        assert any("non-negative" in e.lower() for e in errors)

    def test_below_min_pct(self):
        pos = self._make_position(pct=0.5)
        errors = self.validator.validate_position(pos)
        assert any("minimum" in e.lower() for e in errors)

    def test_above_max_pct(self):
        pos = self._make_position(pct=20.0)
        errors = self.validator.validate_position(pos)
        assert any("exceeds maximum" in e.lower() for e in errors)

    def test_negative_min_pct(self):
        pos = self._make_position()
        pos.min_pct = -1.0
        errors = self.validator.validate_position(pos)
        assert any("min percentage" in e.lower() for e in errors)

    def test_zero_max_pct(self):
        pos = self._make_position()
        pos.max_pct = 0.0
        errors = self.validator.validate_position(pos)
        assert any("max percentage" in e.lower() for e in errors)

    def test_grade_score_ranges(self):
        for grade in PositionGrade:
            pos = PositionSizing(symbol="G", recommended_pct=5.0, min_pct=1.0, max_pct=15.0, position_grade=grade)
            errors = self.validator.validate_position(pos)
            grade_errors = [e for e in errors if "grade" in e.lower()]
            assert len(grade_errors) == 0
