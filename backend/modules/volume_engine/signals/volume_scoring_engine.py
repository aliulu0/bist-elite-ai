from __future__ import annotations

from modules.volume_engine.core.types import (
    IndicatorResult, Signal, VolumeScore, PriceBar, InstitutionalScore,
    SmartMoneyResult, SmartMoneyType, TrendDirection,
)
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator


class VolumeScoringEngine:

    def calculate_volume_score(self, result: IndicatorResult) -> float:
        if result.current_value is None:
            return 50.0
        score = 50.0
        slope = result.slope or 0
        score += min(25, slope * 2000)
        if result.trend == TrendDirection.BULLISH:
            score += 10
        elif result.trend == TrendDirection.BEARISH:
            score -= 10
        return max(0.0, min(100.0, score))

    def calculate_liquidity_score(self, prices: list[PriceBar]) -> float:
        if not prices:
            return 0.0
        volumes = [p.volume for p in prices]
        avg_vol = sum(volumes) / len(volumes)
        return min(100.0, avg_vol / 1000.0 * 10)

    def calculate_participation_score(self, result: IndicatorResult, prices: list[PriceBar]) -> float:
        if not prices or result.current_value is None:
            return 50.0
        volumes = [p.volume for p in prices]
        n = len(volumes)
        if n < 5:
            return 50.0
        recent_avg = sum(volumes[-5:]) / 5
        overall_avg = sum(volumes) / n
        if overall_avg > 0:
            return min(100.0, (recent_avg / overall_avg) * 50)
        return 50.0

    def calculate_institutional_score(
        self, result: IndicatorResult, smart_money: SmartMoneyResult
    ) -> float:
        score = 50.0
        if smart_money.detection_type == SmartMoneyType.INSTITUTIONAL_ACCUMULATION:
            score += smart_money.confidence * 30
        elif smart_money.detection_type == SmartMoneyType.INSTITUTIONAL_DISTRIBUTION:
            score -= smart_money.confidence * 30
        elif smart_money.detection_type == SmartMoneyType.HIDDEN_BUYING:
            score += smart_money.confidence * 20
        elif smart_money.detection_type == SmartMoneyType.HIDDEN_SELLING:
            score -= smart_money.confidence * 20
        elif smart_money.detection_type == SmartMoneyType.VOLUME_SPIKE:
            score += smart_money.price_impact * 20
        return max(0.0, min(100.0, score))

    def calculate_confidence(
        self, result: IndicatorResult, prices: list[PriceBar]
    ) -> float:
        if not prices:
            return 0.0
        data_score = min(50.0, len(prices) / 2)
        validity_score = 50.0 if result.current_value is not None else 0.0
        return min(100.0, data_score + validity_score)

    def calculate_composite(
        self,
        result: IndicatorResult,
        signals: list[Signal],
        prices: list[PriceBar],
    ) -> VolumeScore:
        vs = self.calculate_volume_score(result)
        ls = self.calculate_liquidity_score(prices)
        ps = self.calculate_participation_score(result, prices)
        iscore = 50.0
        if result.trend != TrendDirection.NEUTRAL:
            iscore = 60.0 if result.trend == TrendDirection.BULLISH else 40.0
        conf = self.calculate_confidence(result, prices)
        return VolumeScore(
            volume_score=round(vs, 2),
            liquidity_score=round(ls, 2),
            participation_score=round(ps, 2),
            institutional_score=round(iscore, 2),
            confidence=round(conf, 2),
            components={
                "current_value": result.current_value,
                "slope": result.slope,
                "trend": result.trend.value,
                "signal_count": len(signals),
            },
        )

    def calculate_institutional(
        self,
        prices: list[PriceBar],
        results: dict[str, IndicatorResult],
    ) -> InstitutionalScore:
        vs = self.calculate_liquidity_score(prices)
        conf = 0.0
        for r in results.values():
            if r.current_value is not None:
                conf += 10
        conf = min(100.0, conf)

        acc = 50.0
        dist = 50.0
        sm_score = 50.0
        for r in results.values():
            if r.trend == TrendDirection.BULLISH:
                acc += 5
            elif r.trend == TrendDirection.BEARISH:
                dist += 5

        return InstitutionalScore(
            smart_money_score=round(sm_score, 2),
            institutional_confidence=round(conf, 2),
            accumulation_score=round(min(100.0, acc), 2),
            distribution_score=round(min(100.0, dist), 2),
            liquidity_score=round(vs, 2),
            breakout_confirmation=50.0,
            components={"result_count": len(results)},
        )
