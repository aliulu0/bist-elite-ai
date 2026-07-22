from modules.scoring_engine.cache.cache import ScoringCache, get_cache, reset_cache
from modules.scoring_engine.core.types import (
    ScoreType, WeightProfile, InvestmentHorizon, MarketRegime, ScoreResult,
)


class TestScoringCache:
    def setup_method(self):
        self.cache = ScoringCache(ttl=60, max_size=10)

    def test_set_and_get(self):
        result = ScoreResult(symbol="TEST")
        self.cache.set("TEST", WeightProfile.BALANCED, InvestmentHorizon.ONE_MONTH, MarketRegime.SIDEWAYS, result)
        cached = self.cache.get("TEST", WeightProfile.BALANCED, InvestmentHorizon.ONE_MONTH, MarketRegime.SIDEWAYS)
        assert cached is not None
        assert cached.symbol == "TEST"

    def test_get_miss(self):
        assert self.cache.get("MISS", WeightProfile.BALANCED, InvestmentHorizon.ONE_MONTH, MarketRegime.SIDEWAYS) is None

    def test_invalidate(self):
        result = ScoreResult(symbol="TEST")
        self.cache.set("TEST", WeightProfile.BALANCED, InvestmentHorizon.ONE_MONTH, MarketRegime.SIDEWAYS, result)
        count = self.cache.invalidate("TEST")
        assert count >= 1
        assert self.cache.size == 0

    def test_clear(self):
        result = ScoreResult(symbol="TEST")
        self.cache.set("TEST", WeightProfile.BALANCED, InvestmentHorizon.ONE_MONTH, MarketRegime.SIDEWAYS, result)
        self.cache.clear()
        assert self.cache.size == 0

    def test_stats(self):
        stats = self.cache.stats()
        assert "size" in stats
        assert "hits" in stats

    def test_max_size_lru(self):
        cache = ScoringCache(ttl=60, max_size=3)
        for i in range(5):
            cache.set(f"S{i}", WeightProfile.BALANCED, InvestmentHorizon.ONE_MONTH, MarketRegime.SIDEWAYS, ScoreResult(symbol=f"S{i}"))
        assert cache.size <= 3

    def test_cleanup_expired(self):
        cache = ScoringCache(ttl=0, max_size=100)
        cache.set("TEST", WeightProfile.BALANCED, InvestmentHorizon.ONE_MONTH, MarketRegime.SIDEWAYS, ScoreResult(symbol="TEST"))
        import time
        time.sleep(0.01)
        cache.cleanup_expired()
        assert cache.size == 0

    def test_hit_rate(self):
        result = ScoreResult(symbol="TEST")
        self.cache.set("TEST", WeightProfile.BALANCED, InvestmentHorizon.ONE_MONTH, MarketRegime.SIDEWAYS, result)
        self.cache.get("TEST", WeightProfile.BALANCED, InvestmentHorizon.ONE_MONTH, MarketRegime.SIDEWAYS)
        self.cache.get("MISS", WeightProfile.BALANCED, InvestmentHorizon.ONE_MONTH, MarketRegime.SIDEWAYS)
        stats = self.cache.stats()
        assert stats["hits"] >= 1
        assert stats["misses"] >= 1

    def test_singleton(self):
        assert get_cache() is get_cache()

    def test_reset(self):
        c1 = get_cache()
        reset_cache()
        c2 = get_cache()
        assert c1 is not c2
