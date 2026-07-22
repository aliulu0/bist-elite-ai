from __future__ import annotations

from modules.trend_engine.core.engine import TrendEngine
from modules.trend_engine.core.registry import get_registry
from modules.trend_engine.core.types import PriceBar
from modules.trend_engine.schemas.trend_schemas import (
    PriceBarSchema, IndicatorResponse, SignalResponse,
    TrendResultResponse, BreakoutResultResponse, PullbackResultResponse,
    TrendScoreResponse, CacheStatsResponse, BenchmarkResponse,
    AvailableIndicatorsResponse,
)
from modules.trend_engine.signals.trend_signal_engine import TrendSignalEngine
from modules.trend_engine.signals.breakout_engine import BreakoutEngine
from modules.trend_engine.signals.pullback_engine import PullbackEngine
from modules.trend_engine.signals.trend_scoring_engine import TrendScoringEngine
from modules.trend_engine.validators.trend_validator import TrendValidator


class TrendService:

    def __init__(self) -> None:
        self._engine = TrendEngine()
        registry = get_registry()
        for name in registry.list_all():
            plugin = registry.get(name)
            if plugin:
                self._engine.register_plugin(plugin)
        self._signal_engine = TrendSignalEngine()
        self._breakout_engine = BreakoutEngine()
        self._pullback_engine = PullbackEngine()
        self._scoring_engine = TrendScoringEngine()

    @staticmethod
    def _to_price_bars(prices: list[PriceBarSchema]) -> list[PriceBar]:
        return [
            PriceBar(
                date=p.date, open=p.open, high=p.high,
                low=p.low, close=p.close, volume=p.volume,
                turnover=p.turnover,
            )
            for p in prices
        ]

    @staticmethod
    def _convert_indicator(r) -> IndicatorResponse:
        return IndicatorResponse(
            indicator=r.indicator,
            parameters=r.parameters,
            values=r.values,
            dates=r.dates,
            current_value=r.current_value,
            previous_value=r.previous_value,
            slope=r.slope,
            acceleration=r.acceleration,
            trend=r.trend.value,
            warnings=r.warnings,
            calculation_time_ms=r.calculation_time_ms,
        )

    @staticmethod
    def _convert_signal(s) -> SignalResponse:
        return SignalResponse(
            signal_type=s.signal_type.value,
            indicator=s.indicator,
            confidence=s.confidence,
            strength=s.strength,
            description=s.description,
            parameters=s.parameters,
        )

    def calculate(
        self,
        indicator: str,
        prices: list[PriceBarSchema],
        include_signals: bool = True,
        include_trend_analysis: bool = False,
        include_breakout: bool = False,
        include_pullback: bool = False,
        include_scoring: bool = False,
        **params,
    ) -> IndicatorResponse:
        bar_list = self._to_price_bars(prices)
        result = self._engine.calculate(
            indicator=indicator,
            prices=bar_list,
            include_signals=include_signals,
            include_trend_analysis=include_trend_analysis,
            include_breakout=include_breakout,
            include_pullback=include_pullback,
            include_scoring=include_scoring,
            **params,
        )
        return self._convert_indicator(result)

    def get_signals(
        self,
        indicator: str,
        prices: list[PriceBarSchema],
        **params,
    ) -> list[SignalResponse]:
        bar_list = self._to_price_bars(prices)
        result = self._engine.calculate(
            indicator=indicator,
            prices=bar_list,
            include_signals=True,
            **params,
        )
        plugin = self._engine.get_plugin(indicator)
        if plugin:
            signals = plugin.signals(result)
            return [self._convert_signal(s) for s in signals]
        return []

    def get_available_indicators(self) -> AvailableIndicatorsResponse:
        indicators = self._engine.list_plugins()
        details = {}
        for name in indicators:
            plugin = self._engine.get_plugin(name)
            if plugin:
                details[name] = plugin.metadata()
        return AvailableIndicatorsResponse(indicators=indicators, details=details)

    def get_cache_stats(self) -> CacheStatsResponse:
        stats = self._engine.cache_stats()
        return CacheStatsResponse(**stats)

    def analyze_trend(
        self, indicator: str, prices: list[PriceBarSchema], **params
    ) -> TrendResultResponse:
        bar_list = self._to_price_bars(prices)
        result = self._engine.calculate(
            indicator=indicator, prices=bar_list, include_signals=True, **params
        )
        trend = self._engine.analyze_trend(bar_list, result)
        return TrendResultResponse(
            primary_trend=trend.primary_trend.value,
            secondary_trend=trend.secondary_trend.value,
            micro_trend=trend.micro_trend.value,
            phase=trend.phase.value,
            strength=trend.strength,
            age=trend.age,
            stability=trend.stability,
            exhaustion=trend.exhaustion,
            continuation=trend.continuation,
            reversal_probability=trend.reversal_probability,
        )

    def benchmark_indicator(
        self, indicator: str, prices: list[PriceBarSchema], iterations: int = 1000
    ) -> BenchmarkResponse:
        bar_list = self._to_price_bars(prices)
        plugin = self._engine.get_plugin(indicator)
        if not plugin:
            raise ValueError(f"Unknown indicator: {indicator}")

        def calc():
            plugin.calculate(bar_list)

        result = TrendValidator.benchmark(calc, iterations)
        return BenchmarkResponse(
            indicator=indicator,
            iterations=result.iterations,
            total_seconds=result.total_seconds,
            avg_ms=result.avg_ms,
            ops_per_second=result.ops_per_second,
            memory_bytes=result.memory_bytes,
        )
