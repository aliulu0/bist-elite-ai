from __future__ import annotations

import hashlib
import time
from collections import OrderedDict


class OpportunityCache:

    def __init__(self, ttl: int = 3600, max_size: int = 200) -> None:
        self._cache: OrderedDict[str, tuple[float, float, str]] = OrderedDict()
        self._ttl = ttl
        self._max_size = max_size
        self._hits = 0
        self._misses = 0

    def _make_key(self, symbol: str, params: dict | None = None) -> str:
        raw = f"{symbol.lower()}:{sorted((params or {}).items())}"
        return hashlib.md5(raw.encode()).hexdigest()

    def get(self, symbol: str, params: dict | None = None) -> dict | None:
        key = self._make_key(symbol, params)
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

    def set(self, symbol: str, value: dict, params: dict | None = None) -> None:
        key = self._make_key(symbol, params)
        self._cache[key] = (value, time.time(), symbol)
        self._cache.move_to_end(key)
        while len(self._cache) > self._max_size:
            self._cache.popitem(last=False)

    def invalidate(self, symbol: str) -> int:
        keys_to_remove = [
            k for k, (_, _, sym) in self._cache.items()
            if sym.lower() == symbol.lower()
        ]
        for k in keys_to_remove:
            del self._cache[k]
        return len(keys_to_remove)

    def invalidate_by_symbol(self, symbol: str) -> int:
        return self.invalidate(symbol)

    def clear(self) -> None:
        self._cache.clear()

    @property
    def size(self) -> int:
        return len(self._cache)

    @property
    def hit_rate(self) -> float:
        total = self._hits + self._misses
        return self._hits / total if total > 0 else 0.0

    @property
    def hits(self) -> int:
        return self._hits

    @property
    def misses(self) -> int:
        return self._misses

    def stats(self) -> dict:
        return {
            "size": self.size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": self.hit_rate,
            "ttl": self._ttl,
            "max_size": self._max_size,
        }

    def cleanup_expired(self) -> int:
        now = time.time()
        expired = [
            k for k, (_, ts, _) in self._cache.items()
            if now - ts >= self._ttl
        ]
        for k in expired:
            del self._cache[k]
        return len(expired)


_cache_instance: OpportunityCache | None = None


def get_cache() -> OpportunityCache:
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = OpportunityCache()
    return _cache_instance


def reset_cache() -> OpportunityCache:
    global _cache_instance
    _cache_instance = OpportunityCache()
    return _cache_instance
