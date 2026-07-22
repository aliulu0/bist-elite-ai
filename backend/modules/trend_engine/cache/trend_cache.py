from __future__ import annotations

import hashlib
import json
import time

from modules.trend_engine.core.types import IndicatorResult


class TrendCache:

    def __init__(self, max_size: int = 1000, ttl_seconds: int = 300) -> None:
        self._store: dict[str, tuple[IndicatorResult, float]] = {}
        self._max_size = max_size
        self._ttl_seconds = ttl_seconds
        self._hits = 0
        self._misses = 0

    @staticmethod
    def build_key(indicator: str, prices: list, params: dict) -> str:
        closes = [p.close for p in prices[-10:]]
        dates = [p.date for p in prices[-5:]]
        raw = json.dumps({
            "indicator": indicator,
            "closes": closes,
            "dates": dates,
            "params": params,
            "n": len(prices),
        }, sort_keys=True)
        return hashlib.md5(raw.encode()).hexdigest()

    def get(self, key: str) -> IndicatorResult | None:
        if key in self._store:
            result, ts = self._store[key]
            if time.time() - ts < self._ttl_seconds:
                self._hits += 1
                return result
            else:
                del self._store[key]
        self._misses += 1
        return None

    def set(self, key: str, result: IndicatorResult) -> None:
        if len(self._store) >= self._max_size:
            oldest_key = min(self._store, key=lambda k: self._store[k][1])
            del self._store[oldest_key]
        self._store[key] = (result, time.time())

    def clear(self) -> None:
        self._store.clear()
        self._hits = 0
        self._misses = 0

    def stats(self) -> dict:
        total = self._hits + self._misses
        return {
            "size": len(self._store),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_ratio": round(self._hits / total, 4) if total > 0 else 0.0,
        }
