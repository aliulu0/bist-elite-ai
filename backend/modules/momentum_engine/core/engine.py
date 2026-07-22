from __future__ import annotations

import time
from typing import Any

from modules.momentum_engine.core.types import (
    PriceBar, IndicatorResult, Signal, Divergence, MomentumScore,
    SignalType, TrendDirection,
)
from modules.momentum_engine.core.base import BaseMomentumPlugin
from modules.momentum_engine.cache.momentum_cache import MomentumCache
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.signals.divergence_engine import DivergenceEngine
from modules.momentum_engine.signals.scoring_engine import ScoringEngine


class MomentumEngine:

    def __init__(self) -> None:
        self._plugins: dict[str, BaseMomentumPlugin] = {}
        self._cache = MomentumCache()
        self._signal_engine = SignalEngine()
        self._divergence_engine = DivergenceEngine()
        self._scoring_engine = ScoringEngine()

    def register_plugin(self, plugin: BaseMomentumPlugin) -> None:
        plugin.initialize()
        self._plugins[plugin.name.lower()] = plugin

    def get_plugin(self, name: str) -> BaseMomentumPlugin | None:
        return self._plugins.get(name.lower())

    def list_plugins(self) -> list[str]:
        return list(self._plugins.keys())

    def calculate(
        self,
        indicator: str,
        prices: list[PriceBar],
        include_signals: bool = True,
        include_divergence: bool = False,
        include_scoring: bool = False,
        **params,
    ) -> IndicatorResult:
        plugin = self._plugins.get(indicator.lower())
        if not plugin:
            raise ValueError(
                f"Unknown indicator: {indicator}. Available: {self.list_plugins()}"
            )

        cache_key = self._cache.build_key(indicator, prices, params)
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        errors = plugin.validate(prices, **params)
        if errors:
            result = IndicatorResult(
                indicator=plugin.display_name,
                parameters=params,
                values=[None] * len(prices),
                dates=[p.date for p in prices],
                warnings=errors,
            )
            return result

        start = time.time()
        result = plugin.calculate(prices, **params)
        result.calculation_time_ms = (time.time() - start) * 1000

        if include_signals:
            result_signals = plugin.signals(result)

        if include_divergence and len(prices) >= 30:
            closes = [p.close for p in prices]
            divs = self._divergence_engine.detect(result.values, closes)
            if divs:
                for d in divs:
                    result.warnings.append(
                        f"{d.divergence_type.value} detected at index {d.end_idx}"
                    )

        if include_scoring and result.current_value is not None:
            trend_score = self._scoring_engine.calculate_trend_score(result)
            signal_score = self._scoring_engine.calculate_signal_score(
                plugin.signals(result) if include_signals else []
            )
            momentum_score = self._scoring_engine.calculate_momentum_score(result)
            strength_score = self._scoring_engine.calculate_strength_score(result)
            confidence_score = self._scoring_engine.calculate_confidence_score(
                result, prices
            )

        self._cache.set(cache_key, result)
        return result

    def calculate_all(
        self,
        prices: list[PriceBar],
        include_signals: bool = True,
        **params,
    ) -> dict[str, IndicatorResult]:
        results = {}
        for name in self.list_plugins():
            plugin = self._plugins[name]
            plugin_params = {**plugin.get_default_params(), **params}
            try:
                results[name] = self.calculate(
                    name, prices,
                    include_signals=include_signals,
                    **plugin_params,
                )
            except Exception:
                pass
        return results

    def clear_cache(self) -> None:
        self._cache.clear()

    def cache_stats(self) -> dict:
        return self._cache.stats()

    def shutdown(self) -> None:
        for plugin in self._plugins.values():
            plugin.shutdown()
        self._plugins.clear()
        self._cache.clear()
