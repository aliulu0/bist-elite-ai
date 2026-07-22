import time
import json
import hashlib
from typing import Any, Optional
from functools import wraps
from pathlib import Path


class MemoryCache:
    def __init__(self, default_ttl: int = 3600):
        self._cache: dict[str, tuple[Any, float]] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            value, expiry = self._cache[key]
            if time.time() < expiry:
                return value
            del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        expiry = time.time() + (ttl or self._default_ttl)
        self._cache[key] = (value, expiry)

    def delete(self, key: str) -> None:
        self._cache.pop(key, None)

    def clear(self) -> None:
        self._cache.clear()

    def has(self, key: str) -> bool:
        return self.get(key) is not None

    def get_or_set(
        self, key: str, factory, ttl: Optional[int] = None
    ) -> Any:
        value = self.get(key)
        if value is None:
            value = factory()
            self.set(key, value, ttl)
        return value

    @staticmethod
    def make_key(*args, **kwargs) -> str:
        key_parts = [str(a) for a in args]
        key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
        raw = ":".join(key_parts)
        return hashlib.md5(raw.encode()).hexdigest()


cache = MemoryCache(default_ttl=1800)


def cached(ttl: int = 1800, prefix: str = ""):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = prefix + ":" + cache.make_key(func.__name__, *args, **kwargs)
            result = cache.get(key)
            if result is not None:
                return result
            result = func(*args, **kwargs)
            cache.set(key, result, ttl)
            return result
        return wrapper
    return decorator
