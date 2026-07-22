from __future__ import annotations

from modules.moving_average.core.engine import MovingAverageEngine
from modules.moving_average.core.registry import get_registry
from modules.moving_average.core.types import (
    PriceBar, MAType, Timeframe, TIMEFRAME_ORDER,
    FullResult, CrossResult, DistanceResult,
)
from modules.moving_average.validators.ma_validator import MAValidator
from modules.moving_average.timeframes.timeframe_manager import TimeframeManager
from modules.moving_average.schemas.ma_schemas import (
    PriceBarSchema, MAResponse, SlopeResponse, DistanceResponse,
    CrossResponse, TrendResponse, SmartSignalResponse, ScoreResponse,
    CrossoverResponse, CrossoverDistanceResponse,
    AvailableTypesResponse, TimeframeInfo, TimeframeListResponse,
    ValidateResponse,
)


class MAService:

    DEFAULT_PERIODS: dict[str, list[int]] = {
        "sma": [5, 10, 20, 50, 100, 200],
        "ema": [5, 10, 20, 50, 100, 200],
        "wma": [5, 10, 20, 50],
        "hma": [9, 18, 50],
        "smma": [10, 20, 50, 100],
        "vwma": [10, 20, 50],
    }

    def __init__(self) -> None:
        self._engine = MovingAverageEngine()
        registry = get_registry()
        for name in registry.list_all():
            plugin = registry.get(name)
            if plugin:
                self._engine.register_plugin(plugin)
        self._tf_manager = TimeframeManager()
        self._validator = MAValidator()

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
    def _convert_cross(c: CrossResult) -> CrossResponse:
        return CrossResponse(
            cross_type=c.cross_type.value,
            cross_strength=c.cross_strength.value,
            cross_date=c.cross_date,
            fast_period=c.fast_period,
            slow_period=c.slow_period,
            confirmed=c.confirmed,
            false_cross=c.false_cross,
            distance_at_cross=c.distance_at_cross,
        )

    @staticmethod
    def _convert_slope(s):
        if s is None:
            return None
        return SlopeResponse(
            slope=s.slope, angle_degrees=s.angle_degrees,
            acceleration=s.acceleration, is_accelerating=s.is_accelerating,
        )

    @staticmethod
    def _convert_distance(d):
        if d is None:
            return None
        return DistanceResponse(
            distance_pct=d.distance_pct, distance_abs=d.distance_abs,
            bars_to_cross=d.bars_to_cross, cross_probability=d.cross_probability,
        )

    @staticmethod
    def _convert_trend(t):
        if t is None:
            return None
        return TrendResponse(
            direction=t.direction.value, strength=t.strength,
            age=t.age, stability=t.stability,
            ma_value=t.ma_value, price_position=t.price_position,
        )

    @staticmethod
    def _convert_signals(signals):
        return [
            SmartSignalResponse(
                signal_type=s.signal_type, direction=s.direction,
                confidence=s.confidence, description=s.description,
            )
            for s in signals
        ]

    @staticmethod
    def _convert_scores(sc):
        if sc is None:
            return None
        return ScoreResponse(
            trend_score=sc.trend_score, momentum_score=sc.momentum_score,
            cross_score=sc.cross_score, acceleration_score=sc.acceleration_score,
            ma_score=sc.ma_score, components=sc.components,
        )

    @staticmethod
    def _result_to_response(r: FullResult) -> MAResponse:
        return MAResponse(
            indicator=r.indicator,
            period=r.period,
            values=r.values,
            dates=r.dates,
            current_value=r.current_value,
            previous_value=r.previous_value,
            slope=MAService._convert_slope(r.slope),
            distance_from_price=MAService._convert_distance(r.distance_from_price),
            trend=MAService._convert_trend(r.trend),
            signals=[MAService._convert_cross(c) for c in r.signals],
            smart_signals=MAService._convert_signals(r.smart_signals),
            scores=MAService._convert_scores(r.scores),
            calculation_time_ms=r.calculation_time_ms,
        )

    def calculate(
        self,
        ma_type: str,
        period: int,
        prices: list[PriceBarSchema],
        include_slope: bool = True,
        include_distance: bool = True,
        include_trend: bool = True,
        include_signals: bool = False,
        include_smart_signals: bool = False,
        include_scores: bool = False,
        fast_period: int | None = None,
        slow_period: int | None = None,
    ) -> MAResponse:
        period_errs = self._validator.validate_period(period)
        if period_errs:
            raise ValueError("; ".join(period_errs))
        price_errs = self._validator.validate_prices(self._to_price_bars(prices))
        if price_errs:
            raise ValueError("; ".join(price_errs))

        bar_list = self._to_price_bars(prices)
        result = self._engine.calculate(
            ma_type=ma_type,
            period=period,
            prices=bar_list,
            include_slope=include_slope,
            include_distance=include_distance,
            include_trend=include_trend,
            include_signals=include_signals,
            include_smart_signals=include_smart_signals,
            include_scores=include_scores,
            fast_period=fast_period,
            slow_period=slow_period,
        )
        return self._result_to_response(result)

    def calculate_multiple(
        self,
        ma_type: str,
        periods: list[int],
        prices: list[PriceBarSchema],
        include_slope: bool = True,
        include_distance: bool = False,
        include_trend: bool = False,
    ) -> list[MAResponse]:
        period_errs = self._validator.validate_periods(periods)
        if period_errs:
            raise ValueError("; ".join(period_errs))
        bar_list = self._to_price_bars(prices)
        results = self._engine.calculate_multiple(
            ma_type=ma_type, periods=periods, prices=bar_list,
            include_slope=include_slope,
            include_distance=include_distance,
            include_trend=include_trend,
        )
        return [self._result_to_response(r) for r in results]

    def calculate_crossovers(
        self,
        ma_type: str,
        fast_period: int,
        slow_period: int,
        prices: list[PriceBarSchema],
    ) -> CrossoverResponse:
        bar_list = self._to_price_bars(prices)
        raw = self._engine.calculate_crossovers(
            ma_type=ma_type, fast_period=fast_period,
            slow_period=slow_period, prices=bar_list,
        )
        dist = raw.get("current_distance")
        dist_resp = None
        if dist is not None:
            dist_resp = CrossoverDistanceResponse(
                distance_pct=dist.distance_pct,
                distance_abs=dist.distance_abs,
                bars_to_cross=dist.bars_to_cross,
                cross_probability=dist.cross_probability,
            )
        return CrossoverResponse(
            fast_period=raw["fast_period"],
            slow_period=raw["slow_period"],
            crosses=[self._convert_cross(c) for c in raw["crosses"]],
            current_distance=dist_resp,
            estimated_bars=raw.get("estimated_bars"),
            probability=raw.get("probability"),
        )

    def get_available_types(self) -> AvailableTypesResponse:
        return AvailableTypesResponse(
            types=self._engine.list_plugins(),
            default_periods=self.DEFAULT_PERIODS,
        )

    def get_timeframes(
        self,
        timeframe: str | None = None,
        uptrend_timeframes: list[str] | None = None,
    ) -> TimeframeListResponse:
        tf_enum = Timeframe(timeframe) if timeframe else None
        all_tfs = self._tf_manager.get_all()
        tf_infos = [
            TimeframeInfo(value=tf.value, order=TIMEFRAME_ORDER[tf])
            for tf in all_tfs
        ]
        higher = []
        lower = []
        alignment = None
        if tf_enum:
            higher = [t.value for t in self._tf_manager.get_higher(tf_enum)]
            lower = [t.value for t in self._tf_manager.get_lower(tf_enum)]
            if uptrend_timeframes:
                uptrend_enums = [Timeframe(t) for t in uptrend_timeframes if t in [tf.value for tf in all_tfs]]
                alignment = self._tf_manager.get_alignment_score(tf_enum, uptrend_enums)
        return TimeframeListResponse(
            timeframes=tf_infos,
            higher=higher,
            lower=lower,
            alignment_score=alignment,
        )

    def validate(
        self,
        ma_type: str,
        period: int,
        prices: list[PriceBarSchema],
    ) -> ValidateResponse:
        errors: list[str] = []
        warnings: list[str] = []

        period_errs = self._validator.validate_period(period)
        errors.extend(period_errs)

        bar_list = self._to_price_bars(prices)
        price_errs = self._validator.validate_prices(bar_list)
        errors.extend(price_errs)

        if ma_type.lower() not in self._engine.list_plugins():
            errors.append(f"Unknown MA type: {ma_type}. Available: {self._engine.list_plugins()}")

        data_points = len(prices)
        sufficient = data_points >= period

        if not sufficient and not errors:
            warnings.append(f"Insufficient data: {data_points} bars for period {period}. Results will have leading nulls.")

        if ma_type.lower() == "hma" and period < 2:
            errors.append("HMA period must be at least 2")
        if ma_type.lower() == "vwma" and all(p.volume == 0 for p in prices):
            warnings.append("All volumes are zero. VWMA will behave like SMA.")

        return ValidateResponse(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            data_points=data_points,
            sufficient_data=sufficient,
        )
