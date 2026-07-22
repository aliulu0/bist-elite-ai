from __future__ import annotations

import hashlib
import json
import threading
import time
from typing import Any, Dict, Optional
from collections import OrderedDict


class EliteCache:
    _instance: Optional["EliteCache"] = None
    _lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> "EliteCache":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, ttl: int = 3600, max_size: int = 500) -> None:
        if self._initialized:
            return
        self._initialized = True
        self._ttl = ttl
        self._max_size = max_size
        self._store: OrderedDict[str, tuple[Any, float]] = OrderedDict()
        self._hits = 0
        self._misses = 0

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

    def set(self, key: str, value: Any) -> None:
        normalized = self._normalize_key(key)
        if normalized in self._store:
            del self._store[normalized]
        elif len(self._store) >= self._max_size:
            self._store.popitem(last=False)
        self._store[normalized] = (value, time.time())

    def has(self, key: str) -> bool:
        normalized = self._normalize_key(key)
        if normalized in self._store:
            _, ts = self._store[normalized]
            if time.time() - ts < self._ttl:
                return True
            del self._store[normalized]
        return False

    def delete(self, key: str) -> bool:
        normalized = self._normalize_key(key)
        if normalized in self._store:
            del self._store[normalized]
            return True
        return False

    def clear(self) -> int:
        count = len(self._store)
        self._store.clear()
        return count

    def cleanup(self) -> int:
        now = time.time()
        expired = [k for k, (_, ts) in self._store.items() if now - ts >= self._ttl]
        for k in expired:
            del self._store[k]
        return len(expired)

    def stats(self) -> Dict[str, Any]:
        total = self._hits + self._misses
        hit_rate = self._hits / total if total > 0 else 0.0
        return {
            "size": len(self._store),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": hit_rate,
            "ttl_seconds": self._ttl,
        }

    def _normalize_key(self, key: str) -> str:
        raw = json.dumps({"key": key}, sort_keys=True).encode()
        return hashlib.md5(raw).hexdigest()


def reset_elite_cache() -> None:
    EliteCache._instance = None
    EliteCache._lock = threading.Lock()
