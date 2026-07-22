from __future__ import annotations

import time

from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, SmartMoneyResult, LiquidityResult,
    InstitutionalScore, TrendDirection,
)
from modules.volume_engine.core.base import BaseVolumePlugin
from modules.volume_engine.cache.volume_cache import VolumeCache
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.smart_money.smart_money_detector import SmartMoneyDetector
from modules.volume_engine.liquidity.liquidity_engine import LiquidityEngine
from modules.volume_engine.signals.volume_scoring_engine import VolumeScoringEngine
from modules.volume_engine.validators.volume_validator import VolumeValidator


class VolumeEngine:

    def __init__(self) -> None:
        self._plugins: dict[str, BaseVolumePlugin] = {}
        self._cache = VolumeCache()
        self._signal_engine = VolumeSignalEngine()
        self._smart_money = SmartMoneyDetector()
        self._liquidity = LiquidityEngine()
        self._scoring = VolumeScoringEngine()

    def register_plugin(self, plugin: BaseVolumePlugin) -> None:
        plugin.initialize()
        self._plugins[plugin.name.lower()] = plugin

    def get_plugin(self, name: str) -> BaseVolumePlugin | None:
        return self._plugins.get(name.lower())

    def list_plugins(self) -> list[str]:
        return list(self._plugins.keys())

    def calculate(
        self,
        indicator: str,
        prices: list[PriceBar],
        include_signals: bool = True,
        include_smart_money: bool = False,
        include_liquidity: bool = False,
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
            for s in result_signals:
                result.warnings.append(s.description)

        if include_smart_money:
            sm = self._smart_money.detect(prices, result)
            if sm.detection_type.value != "none":
                result.warnings.append(sm.description)

        if include_liquidity:
            liq = self._liquidity.calculate(prices)
            result.warnings.append(f"Liquidity: {liq.liquidity_score:.2f}")

        if include_scoring:
            score = self._scoring.calculate_composite(
                result, plugin.signals(result), prices
            )
            result.warnings.append(f"Score: {score.volume_score:.2f}")

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

    def detect_smart_money(
        self, prices: list[PriceBar], result: IndicatorResult
    ) -> SmartMoneyResult:
        return self._smart_money.detect(prices, result)

    def analyze_liquidity(self, prices: list[PriceBar]) -> LiquidityResult:
        return self._liquidity.calculate(prices)

    def get_institutional_score(
        self, prices: list[PriceBar], results: dict[str, IndicatorResult]
    ) -> InstitutionalScore:
        return self._scoring.calculate_institutional(prices, results)

    def clear_cache(self) -> None:
        self._cache.clear()

    def cache_stats(self) -> dict:
        return self._cache.stats()

    def shutdown(self) -> None:
        for plugin in self._plugins.values():
            plugin.shutdown()
        self._plugins.clear()
        self._cache.clear()
