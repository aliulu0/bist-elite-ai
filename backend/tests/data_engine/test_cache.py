import pytest
from modules.data_engine.utils.cache import MemoryCache, cache


class TestMemoryCache:
    def setup_method(self):
        self.cache = MemoryCache(default_ttl=60)

    def test_set_and_get(self):
        self.cache.set("key1", "value1")
        assert self.cache.get("key1") == "value1"

    def test_get_nonexistent(self):
        assert self.cache.get("nonexistent") is None

    def test_delete(self):
        self.cache.set("key1", "value1")
        self.cache.delete("key1")
        assert self.cache.get("key1") is None

    def test_clear(self):
        self.cache.set("key1", "value1")
        self.cache.set("key2", "value2")
        self.cache.clear()
        assert self.cache.get("key1") is None
        assert self.cache.get("key2") is None

    def test_has(self):
        self.cache.set("key1", "value1")
        assert self.cache.has("key1")
        assert not self.cache.has("key2")

    def test_get_or_set(self):
        result = self.cache.get_or_set("key1", lambda: "computed_value")
        assert result == "computed_value"
        assert self.cache.get("key1") == "computed_value"

    def test_make_key(self):
        key = MemoryCache.make_key("arg1", "arg2", kwarg1="value1")
        assert isinstance(key, str)
        assert len(key) == 32


class TestGlobalCache:
    def test_singleton(self):
        from modules.data_engine.utils.cache import cache as c1
        from modules.data_engine.utils.cache import cache as c2
        assert c1 is c2
