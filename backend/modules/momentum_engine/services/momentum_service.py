from __future__ import annotations

from modules.momentum_engine.core.engine import MomentumEngine
from modules.momentum_engine.core.registry import get_registry
from modules.momentum_engine.core.types import PriceBar
from modules.momentum_engine.schemas.momentum_schemas import (
    PriceBarSchema, IndicatorResponse, SignalResponse, DivergenceResponse,
    MomentumScoreResponse, CacheStatsResponse, BenchmarkResponse,
    AvailableIndicatorsResponse, SignalAggregateResponse,
)
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.signals.scoring_engine import ScoringEngine
from modules.momentum_engine.validators.momentum_validator import MomentumValidator


class MomentumService:

    def __init__(self) -> None:
        self._engine = MomentumEngine()
        registry = get_registry()
        for name in registry.list_all():
            plugin = registry.get(name)
            if plugin:
                self._engine.register_plugin(plugin)
        self._signal_engine = SignalEngine()
        self._scoring_engine = ScoringEngine()

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

    @staticmethod
    def _convert_divergence(d) -> DivergenceResponse:
        return DivergenceResponse(
            divergence_type=d.divergence_type.value,
            indicator=d.indicator,
            start_idx=d.start_idx,
            end_idx=d.end_idx,
            confidence=d.confidence,
            description=d.description,
        )

    @staticmethod
    def _convert_score(sc) -> MomentumScoreResponse:
        return MomentumScoreResponse(
            momentum_score=sc.momentum_score,
            trend_score=sc.trend_score,
            signal_score=sc.signal_score,
            strength_score=sc.strength_score,
            confidence_score=sc.confidence_score,
            composite_score=sc.composite_score,
            components=sc.components,
        )

    def calculate(
        self,
        indicator: str,
        prices: list[PriceBarSchema],
        include_signals: bool = True,
        include_divergence: bool = False,
        include_scoring: bool = False,
        **params,
    ) -> IndicatorResponse:
        bar_list = self._to_price_bars(prices)
        result = self._engine.calculate(
            indicator=indicator,
            prices=bar_list,
            include_signals=include_signals,
            include_divergence=include_divergence,
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

    def get_divergence(
        self,
        indicator: str,
        prices: list[PriceBarSchema],
        **params,
    ) -> list[DivergenceResponse]:
        bar_list = self._to_price_bars(prices)
        result = self._engine.calculate(
            indicator=indicator,
            prices=bar_list,
            include_divergence=True,
            **params,
        )
        from modules.momentum_engine.signals.divergence_engine import DivergenceEngine
        div_engine = DivergenceEngine()
        closes = [p.close for p in bar_list]
        divs = div_engine.detect(result.values, closes)
        return [self._convert_divergence(d) for d in divs]

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

    def benchmark_indicator(
        self, indicator: str, prices: list[PriceBarSchema], iterations: int = 1000
    ) -> BenchmarkResponse:
        bar_list = self._to_price_bars(prices)
        plugin = self._engine.get_plugin(indicator)
        if not plugin:
            raise ValueError(f"Unknown indicator: {indicator}")

        def calc():
            plugin.calculate(bar_list)

        result = MomentumValidator.benchmark(calc, iterations)
        return BenchmarkResponse(
            indicator=indicator,
            iterations=result.iterations,
            total_seconds=result.total_seconds,
            avg_ms=result.avg_ms,
            ops_per_second=result.ops_per_second,
            memory_bytes=result.memory_bytes,
        )
