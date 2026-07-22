from __future__ import annotations

import hashlib
import threading
import time
from typing import Any, Dict, List, Optional

from modules.similarity_engine.core.types import (
    FeatureCategory,
    FeatureVector,
    MarketRegime,
)


class FeatureStore:
    """Manages feature vectors with caching and indexing."""

    def __init__(self) -> None:
        self._vectors: Dict[str, FeatureVector] = {}
        self._symbol_index: Dict[str, List[str]] = {}
        self._date_index: Dict[str, List[str]] = {}
        self._category_index: Dict[FeatureCategory, List[str]] = {}
        self._lock = threading.Lock()

    def store(self, vector: FeatureVector) -> str:
        key = self._make_key(vector.symbol, vector.date)
        with self._lock:
            self._vectors[key] = vector
            if vector.symbol not in self._symbol_index:
                self._symbol_index[vector.symbol] = []
            if key not in self._symbol_index[vector.symbol]:
                self._symbol_index[vector.symbol].append(key)

            if vector.date not in self._date_index:
                self._date_index[vector.date] = []
            if key not in self._date_index[vector.date]:
                self._date_index[vector.date].append(key)

            for cat in vector.feature_categories.values():
                if cat not in self._category_index:
                    self._category_index[cat] = []
                if key not in self._category_index[cat]:
                    self._category_index[cat].append(key)
        return key

    def get(self, symbol: str, date: str) -> Optional[FeatureVector]:
        key = self._make_key(symbol, date)
        return self._vectors.get(key)

    def get_by_symbol(self, symbol: str) -> List[FeatureVector]:
        keys = self._symbol_index.get(symbol, [])
        return [self._vectors[k] for k in keys if k in self._vectors]

    def get_by_date(self, date: str) -> List[FeatureVector]:
        keys = self._date_index.get(date, [])
        return [self._vectors[k] for k in keys if k in self._vectors]

    def get_by_category(self, category: FeatureCategory) -> List[FeatureVector]:
        keys = self._category_index.get(category, [])
        return [self._vectors[k] for k in keys if k in self._vectors]

    def get_all_symbols(self) -> List[str]:
        return list(self._symbol_index.keys())

    def get_all_dates(self) -> List[str]:
        return sorted(self._date_index.keys())

    def search(
        self,
        features: Optional[Dict[str, float]] = None,
        symbol: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        categories: Optional[List[FeatureCategory]] = None,
    ) -> List[FeatureVector]:
        candidates = list(self._vectors.values())

        if symbol:
            keys = self._symbol_index.get(symbol, [])
            candidate_keys = set(keys)
            candidates = [self._vectors[k] for k in candidate_keys if k in self._vectors]

        if date_from:
            candidates = [v for v in candidates if v.date >= date_from]
        if date_to:
            candidates = [v for v in candidates if v.date <= date_to]

        if categories:
            filtered = []
            for v in candidates:
                if any(cat in v.feature_categories.values() for cat in categories):
                    filtered.append(v)
            candidates = filtered

        return candidates

    def count(self) -> int:
        return len(self._vectors)

    def clear(self) -> None:
        with self._lock:
            self._vectors.clear()
            self._symbol_index.clear()
            self._date_index.clear()
            self._category_index.clear()

    def store_batch(self, vectors: List[FeatureVector]) -> List[str]:
        keys = []
        for v in vectors:
            keys.append(self.store(v))
        return keys

    def remove(self, symbol: str, date: str) -> bool:
        key = self._make_key(symbol, date)
        with self._lock:
            if key in self._vectors:
                del self._vectors[key]
                if symbol in self._symbol_index:
                    self._symbol_index[symbol] = [
                        k for k in self._symbol_index[symbol] if k != key
                    ]
                if date in self._date_index:
                    self._date_index[date] = [
                        k for k in self._date_index[date] if k != key
                    ]
                return True
        return False

    def compute_feature_vector(
        self,
        symbol: str,
        date: str,
        raw_features: Dict[str, float],
    ) -> FeatureVector:
        categories = self._categorize_features(raw_features)
        return FeatureVector(
            symbol=symbol,
            date=date,
            features=raw_features,
            feature_categories=categories,
        )

    def get_vector_as_array(
        self,
        vector: FeatureVector,
        feature_keys: List[str],
    ) -> List[float]:
        return [vector.features.get(k, 0.0) for k in feature_keys]

    def get_common_features(
        self,
        vec_a: FeatureVector,
        vec_b: FeatureVector,
    ) -> List[str]:
        return sorted(set(vec_a.features.keys()) & set(vec_b.features.keys()))

    def normalize_features(
        self,
        vectors: List[FeatureVector],
    ) -> List[FeatureVector]:
        if not vectors:
            return []
        all_keys: set = set()
        for v in vectors:
            all_keys.update(v.features.keys())
        mins: Dict[str, float] = {}
        maxs: Dict[str, float] = {}
        for k in all_keys:
            vals = [v.features.get(k, 0.0) for v in vectors]
            mins[k] = min(vals)
            maxs[k] = max(vals)
        normalized = []
        for v in vectors:
            new_features = {}
            for k, val in v.features.items():
                range_val = maxs[k] - mins[k]
                new_features[k] = (val - mins[k]) / range_val if range_val > 0 else 0.0
            normalized.append(FeatureVector(
                symbol=v.symbol,
                date=v.date,
                features=new_features,
                feature_categories=dict(v.feature_categories),
                metadata=dict(v.metadata),
            ))
        return normalized

    def _make_key(self, symbol: str, date: str) -> str:
        raw = f"{symbol}_{date}"
        return hashlib.md5(raw.encode()).hexdigest()[:16]

    def _categorize_features(self, features: Dict[str, float]) -> Dict[str, FeatureCategory]:
        mapping: Dict[str, FeatureCategory] = {}
        financial_keys = {"pe_ratio", "pb_ratio", "debt_ratio", "current_ratio", "roe", "roa", "profit_margin"}
        growth_keys = {"revenue_growth", "earnings_growth", "dividend_growth", "book_value_growth"}
        profitability_keys = {"roe", "roa", "profit_margin", "gross_margin", "operating_margin"}
        valuation_keys = {"pe_ratio", "pb_ratio", "ps_ratio", "ev_ebitda", "peg_ratio"}
        momentum_keys = {"rsi", "macd", "macd_signal", "macd_hist", "stochastic_k", "stochastic_d", "cci", "williams_r"}
        trend_keys = {"ma_short", "ma_long", "ema_short", "ema_long", "adx", "aroon_up", "aroon_down", "ichimoku_cloud"}
        volume_keys = {"obv", "cmf", "volume_sma", "relative_volume", "volume_spike", "mfi", "ad_line"}
        pattern_keys = {"pattern_confidence", "breakout_status", "support_distance", "resistance_distance", "gap_status"}

        for k in features:
            if k in financial_keys:
                mapping[k] = FeatureCategory.FINANCIAL
            elif k in growth_keys:
                mapping[k] = FeatureCategory.GROWTH
            elif k in profitability_keys:
                mapping[k] = FeatureCategory.PROFITABILITY
            elif k in valuation_keys:
                mapping[k] = FeatureCategory.VALUATION
            elif k in momentum_keys:
                mapping[k] = FeatureCategory.MOMENTUM
            elif k in trend_keys:
                mapping[k] = FeatureCategory.TREND
            elif k in volume_keys:
                mapping[k] = FeatureCategory.VOLUME
            elif k in pattern_keys:
                mapping[k] = FeatureCategory.PATTERN
            else:
                mapping[k] = FeatureCategory.MARKET_REGIME
        return mapping
