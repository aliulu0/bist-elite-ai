from __future__ import annotations

import time
import math
from typing import Any

from modules.moving_average.core.types import (
    MAType, PriceBar, MAResult, SlopeResult, DistanceResult,
    FullResult, TrendResult, CrossResult, MAScore,
)
from modules.moving_average.plugins.base import BaseMAPattern
from modules.moving_average.calculators.slope_calculator import SlopeCalculator
from modules.moving_average.calculators.distance_calculator import DistanceCalculator
from modules.moving_average.signals.cross_detector import CrossDetector
from modules.moving_average.signals.proximity_engine import ProximityEngine
from modules.moving_average.signals.smart_signals import SmartSignalEngine
from modules.moving_average.trend.trend_analyzer import TrendAnalyzer
from modules.moving_average.scoring.score_engine import ScoreEngine


class MovingAverageEngine:

    def __init__(self) -> None:
        self._plugins: dict[str, BaseMAPattern] = {}
        self._slope_calc = SlopeCalculator()
        self._dist_calc = DistanceCalculator()
        self._cross_detector = CrossDetector()
        self._proximity = ProximityEngine()
        self._smart_signals = SmartSignalEngine()
        self._trend = TrendAnalyzer()
        self._scorer = ScoreEngine()

    def register_plugin(self, plugin: BaseMAPattern) -> None:
        self._plugins[plugin.name.lower()] = plugin

    def get_plugin(self, name: str) -> BaseMAPattern | None:
        return self._plugins.get(name.lower())

    def list_plugins(self) -> list[str]:
        return list(self._plugins.keys())

    def calculate(
        self,
        ma_type: str,
        period: int,
        prices: list[PriceBar],
        include_slope: bool = True,
        include_distance: bool = True,
        include_trend: bool = True,
        include_signals: bool = False,
        include_smart_signals: bool = False,
        include_scores: bool = False,
        fast_period: int | None = None,
        slow_period: int | None = None,
    ) -> FullResult:
        start = time.time()
        plugin = self._plugins.get(ma_type.lower())
        if not plugin:
            raise ValueError(f"Unknown MA type: {ma_type}. Available: {self.list_plugins()}")

        closes = [p.close for p in prices]
        dates = [p.date for p in prices]

        if len(closes) < period:
            empty_vals: list[None] = [None] * len(closes)
            return FullResult(
                indicator=ma_type.upper(),
                period=period,
                values=empty_vals,
                dates=dates,
                current_value=None,
                previous_value=None,
                calculation_time_ms=(time.time() - start) * 1000,
            )

        ma_values = plugin.calculate(closes, period)
        current = ma_values[-1] if ma_values else None
        previous = ma_values[-2] if len(ma_values) >= 2 else None

        result = FullResult(
            indicator=ma_type.upper(),
            period=period,
            values=ma_values,
            dates=dates,
            current_value=current,
            previous_value=previous,
        )

        if include_slope and current is not None and previous is not None:
            idx = len(ma_values) - 1
            result.slope = self._slope_calc.calculate(ma_values, idx)

        if include_distance and current is not None:
            result.distance_from_price = self._dist_calc.distance_from_price(
                current, closes[-1]
            )

        if include_trend and current is not None:
            result.trend = self._trend.analyze(ma_values, closes, period)

        if include_signals and fast_period and slow_period:
            fast_ma = self._calculate_ma(ma_type, fast_period, closes)
            slow_ma = self._calculate_ma(ma_type, slow_period, closes)
            result.signals = self._cross_detector.detect(fast_ma, slow_ma, dates, fast_period, slow_period)

        if include_distance and fast_period and slow_period:
            fast_ma = result.values if fast_period == period else self._calculate_ma(ma_type, fast_period, closes)
            slow_ma = self._calculate_ma(ma_type, slow_period, closes)
            if fast_ma and slow_ma:
                result.distance_from_price = result.distance_from_price or self._dist_calc.distance_from_price(
                    fast_ma[-1], closes[-1]
                )
                result.smart_signals = self._smart_signals.generate(
                    fast_ma, slow_ma, closes, dates, fast_period, slow_period
                )

        if include_scores and current is not None:
            result.scores = self._scorer.calculate(
                ma_values, closes, result.slope, result.trend, result.signals
            )

        result.calculation_time_ms = (time.time() - start) * 1000
        return result

    def calculate_multiple(
        self,
        ma_type: str,
        periods: list[int],
        prices: list[PriceBar],
        include_slope: bool = True,
        include_distance: bool = False,
        include_trend: bool = False,
    ) -> list[FullResult]:
        results = []
        for p in periods:
            r = self.calculate(
                ma_type, p, prices,
                include_slope=include_slope,
                include_distance=include_distance,
                include_trend=include_trend,
            )
            results.append(r)
        return results

    def calculate_crossovers(
        self,
        ma_type: str,
        fast_period: int,
        slow_period: int,
        prices: list[PriceBar],
    ) -> dict:
        closes = [p.close for p in prices]
        dates = [p.date for p in prices]

        if len(closes) < max(fast_period, slow_period) + 1:
            return {
                "fast_period": fast_period,
                "slow_period": slow_period,
                "crosses": [],
                "current_distance": None,
                "estimated_bars": None,
                "probability": None,
            }

        fast_ma = self._calculate_ma(ma_type, fast_period, closes)
        slow_ma = self._calculate_ma(ma_type, slow_period, closes)
        crosses = self._cross_detector.detect(fast_ma, slow_ma, dates, fast_period, slow_period)

        dist_result = self._dist_calc.distance_between(fast_ma, slow_ma)
        est = self._proximity.estimate_crossover(fast_ma, slow_ma)

        return {
            "fast_period": fast_period,
            "slow_period": slow_period,
            "crosses": crosses,
            "current_distance": dist_result,
            "estimated_bars": est.get("estimated_bars"),
            "probability": est.get("probability"),
        }

    def _calculate_ma(self, ma_type: str, period: int, closes: list[float]) -> list[float | None]:
        plugin = self._plugins.get(ma_type.lower())
        if not plugin:
            return [None] * len(closes)
        return plugin.calculate(closes, period)
