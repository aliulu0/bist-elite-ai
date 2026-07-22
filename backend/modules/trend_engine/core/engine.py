from __future__ import annotations

import time

from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendResult, TrendDirection, TrendPhase,
)
from modules.trend_engine.core.base import BaseTrendPlugin
from modules.trend_engine.cache.trend_cache import TrendCache
from modules.trend_engine.signals.trend_signal_engine import TrendSignalEngine
from modules.trend_engine.signals.breakout_engine import BreakoutEngine
from modules.trend_engine.signals.pullback_engine import PullbackEngine
from modules.trend_engine.signals.trend_scoring_engine import TrendScoringEngine


class TrendEngine:

    def __init__(self) -> None:
        self._plugins: dict[str, BaseTrendPlugin] = {}
        self._cache = TrendCache()
        self._signal_engine = TrendSignalEngine()
        self._breakout_engine = BreakoutEngine()
        self._pullback_engine = PullbackEngine()
        self._scoring_engine = TrendScoringEngine()

    def register_plugin(self, plugin: BaseTrendPlugin) -> None:
        plugin.initialize()
        self._plugins[plugin.name.lower()] = plugin

    def get_plugin(self, name: str) -> BaseTrendPlugin | None:
        return self._plugins.get(name.lower())

    def list_plugins(self) -> list[str]:
        return list(self._plugins.keys())

    def calculate(
        self,
        indicator: str,
        prices: list[PriceBar],
        include_signals: bool = True,
        include_trend_analysis: bool = False,
        include_breakout: bool = False,
        include_pullback: bool = False,
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

        if include_trend_analysis:
            trend = self.analyze_trend(prices, result)
            result.warnings.append(
                f"Primary: {trend.primary_trend.value}, "
                f"Phase: {trend.phase.value}, "
                f"Strength: {trend.strength:.2f}"
            )

        if include_breakout:
            breakout = self._breakout_engine.detect(prices, result)
            if breakout.breakout_type.value != "none":
                result.warnings.append(breakout.description)

        if include_pullback:
            pullback = self._pullback_engine.detect(prices, result)
            if pullback.pullback_type.value != "none":
                result.warnings.append(pullback.description)

        if include_scoring:
            score = self._scoring_engine.calculate_composite(
                result, plugin.signals(result), prices
            )
            result.warnings.append(f"Score: {score.trend_score:.2f}")

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

    def analyze_trend(
        self, prices: list[PriceBar], result: IndicatorResult
    ) -> TrendResult:
        n = len(prices)
        if n < 20:
            return TrendResult()

        closes = [p.close for p in prices]
        primary = TrendDirection.NEUTRAL
        strengths: list[float] = []

        if result.current_value is not None and result.trend != TrendDirection.NEUTRAL:
            primary = result.trend
            if result.slope is not None:
                strengths.append(min(1.0, abs(result.slope) * 100))

        sma_20 = sum(closes[-20:]) / 20
        sma_50 = sum(closes[-50:]) / min(50, n) if n >= 20 else sma_20
        if closes[-1] > sma_20 > sma_50:
            if primary == TrendDirection.NEUTRAL:
                primary = TrendDirection.BULLISH
            strengths.append(0.7)
        elif closes[-1] < sma_20 < sma_50:
            if primary == TrendDirection.NEUTRAL:
                primary = TrendDirection.BEARISH
            strengths.append(0.7)

        strength = sum(strengths) / len(strengths) if strengths else 0.0

        age = 0
        if primary != TrendDirection.NEUTRAL:
            for i in range(n - 1, 0, -1):
                prev_close = closes[i - 1]
                if primary == TrendDirection.BULLISH and closes[i] >= prev_close:
                    age += 1
                elif primary == TrendDirection.BEARISH and closes[i] <= prev_close:
                    age += 1
                else:
                    break

        variance = sum((c - sma_20) ** 2 for c in closes[-20:]) / 20
        stability = max(0.0, 1.0 - min(1.0, variance / (sma_20 ** 2 + 1e-10)))

        recent_closes = closes[-min(10, n):]
        if len(recent_closes) >= 3:
            range_pct = (max(recent_closes) - min(recent_closes)) / (sma_20 + 1e-10)
            exhaustion = min(1.0, range_pct * 5)
        else:
            exhaustion = 0.0

        continuation = max(0.0, min(1.0, strength * stability + (1.0 - exhaustion) * 0.3))
        reversal_probability = max(0.0, min(1.0, exhaustion * 0.5 + (1.0 - stability) * 0.3))

        if exhaustion > 0.7:
            phase = TrendPhase.EXHAUSTING
        elif strength > 0.7 and age > 5:
            phase = TrendPhase.MATURE
        elif strength > 0.4:
            phase = TrendPhase.STRENGTHENING
        elif strength > 0.1:
            phase = TrendPhase.EMERGING
        else:
            phase = TrendPhase.SIDEWAYS

        secondary = TrendDirection.NEUTRAL
        if n >= 10:
            mid_closes = closes[-10:]
            sma_5 = sum(mid_closes[-5:]) / 5
            sma_10 = sum(mid_closes) / 10
            if sma_5 > sma_10:
                secondary = TrendDirection.BULLISH
            elif sma_5 < sma_10:
                secondary = TrendDirection.BEARISH

        micro = TrendDirection.NEUTRAL
        if n >= 5:
            last5 = closes[-5:]
            if last5[-1] > last5[-2] > last5[-3]:
                micro = TrendDirection.BULLISH
            elif last5[-1] < last5[-2] < last5[-3]:
                micro = TrendDirection.BEARISH

        return TrendResult(
            primary_trend=primary,
            secondary_trend=secondary,
            micro_trend=micro,
            phase=phase,
            strength=round(strength, 4),
            age=age,
            stability=round(stability, 4),
            exhaustion=round(exhaustion, 4),
            continuation=round(continuation, 4),
            reversal_probability=round(reversal_probability, 4),
        )

    def clear_cache(self) -> None:
        self._cache.clear()

    def cache_stats(self) -> dict:
        return self._cache.stats()

    def shutdown(self) -> None:
        for plugin in self._plugins.values():
            plugin.shutdown()
        self._plugins.clear()
        self._cache.clear()
