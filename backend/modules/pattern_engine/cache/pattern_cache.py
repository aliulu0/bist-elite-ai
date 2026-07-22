from __future__ import annotations

import hashlib
import json
import time
from typing import Any


class PatternCache:

    def __init__(self, ttl_seconds: int = 300, max_size: int = 1000) -> None:
        self._cache: dict[str, tuple[Any, float, str]] = {}
        self._ttl = ttl_seconds
        self._max_size = max_size

    def _make_key(self, pattern_name: str, prices_hash: str, params: dict) -> str:
        param_str = json.dumps(params, sort_keys=True, default=str)
        raw = f"{pattern_name}:{prices_hash}:{param_str}"
        return hashlib.md5(raw.encode()).hexdigest()

    @staticmethod
    def hash_prices(prices: list) -> str:
        if not prices:
            return "empty"
        parts = []
        for p in prices:
            parts.append(f"{p.date}:{p.open}:{p.high}:{p.low}:{p.close}:{p.volume}")
        raw = "|".join(parts)
        return hashlib.md5(raw.encode()).hexdigest()

    def get(self, pattern_name: str, prices_hash: str, params: dict) -> Any | None:
        key = self._make_key(pattern_name, prices_hash, params)
        if key in self._cache:
            value, ts, _ = self._cache[key]
            if time.time() - ts < self._ttl:
                return value
            del self._cache[key]
        return None

    def set(self, pattern_name: str, prices_hash: str, params: dict, value: Any) -> None:
        if len(self._cache) >= self._max_size:
            oldest_key = min(self._cache, key=lambda k: self._cache[k][1])
            del self._cache[oldest_key]
        key = self._make_key(pattern_name, prices_hash, params)
        self._cache[key] = (value, time.time(), pattern_name)

    def invalidate(self, pattern_name: str | None = None) -> int:
        if pattern_name is None:
            count = len(self._cache)
            self._cache.clear()
            return count
        keys_to_remove = [k for k in self._cache if self._cache[k][2] == pattern_name]
        for k in keys_to_remove:
            del self._cache[k]
        return len(keys_to_remove)

    @property
    def size(self) -> int:
        return len(self._cache)

    def cleanup(self) -> int:
        now = time.time()
        expired = [k for k, (_, ts, _) in self._cache.items() if now - ts >= self._ttl]
        for k in expired:
            del self._cache[k]
        return len(expired)
