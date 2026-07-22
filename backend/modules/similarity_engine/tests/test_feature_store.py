from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.similarity_engine.core.types import FeatureCategory, FeatureVector
from modules.similarity_engine.feature_store.store import FeatureStore


class TestFeatureStoreConstruction:
    def test_init(self):
        fs = FeatureStore()
        assert fs.count() == 0


class TestStoreAndGet:
    def test_store_and_get(self):
        fs = FeatureStore()
        fv = FeatureVector(symbol="THYAO", date="2024-01-01", features={"rsi": 50.0})
        key = fs.store(fv)
        assert key is not None
        result = fs.get("THYAO", "2024-01-01")
        assert result is not None
        assert result.symbol == "THYAO"
        assert result.features["rsi"] == 50.0

    def test_get_nonexistent(self):
        fs = FeatureStore()
        assert fs.get("THYAO", "2024-01-01") is None

    def test_overwrite(self):
        fs = FeatureStore()
        fs.store(FeatureVector(symbol="THYAO", date="2024-01-01", features={"rsi": 50.0}))
        fs.store(FeatureVector(symbol="THYAO", date="2024-01-01", features={"rsi": 60.0}))
        result = fs.get("THYAO", "2024-01-01")
        assert result.features["rsi"] == 60.0


class TestIndexing:
    def test_get_by_symbol(self):
        fs = FeatureStore()
        fs.store(FeatureVector(symbol="THYAO", date="2024-01-01", features={"rsi": 50.0}))
        fs.store(FeatureVector(symbol="THYAO", date="2024-02-01", features={"rsi": 55.0}))
        fs.store(FeatureVector(symbol="GARAN", date="2024-01-01", features={"rsi": 45.0}))
        results = fs.get_by_symbol("THYAO")
        assert len(results) == 2

    def test_get_by_date(self):
        fs = FeatureStore()
        fs.store(FeatureVector(symbol="THYAO", date="2024-01-01", features={"rsi": 50.0}))
        fs.store(FeatureVector(symbol="GARAN", date="2024-01-01", features={"rsi": 45.0}))
        results = fs.get_by_date("2024-01-01")
        assert len(results) == 2

    def test_get_by_category(self):
        fs = FeatureStore()
        fs.store(FeatureVector(
            symbol="THYAO", date="2024-01-01",
            features={"rsi": 50.0},
            feature_categories={"rsi": FeatureCategory.MOMENTUM},
        ))
        results = fs.get_by_category(FeatureCategory.MOMENTUM)
        assert len(results) == 1

    def test_get_all_symbols(self):
        fs = FeatureStore()
        fs.store(FeatureVector(symbol="THYAO", date="2024-01-01", features={}))
        fs.store(FeatureVector(symbol="GARAN", date="2024-01-01", features={}))
        symbols = fs.get_all_symbols()
        assert len(symbols) == 2
        assert "THYAO" in symbols

    def test_get_all_dates(self):
        fs = FeatureStore()
        fs.store(FeatureVector(symbol="THYAO", date="2024-01-01", features={}))
        fs.store(FeatureVector(symbol="THYAO", date="2024-02-01", features={}))
        dates = fs.get_all_dates()
        assert len(dates) == 2


class TestSearch:
    def test_search_all(self):
        fs = FeatureStore()
        fs.store(FeatureVector(symbol="THYAO", date="2024-01-01", features={"rsi": 50.0}))
        fs.store(FeatureVector(symbol="GARAN", date="2024-01-01", features={"rsi": 45.0}))
        results = fs.search()
        assert len(results) == 2

    def test_search_by_symbol(self):
        fs = FeatureStore()
        fs.store(FeatureVector(symbol="THYAO", date="2024-01-01", features={}))
        fs.store(FeatureVector(symbol="GARAN", date="2024-01-01", features={}))
        results = fs.search(symbol="THYAO")
        assert len(results) == 1

    def test_search_by_date_range(self):
        fs = FeatureStore()
        fs.store(FeatureVector(symbol="THYAO", date="2024-01-01", features={}))
        fs.store(FeatureVector(symbol="THYAO", date="2024-06-01", features={}))
        fs.store(FeatureVector(symbol="THYAO", date="2024-12-01", features={}))
        results = fs.search(date_from="2024-03-01", date_to="2024-12-01")
        assert len(results) == 2


class TestBatchStore:
    def test_store_batch(self):
        fs = FeatureStore()
        vectors = [
            FeatureVector(symbol="THYAO", date=f"2024-01-{i:02d}", features={"rsi": float(i)})
            for i in range(1, 6)
        ]
        keys = fs.store_batch(vectors)
        assert len(keys) == 5
        assert fs.count() == 5


class TestRemove:
    def test_remove(self):
        fs = FeatureStore()
        fs.store(FeatureVector(symbol="THYAO", date="2024-01-01", features={}))
        assert fs.remove("THYAO", "2024-01-01") is True
        assert fs.get("THYAO", "2024-01-01") is None

    def test_remove_nonexistent(self):
        fs = FeatureStore()
        assert fs.remove("THYAO", "2024-01-01") is False


class TestClear:
    def test_clear(self):
        fs = FeatureStore()
        fs.store(FeatureVector(symbol="THYAO", date="2024-01-01", features={}))
        fs.clear()
        assert fs.count() == 0


class TestComputeFeatureVector:
    def test_compute(self):
        fs = FeatureStore()
        fv = fs.compute_feature_vector("THYAO", "2024-01-01", {
            "rsi": 50.0, "ps_ratio": 2.0, "obv": 1000.0,
        })
        assert fv.symbol == "THYAO"
        assert "rsi" in fv.features
        assert fv.feature_categories["rsi"] == FeatureCategory.MOMENTUM
        assert fv.feature_categories["ps_ratio"] == FeatureCategory.VALUATION


class TestVectorOperations:
    def test_get_vector_as_array(self):
        fs = FeatureStore()
        fv = FeatureVector(features={"a": 1.0, "b": 2.0, "c": 3.0})
        arr = fs.get_vector_as_array(fv, ["a", "b", "c"])
        assert arr == [1.0, 2.0, 3.0]

    def test_get_vector_as_array_missing(self):
        fs = FeatureStore()
        fv = FeatureVector(features={"a": 1.0})
        arr = fs.get_vector_as_array(fv, ["a", "b"])
        assert arr == [1.0, 0.0]

    def test_get_common_features(self):
        fs = FeatureStore()
        a = FeatureVector(features={"x": 1, "y": 2})
        b = FeatureVector(features={"y": 3, "z": 4})
        common = fs.get_common_features(a, b)
        assert common == ["y"]


class TestNormalizeFeatures:
    def test_normalize(self):
        fs = FeatureStore()
        vectors = [
            FeatureVector(features={"x": 0.0}),
            FeatureVector(features={"x": 10.0}),
            FeatureVector(features={"x": 5.0}),
        ]
        normalized = fs.normalize_features(vectors)
        assert normalized[0].features["x"] == 0.0
        assert normalized[1].features["x"] == 1.0
        assert abs(normalized[2].features["x"] - 0.5) < 0.001

    def test_normalize_empty(self):
        fs = FeatureStore()
        assert fs.normalize_features([]) == []

    def test_normalize_same_values(self):
        fs = FeatureStore()
        vectors = [
            FeatureVector(features={"x": 5.0}),
            FeatureVector(features={"x": 5.0}),
        ]
        normalized = fs.normalize_features(vectors)
        assert normalized[0].features["x"] == 0.0
        assert normalized[1].features["x"] == 0.0
