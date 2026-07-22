from __future__ import annotations

import hashlib
import threading
import time
from collections import OrderedDict
from typing import Any, Dict, Optional

_instance: Optional[MonteCarloCache] = None
_lock = threading.Lock()


class MonteCarloCache:
    """Singleton TTL + LRU cache for Monte Carlo results."""

    def __new__(cls, *args, **kwargs) -> MonteCarloCache:
        global _instance
        if _instance is None:
            with _lock:
                if _instance is None:
                    _instance = super().__new__(cls)
                    _instance._initialized = False
        return _instance

    def __init__(self, ttl: int = 3600, max_size: int = 100) -> None:
        if self._initialized:
            return
        self._ttl = ttl
        self._max_size = max_size
        self._store: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._hits = 0
        self._misses = 0
        self._initialized = True

    def get(self, key: str) -> Optional[Any]:
        if key in self._store:
            entry = self._store[key]
            if time.time() - entry["ts"] < self._ttl:
                self._store.move_to_end(key)
                self._hits += 1
                return entry["value"]
            else:
                del self._store[key]
        self._misses += 1
        return None

    def set(self, key: str, value: Any) -> None:
        if key in self._store:
            self._store.move_to_end(key)
        self._store[key] = {"value": value, "ts": time.time()}
        while len(self._store) > self._max_size:
            self._store.popitem(last=False)

    def has(self, key: str) -> bool:
        if key in self._store:
            entry = self._store[key]
            if time.time() - entry["ts"] < self._ttl:
                return True
            del self._store[key]
        return False

    def delete(self, key: str) -> bool:
        if key in self._store:
            del self._store[key]
            return True
        return False

    def clear(self) -> int:
        count = len(self._store)
        self._store.clear()
        return count

    def cleanup(self) -> int:
        now = time.time()
        expired = [k for k, v in self._store.items() if now - v["ts"] >= self._ttl]
        for k in expired:
            del self._store[k]
        return len(expired)

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

    def reset_stats(self) -> None:
        self._hits = 0
        self._misses = 0


def reset_monte_carlo_cache() -> None:
    global _instance, _lock
    with _lock:
        _instance = None
        _lock = threading.Lock()
