from __future__ import annotations

from modules.pattern_engine.core.types import (
    PriceBar, PatternCategory, PatternDirection, PatternResult, DetectedPattern, PatternAnalysis,
)
from modules.pattern_engine.registry.pattern_registry import PatternRegistry
from modules.pattern_engine.cache.pattern_cache import PatternCache
from modules.pattern_engine.validators.pattern_validators import PatternValidator
from modules.pattern_engine.similarity.pattern_similarity import PatternSimilarityEngine


class PatternService:

    def __init__(self) -> None:
        self._registry = PatternRegistry()
        self._cache = PatternCache()
        self._similarity = PatternSimilarityEngine()

    @property
    def registry(self) -> PatternRegistry:
        return self._registry

    def detect(
        self,
        prices: list[PriceBar],
        category: str | None = None,
        patterns: list[str] | None = None,
        params: dict | None = None,
    ) -> PatternAnalysis:
        params = params or {}
        cat_enum = PatternCategory(category) if category else None
        if patterns:
            results: list[PatternResult] = []
            for pat_name in patterns:
                plugin = self._registry.get(pat_name)
                if plugin is None:
                    continue
                errors = plugin.validate(prices, **params)
                if errors:
                    continue
                cache_key = PatternCache.hash_prices(prices)
                cached = self._cache.get(pat_name, cache_key, params)
                if cached is not None:
                    results.extend(cached)
                    continue
                detected = plugin.detect(prices, **params)
                self._cache.set(pat_name, cache_key, params, detected)
                results.extend(detected)
        else:
            cache_key = PatternCache.hash_prices(prices)
            cache_key_full = f"_all_{category or 'all'}"
            cached = self._cache.get(cache_key_full, cache_key, params)
            if cached is not None:
                results = cached
            else:
                results = self._registry.detect_all(prices, category=cat_enum, **params)
                self._cache.set(cache_key_full, cache_key, params, results)
        return self._build_analysis(results)

    def detect_classical(self, prices: list[PriceBar], params: dict | None = None) -> list[PatternResult]:
        return self._registry.detect_all(prices, category=PatternCategory.CLASSICAL, **(params or {}))

    def detect_candlestick(self, prices: list[PriceBar], params: dict | None = None) -> list[PatternResult]:
        return self._registry.detect_all(prices, category=PatternCategory.CANDLESTICK, **(params or {}))

    def detect_smc(self, prices: list[PriceBar], params: dict | None = None) -> list[PatternResult]:
        return self._registry.detect_all(prices, category=PatternCategory.SMC, **(params or {}))

    def detect_wyckoff(self, prices: list[PriceBar], params: dict | None = None) -> list[PatternResult]:
        return self._registry.detect_all(prices, category=PatternCategory.WYCKOFF, **(params or {}))

    def list_plugins(self) -> list[dict]:
        return self._registry.list_plugins()

    def get_plugin(self, name: str) -> dict | None:
        plugin = self._registry.get(name)
        if plugin is None:
            return None
        meta = plugin.metadata()
        meta["parameters"] = plugin.parameters()
        meta["min_bars"] = plugin.min_bars()
        return meta

    def validate_prices(self, prices: list[PriceBar]) -> list[str]:
        return PatternValidator.validate_prices(prices)

    def find_similar(
        self, target: PatternResult, historical: list[PatternResult], top_k: int = 5
    ):
        return self._similarity.find_similar(target, historical, top_k)

    def invalidate_cache(self, pattern_name: str | None = None) -> int:
        return self._cache.invalidate(pattern_name)

    def _build_analysis(self, results: list[PatternResult]) -> PatternAnalysis:
        if not results:
            return PatternAnalysis()
        detected = []
        for r in results:
            detected.append(DetectedPattern(
                pattern_name=r.pattern_name,
                category=r.category,
                direction=r.direction,
                status=r.status,
                confidence=r.confidence,
                probability=r.probability,
                risk=r.risk,
                expected_target=r.expected_target,
                expected_duration=r.expected_duration,
                expected_pullback=r.expected_pullback,
                pattern_quality=r.pattern_quality,
                confirmation_score=r.confirmation_score,
                entry_price=r.entry_price,
                stop_loss=r.stop_loss,
                take_profit=r.take_profit,
                start_index=r.start_index,
                end_index=r.end_index,
                key_levels=r.key_levels,
                description=r.description,
            ))
        bullish = sum(1 for d in detected if d.direction == PatternDirection.BULLISH)
        bearish = sum(1 for d in detected if d.direction == PatternDirection.BEARISH)
        avg_conf = sum(d.confidence for d in detected) / len(detected)
        dominant = PatternDirection.BULLISH if bullish > bearish else (
            PatternDirection.BEARISH if bearish > bullish else PatternDirection.NEUTRAL
        )
        return PatternAnalysis(
            detected_patterns=detected,
            total_patterns=len(detected),
            bullish_count=bullish,
            bearish_count=bearish,
            avg_confidence=round(avg_conf, 4),
            dominant_direction=dominant,
        )
