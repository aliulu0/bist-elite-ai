from __future__ import annotations

from modules.volume_engine.core.engine import VolumeEngine
from modules.volume_engine.core.registry import get_registry
from modules.volume_engine.core.types import PriceBar
from modules.volume_engine.schemas.volume_schemas import (
    PriceBarSchema, IndicatorResponse, SignalResponse,
    SmartMoneyResponse, LiquidityResponse, InstitutionalScoreResponse,
    VolumeScoreResponse, CacheStatsResponse, BenchmarkResponse,
    AvailableIndicatorsResponse,
)
from modules.volume_engine.validators.volume_validator import VolumeValidator


class VolumeService:

    def __init__(self) -> None:
        self._engine = VolumeEngine()
        registry = get_registry()
        for name in registry.list_all():
            plugin = registry.get(name)
            if plugin:
                self._engine.register_plugin(plugin)

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
        include_smart_money: bool = False,
        include_liquidity: bool = False,
        include_scoring: bool = False,
        **params,
    ) -> IndicatorResponse:
        bar_list = self._to_price_bars(prices)
        result = self._engine.calculate(
            indicator=indicator,
            prices=bar_list,
            include_signals=include_signals,
            include_smart_money=include_smart_money,
            include_liquidity=include_liquidity,
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

    def detect_smart_money(
        self, indicator: str, prices: list[PriceBarSchema], **params
    ) -> SmartMoneyResponse:
        bar_list = self._to_price_bars(prices)
        result = self._engine.calculate(
            indicator=indicator, prices=bar_list, include_signals=True, **params
        )
        sm = self._engine.detect_smart_money(bar_list, result)
        return SmartMoneyResponse(
            detection_type=sm.detection_type.value,
            confidence=sm.confidence,
            strength=sm.strength,
            description=sm.description,
            volume_ratio=sm.volume_ratio,
            price_impact=sm.price_impact,
        )

    def analyze_liquidity(
        self, prices: list[PriceBarSchema]
    ) -> LiquidityResponse:
        bar_list = self._to_price_bars(prices)
        liq = self._engine.analyze_liquidity(bar_list)
        return LiquidityResponse(
            liquidity_score=liq.liquidity_score,
            turnover_score=liq.turnover_score,
            spread_score=liq.spread_score,
            trade_activity=liq.trade_activity,
            avg_daily_volume=liq.avg_daily_volume,
            market_participation=liq.market_participation,
        )

    def get_institutional_score(
        self, prices: list[PriceBarSchema]
    ) -> InstitutionalScoreResponse:
        bar_list = self._to_price_bars(prices)
        results = self._engine.calculate_all(bar_list, include_signals=False)
        score = self._engine.get_institutional_score(bar_list, results)
        return InstitutionalScoreResponse(
            smart_money_score=score.smart_money_score,
            institutional_confidence=score.institutional_confidence,
            accumulation_score=score.accumulation_score,
            distribution_score=score.distribution_score,
            liquidity_score=score.liquidity_score,
            breakout_confirmation=score.breakout_confirmation,
            components=score.components,
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

        result = VolumeValidator.benchmark(calc, iterations)
        return BenchmarkResponse(
            indicator=indicator,
            iterations=result.iterations,
            total_seconds=result.total_seconds,
            avg_ms=result.avg_ms,
            ops_per_second=result.ops_per_second,
            memory_bytes=result.memory_bytes,
        )
