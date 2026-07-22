from __future__ import annotations

import threading
import time
from collections import OrderedDict
from typing import Any, Dict, Optional


class FactorCache:
    def __init__(self, max_size: int = 256, ttl_seconds: float = 300.0) -> None:
        self._cache: OrderedDict[str, tuple[float, Any]] = OrderedDict()
        self._max_size = max_size
        self._ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0

    def make_key(self, symbol: str, reference_date: str, **kwargs: Any) -> str:
        parts = [symbol, reference_date]
        for k in sorted(kwargs.keys()):
            parts.append(f"{k}={kwargs[k]}")
        return "|".join(parts)

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key in self._cache:
                ts, val = self._cache[key]
                if time.time() - ts < self._ttl_seconds:
                    self._cache.move_to_end(key)
                    self._hits += 1
                    return val
                else:
                    del self._cache[key]
            self._misses += 1
            return None

    def put(self, key: str, value: Any) -> None:
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = (time.time(), value)
            while len(self._cache) > self._max_size:
                self._cache.popitem(last=False)

    def invalidate(self, key: str) -> bool:
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0

    def hit_rate(self) -> float:
        total = self._hits + self._misses
        return self._hits / total if total > 0 else 0.0

    def stats(self) -> Dict[str, Any]:
        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "ttl_seconds": self._ttl_seconds,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self.hit_rate(), 4),
        }
