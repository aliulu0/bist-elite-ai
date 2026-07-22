from __future__ import annotations

import hashlib
import time
from collections import OrderedDict
from modules.scoring_engine.core.types import (
    ScoreType, WeightProfile, InvestmentHorizon, MarketRegime, ScoreResult,
)


class ScoringCache:

    def __init__(self, ttl: int = 3600, max_size: int = 500) -> None:
        self._cache: OrderedDict[str, tuple[float, ScoreResult, str]] = OrderedDict()
        self._ttl = ttl
        self._max_size = max_size
        self._hits = 0
        self._misses = 0

    def _make_key(
        self, symbol: str, profile: WeightProfile,
        horizon: InvestmentHorizon, regime: MarketRegime,
    ) -> str:
        raw = f"{symbol.lower()}:{profile.value}:{horizon.value}:{regime.value}"
        return hashlib.md5(raw.encode()).hexdigest()

    def get(
        self, symbol: str, profile: WeightProfile,
        horizon: InvestmentHorizon, regime: MarketRegime,
    ) -> ScoreResult | None:
        key = self._make_key(symbol, profile, horizon, regime)
        if key in self._cache:
            value, ts, _ = self._cache[key]
            if time.time() - ts < self._ttl:
                self._cache.move_to_end(key)
                self._hits += 1
                return value
            else:
                del self._cache[key]
        self._misses += 1
        return None

    def set(
        self, symbol: str, profile: WeightProfile,
        horizon: InvestmentHorizon, regime: MarketRegime,
        result: ScoreResult,
    ) -> None:
        key = self._make_key(symbol, profile, horizon, regime)
        self._cache[key] = (result, time.time(), symbol)
        self._cache.move_to_end(key)
        while len(self._cache) > self._max_size:
            self._cache.popitem(last=False)

    def invalidate(self, symbol: str) -> int:
        keys = [k for k, (_, _, sym) in self._cache.items() if sym.lower() == symbol.lower()]
        for k in keys:
            del self._cache[k]
        return len(keys)

    def clear(self) -> None:
        self._cache.clear()

    @property
    def size(self) -> int:
        return len(self._cache)

    @property
    def hit_rate(self) -> float:
        total = self._hits + self._misses
        return self._hits / total if total > 0 else 0.0

    def stats(self) -> dict:
        return {
            "size": self.size, "hits": self._hits, "misses": self._misses,
            "hit_rate": round(self.hit_rate, 4), "ttl": self._ttl, "max_size": self._max_size,
        }

    def cleanup_expired(self) -> int:
        now = time.time()
        expired = [k for k, (_, ts, _) in self._cache.items() if now - ts >= self._ttl]
        for k in expired:
            del self._cache[k]
        return len(expired)


_cache_instance: ScoringCache | None = None


def get_cache() -> ScoringCache:
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = ScoringCache()
    return _cache_instance


def reset_cache() -> ScoringCache:
    global _cache_instance
    _cache_instance = ScoringCache()
    return _cache_instance
