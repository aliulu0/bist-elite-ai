from __future__ import annotations

import hashlib
import json
import threading
import time
from collections import OrderedDict
from typing import Any, Dict, Optional


class PortfolioCache:
    _instance: Optional["PortfolioCache"] = None
    _lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> "PortfolioCache":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, ttl: int = 3600, max_size: int = 200) -> None:
        if self._initialized:
            return
        self._initialized = True
        self._ttl = ttl
        self._max_size = max_size
        self._store: OrderedDict[str, tuple[Any, float]] = OrderedDict()
        self._hits = 0
        self._misses = 0

    def make_key(
        self,
        reference_date: str,
        horizon: str,
        portfolio_size: int,
        max_per_sector: int,
    ) -> str:
        raw = json.dumps({
            "date": reference_date,
            "horizon": horizon,
            "size": portfolio_size,
            "mps": max_per_sector,
        }, sort_keys=True).encode()
        return hashlib.md5(raw).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        normalized = self._normalize_key(key)
        if normalized in self._store:
            value, ts = self._store[normalized]
            if time.time() - ts < self._ttl:
                self._store.move_to_end(normalized)
                self._hits += 1
                return value
            del self._store[normalized]
        self._misses += 1
        return None

    def put(self, key: str, value: Any) -> None:
        normalized = self._normalize_key(key)
        if normalized in self._store:
            del self._store[normalized]
        elif len(self._store) >= self._max_size:
            self._store.popitem(last=False)
        self._store[normalized] = (value, time.time())

    def invalidate(self, key: str) -> bool:
        normalized = self._normalize_key(key)
        if normalized in self._store:
            del self._store[normalized]
            return True
        return False

    def clear(self) -> int:
        count = len(self._store)
        self._store.clear()
        return count

    def hit_rate(self) -> float:
        total = self._hits + self._misses
        return self._hits / total if total > 0 else 0.0

    def stats(self) -> Dict[str, Any]:
        total = self._hits + self._misses
        return {
            "size": len(self._store),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": self._hits / total if total > 0 else 0.0,
            "ttl_seconds": self._ttl,
        }

    def _normalize_key(self, key: str) -> str:
        raw = json.dumps({"key": key}, sort_keys=True).encode()
        return hashlib.md5(raw).hexdigest()


def reset_portfolio_cache() -> None:
    PortfolioCache._instance = None
    PortfolioCache._lock = threading.Lock()
