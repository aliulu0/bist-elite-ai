from modules.explainability_engine.cache.cache import ExplanationCache, get_cache, reset_cache
from modules.explainability_engine.core.types import (
    ExplanationType, ExplanationLevel, Language, ExplanationResult,
)


class TestExplanationCache:
    def setup_method(self):
        self.cache = ExplanationCache(ttl=60, max_size=10)

    def test_set_and_get(self):
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        self.cache.set("TEST", ExplanationType.FUNDAMENTAL, ExplanationLevel.DETAILED, Language.ENGLISH, result)
        cached = self.cache.get("TEST", ExplanationType.FUNDAMENTAL, ExplanationLevel.DETAILED, Language.ENGLISH)
        assert cached is not None
        assert cached.symbol == "TEST"

    def test_get_miss(self):
        result = self.cache.get("MISS", ExplanationType.FUNDAMENTAL, ExplanationLevel.DETAILED, Language.ENGLISH)
        assert result is None

    def test_invalidate(self):
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        self.cache.set("TEST", ExplanationType.FUNDAMENTAL, ExplanationLevel.DETAILED, Language.ENGLISH, result)
        count = self.cache.invalidate("TEST")
        assert count == 1
        assert self.cache.get("TEST", ExplanationType.FUNDAMENTAL, ExplanationLevel.DETAILED, Language.ENGLISH) is None

    def test_clear(self):
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        self.cache.set("TEST", ExplanationType.FUNDAMENTAL, ExplanationLevel.DETAILED, Language.ENGLISH, result)
        assert self.cache.size == 1
        self.cache.clear()
        assert self.cache.size == 0

    def test_stats(self):
        stats = self.cache.stats()
        assert "size" in stats
        assert "hits" in stats
        assert "misses" in stats
        assert "hit_rate" in stats
        assert "ttl" in stats
        assert "max_size" in stats

    def test_max_size_lru(self):
        cache = ExplanationCache(ttl=60, max_size=3)
        for i in range(5):
            result = ExplanationResult(
                symbol=f"S{i}", explanation_type=ExplanationType.FUNDAMENTAL,
                level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
            )
            cache.set(f"S{i}", ExplanationType.FUNDAMENTAL, ExplanationLevel.DETAILED, Language.ENGLISH, result)
        assert cache.size <= 3

    def test_cleanup_expired(self):
        cache = ExplanationCache(ttl=0, max_size=100)
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        cache.set("TEST", ExplanationType.FUNDAMENTAL, ExplanationLevel.DETAILED, Language.ENGLISH, result)
        import time
        time.sleep(0.01)
        removed = cache.cleanup_expired()
        assert removed >= 1
        assert cache.size == 0

    def test_singleton_get_cache(self):
        cache1 = get_cache()
        cache2 = get_cache()
        assert cache1 is cache2

    def test_reset_cache(self):
        cache1 = get_cache()
        reset_cache()
        cache2 = get_cache()
        assert cache1 is not cache2

    def test_hit_rate_tracking(self):
        cache = ExplanationCache(ttl=60, max_size=10)
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        cache.set("TEST", ExplanationType.FUNDAMENTAL, ExplanationLevel.DETAILED, Language.ENGLISH, result)
        cache.get("TEST", ExplanationType.FUNDAMENTAL, ExplanationLevel.DETAILED, Language.ENGLISH)
        cache.get("MISS", ExplanationType.FUNDAMENTAL, ExplanationLevel.DETAILED, Language.ENGLISH)
        stats = cache.stats()
        assert stats["hits"] >= 1
        assert stats["misses"] >= 1
