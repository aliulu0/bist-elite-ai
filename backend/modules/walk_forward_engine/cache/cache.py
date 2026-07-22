from __future__ import annotations

import hashlib
import threading
import time
from collections import OrderedDict
from typing import Any, Dict, List, Optional

_instance: Optional[WalkForwardCache] = None
_lock = threading.Lock()


class WalkForwardCache:
    """Singleton TTL + LRU cache for walk-forward results with incremental processing support."""

    def __new__(cls, *args, **kwargs) -> WalkForwardCache:
        global _instance
        if _instance is None:
            with _lock:
                if _instance is None:
                    _instance = super().__new__(cls)
                    _instance._initialized = False
        return _instance

    def __init__(self, ttl: int = 3600, max_size: int = 200) -> None:
        if self._initialized:
            return
        self._ttl = ttl
        self._max_size = max_size
        self._store: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._hits = 0
        self._misses = 0
        self._window_cache: Dict[str, Any] = {}
        self._initialized = True

    def _make_key(self, data: Any) -> str:
        raw = str(data)
        return hashlib.md5(raw.encode()).hexdigest()

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
        self._window_cache.clear()
        return count

    def cleanup(self) -> int:
        now = time.time()
        expired = [k for k, v in self._store.items() if now - v["ts"] >= self._ttl]
        for k in expired:
            del self._store[k]
        return len(expired)

    def cache_window_result(self, symbol: str, window_index: int, result: Any) -> None:
        key = f"window:{symbol}:{window_index}"
        self._window_cache[key] = {"value": result, "ts": time.time()}

    def get_window_result(self, symbol: str, window_index: int) -> Optional[Any]:
        key = f"window:{symbol}:{window_index}"
        entry = self._window_cache.get(key)
        if entry and time.time() - entry["ts"] < self._ttl:
            return entry["value"]
        return None

    def get_cached_windows(self, symbol: str) -> List[int]:
        prefix = f"window:{symbol}:"
        indices = []
        for key in self._window_cache:
            if key.startswith(prefix):
                try:
                    idx = int(key[len(prefix):])
                    entry = self._window_cache[key]
                    if time.time() - entry["ts"] < self._ttl:
                        indices.append(idx)
                except ValueError:
                    pass
        return sorted(indices)

    def stats(self) -> Dict[str, Any]:
        total = self._hits + self._misses
        return {
            "size": len(self._store),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": self._hits / total if total > 0 else 0.0,
            "ttl_seconds": self._ttl,
            "window_cache_size": len(self._window_cache),
        }

    def reset_stats(self) -> None:
        self._hits = 0
        self._misses = 0


def reset_walk_forward_cache() -> None:
    global _instance, _lock
    with _lock:
        _instance = None
        _lock = threading.Lock()
