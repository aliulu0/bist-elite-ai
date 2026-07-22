from __future__ import annotations

import hashlib
import json
import time
from collections import OrderedDict


class StrategyCache:

    def __init__(
        self,
        max_size: int = 500,
        ttl_seconds: int = 300,
    ) -> None:
        self._max_size = max_size
        self._ttl = ttl_seconds
        self._cache: OrderedDict[str, tuple[any, float, str]] = OrderedDict()
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> any | None:
        if key in self._cache:
            value, ts, name = self._cache[key]
            if time.time() - ts < self._ttl:
                self._cache.move_to_end(key)
                self._hits += 1
                return value
            else:
                del self._cache[key]
        self._misses += 1
        return None

    def set(self, key: str, value: any, name: str = "") -> None:
        if key in self._cache:
            del self._cache[key]
        elif len(self._cache) >= self._max_size:
            self._cache.popitem(last=False)
        self._cache[key] = (value, time.time(), name)

    def invalidate(self, name: str) -> int:
        to_delete = [
            k for k, (_, _, n) in self._cache.items()
            if n == name
        ]
        for k in to_delete:
            del self._cache[k]
        return len(to_delete)

    def clear(self) -> None:
        self._cache.clear()

    def size(self) -> int:
        return len(self._cache)

    def stats(self) -> dict:
        total = self._hits + self._misses
        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_ratio": self._hits / total if total > 0 else 0.0,
        }

    @staticmethod
    def make_key(strategy_name: str, symbol: str, metrics_hash: str = "") -> str:
        raw = f"{strategy_name}:{symbol}:{metrics_hash}"
        return hashlib.md5(raw.encode()).hexdigest()
