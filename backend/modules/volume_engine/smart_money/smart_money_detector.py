from __future__ import annotations

from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, SmartMoneyResult, SmartMoneyType, TrendDirection,
)
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator


class SmartMoneyDetector:

    def detect(
        self, prices: list[PriceBar], result: IndicatorResult
    ) -> SmartMoneyResult:
        if len(prices) < 10:
            return SmartMoneyResult()

        volumes = [p.volume for p in prices]
        closes = [p.close for p in prices]
        highs = [p.high for p in prices]
        lows = [p.low for p in prices]

        current_vol = volumes[-1]
        vol_sma = VolumeCalculator.sma(volumes, 20)
        avg_vol = vol_sma[-1] if vol_sma[-1] is not None else sum(volumes) / len(volumes)
        vol_ratio = current_vol / avg_vol if avg_vol > 0 else 1.0

        distribution = VolumeCalculator.distribution(prices)

        if vol_ratio > 3.0:
            if distribution[-1] > 0.6:
                return SmartMoneyResult(
                    detection_type=SmartMoneyType.VOLUME_SPIKE,
                    confidence=min(1.0, vol_ratio / 5),
                    strength=min(1.0, vol_ratio / 5),
                    volume_ratio=vol_ratio,
                    price_impact=distribution[-1] - 0.5,
                    description=f"Volume spike with buying: {vol_ratio:.1f}x avg",
                )
            elif distribution[-1] < 0.4:
                return SmartMoneyResult(
                    detection_type=SmartMoneyType.VOLUME_SPIKE,
                    confidence=min(1.0, vol_ratio / 5),
                    strength=min(1.0, vol_ratio / 5),
                    volume_ratio=vol_ratio,
                    price_impact=distribution[-1] - 0.5,
                    description=f"Volume spike with selling: {vol_ratio:.1f}x avg",
                )

        if vol_ratio > 2.0 and distribution[-1] > 0.7:
            price_trend = closes[-1] - closes[-5] if len(closes) >= 5 else 0
            if price_trend < 0:
                return SmartMoneyResult(
                    detection_type=SmartMoneyType.HIDDEN_BUYING,
                    confidence=0.7,
                    strength=0.6,
                    volume_ratio=vol_ratio,
                    price_impact=distribution[-1] - 0.5,
                    description="Hidden buying: high volume on down price",
                )

        if vol_ratio > 2.0 and distribution[-1] < 0.3:
            price_trend = closes[-1] - closes[-5] if len(closes) >= 5 else 0
            if price_trend > 0:
                return SmartMoneyResult(
                    detection_type=SmartMoneyType.HIDDEN_SELLING,
                    confidence=0.7,
                    strength=0.6,
                    volume_ratio=vol_ratio,
                    price_impact=distribution[-1] - 0.5,
                    description="Hidden selling: high volume on up price",
                )

        if vol_ratio < 0.5 and result.trend == TrendDirection.BULLISH:
            return SmartMoneyResult(
                detection_type=SmartMoneyType.SILENT_ACCUMULATION,
                confidence=0.5,
                strength=0.4,
                volume_ratio=vol_ratio,
                description="Silent accumulation: low volume in uptrend",
            )

        if vol_ratio > 1.5 and result.trend == TrendDirection.BULLISH:
            recent_avg_dist = sum(distribution[-5:]) / 5 if len(distribution) >= 5 else 0.5
            if recent_avg_dist > 0.6:
                return SmartMoneyResult(
                    detection_type=SmartMoneyType.INSTITUTIONAL_ACCUMULATION,
                    confidence=min(0.9, vol_ratio * 0.3 + recent_avg_dist * 0.4),
                    strength=min(1.0, vol_ratio * 0.2 + recent_avg_dist * 0.5),
                    volume_ratio=vol_ratio,
                    price_impact=recent_avg_dist - 0.5,
                    description=f"Institutional accumulation: {vol_ratio:.1f}x vol, {recent_avg_dist:.0%} buying",
                )

        if vol_ratio > 1.5 and result.trend == TrendDirection.BEARISH:
            recent_avg_dist = sum(distribution[-5:]) / 5 if len(distribution) >= 5 else 0.5
            if recent_avg_dist < 0.4:
                return SmartMoneyResult(
                    detection_type=SmartMoneyType.INSTITUTIONAL_DISTRIBUTION,
                    confidence=min(0.9, vol_ratio * 0.3 + (1 - recent_avg_dist) * 0.4),
                    strength=min(1.0, vol_ratio * 0.2 + (1 - recent_avg_dist) * 0.5),
                    volume_ratio=vol_ratio,
                    price_impact=recent_avg_dist - 0.5,
                    description=f"Institutional distribution: {vol_ratio:.1f}x vol, {(1-recent_avg_dist):.0%} selling",
                )

        if vol_ratio > 2.0:
            absorption_detected = False
            for i in range(-5, 0):
                if distribution[i] > 0.6 and volumes[i] > avg_vol * 1.5:
                    absorption_detected = True
                    break
            if absorption_detected:
                return SmartMoneyResult(
                    detection_type=SmartMoneyType.ABSORPTION,
                    confidence=0.65,
                    strength=0.55,
                    volume_ratio=vol_ratio,
                    description="Volume absorption detected",
                )

        return SmartMoneyResult()
