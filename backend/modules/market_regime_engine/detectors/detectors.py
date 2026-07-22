from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.market_regime_engine.core.types import (
    DetectionSignal,
    MarketRegime,
    RegimeSignal,
    _mean,
    _stdev,
)


class MovingAverageDetector:
    """Detects regime from moving average structure."""

    def detect(self, data: Dict[str, float]) -> RegimeSignal:
        price = data.get("price", 100.0)
        ma20 = data.get("ma20", price)
        ma50 = data.get("ma50", price)
        ma200 = data.get("ma200", price)

        score = 0.5
        if price > ma20 > ma50 > ma200:
            score = 0.9
        elif price > ma20 > ma50:
            score = 0.75
        elif price > ma20:
            score = 0.6
        elif price < ma20 < ma50 < ma200:
            score = 0.1
        elif price < ma20 < ma50:
            score = 0.25
        elif price < ma20:
            score = 0.4

        confidence = min(1.0, abs(score - 0.5) * 2.0)
        return RegimeSignal(
            signal_type=DetectionSignal.MOVING_AVERAGE_STRUCTURE,
            value=score,
            normalized_value=score,
            confidence=confidence,
            weight=1.5,
            description=f"MA structure score: {score:.2f}",
        )


class BreadthDetector:
    """Detects regime from market breadth indicators."""

    def detect(self, data: Dict[str, float]) -> RegimeSignal:
        advance_decline = data.get("advance_decline_ratio", 1.0)
        pct_above_ma = data.get("pct_above_ma50", 50.0)
        new_highs_lows = data.get("new_highs_lows_ratio", 0.0)

        ad_score = min(1.0, max(0.0, (advance_decline - 0.5) / 1.5))
        ma_score = pct_above_ma / 100.0
        hl_score = min(1.0, max(0.0, (new_highs_lows + 1.0) / 2.0))

        score = ad_score * 0.4 + ma_score * 0.35 + hl_score * 0.25
        confidence = min(1.0, abs(score - 0.5) * 2.0)

        return RegimeSignal(
            signal_type=DetectionSignal.BREADTH_INDICATORS,
            value=score,
            normalized_value=score,
            confidence=confidence,
            weight=1.3,
            description=f"Breadth score: {score:.2f}",
        )


class VolatilityDetector:
    """Detects regime from volatility levels."""

    def detect(self, data: Dict[str, float]) -> RegimeSignal:
        vix = data.get("vix", 20.0)
        atr = data.get("atr", 1.0)
        atr_pct = data.get("atr_pct", 1.5)

        vix_score = max(0.0, min(1.0, 1.0 - (vix - 10) / 40.0))
        atr_score = max(0.0, min(1.0, 1.0 - (atr_pct - 0.5) / 3.0))

        score = vix_score * 0.6 + atr_score * 0.4
        confidence = min(1.0, abs(score - 0.5) * 2.0)

        return RegimeSignal(
            signal_type=DetectionSignal.VOLATILITY,
            value=score,
            normalized_value=score,
            confidence=confidence,
            weight=1.2,
            description=f"Volatility score: {score:.2f}",
        )


class MomentumDetector:
    """Detects regime from momentum indicators."""

    def detect(self, data: Dict[str, float]) -> RegimeSignal:
        rsi = data.get("rsi", 50.0)
        macd_hist = data.get("macd_hist", 0.0)
        roc = data.get("roc", 0.0)
        stochastic = data.get("stochastic_k", 50.0)

        rsi_score = rsi / 100.0
        macd_score = max(0.0, min(1.0, 0.5 + macd_hist * 10.0))
        roc_score = max(0.0, min(1.0, 0.5 + roc / 10.0))
        stoch_score = stochastic / 100.0

        score = rsi_score * 0.3 + macd_score * 0.3 + roc_score * 0.2 + stoch_score * 0.2
        confidence = min(1.0, abs(score - 0.5) * 2.0)

        return RegimeSignal(
            signal_type=DetectionSignal.MOMENTUM,
            value=score,
            normalized_value=score,
            confidence=confidence,
            weight=1.4,
            description=f"Momentum score: {score:.2f}",
        )


class TrendStrengthDetector:
    """Detects regime from ADX and trend indicators."""

    def detect(self, data: Dict[str, float]) -> RegimeSignal:
        adx = data.get("adx", 25.0)
        plus_di = data.get("plus_di", 25.0)
        minus_di = data.get("minus_di", 25.0)

        trend_strength = adx / 100.0
        direction = (plus_di - minus_di) / max(plus_di + minus_di, 1.0)
        score = 0.5 + direction * trend_strength
        score = max(0.0, min(1.0, score))
        confidence = min(1.0, adx / 50.0)

        return RegimeSignal(
            signal_type=DetectionSignal.TREND_STRENGTH,
            value=score,
            normalized_value=score,
            confidence=confidence,
            weight=1.3,
            description=f"Trend strength: {score:.2f} (ADX: {adx:.1f})",
        )


class VolumeExpansionDetector:
    """Detects regime from volume patterns."""

    def detect(self, data: Dict[str, float]) -> RegimeSignal:
        relative_volume = data.get("relative_volume", 1.0)
        obv_trend = data.get("obv_trend", 0.0)
        cmf = data.get("cmf", 0.0)

        vol_score = min(1.0, relative_volume / 2.0)
        obv_score = max(0.0, min(1.0, 0.5 + obv_trend * 5.0))
        cmf_score = max(0.0, min(1.0, 0.5 + cmf))

        score = vol_score * 0.4 + obv_score * 0.3 + cmf_score * 0.3
        confidence = min(1.0, abs(score - 0.5) * 2.0)

        return RegimeSignal(
            signal_type=DetectionSignal.VOLUME_EXPANSION,
            value=score,
            normalized_value=score,
            confidence=confidence,
            weight=1.0,
            description=f"Volume expansion: {score:.2f}",
        )


class SectorRotationDetector:
    """Detects regime from sector rotation patterns."""

    def detect(self, data: Dict[str, float]) -> RegimeSignal:
        leading_count = data.get("leading_sectors", 3.0)
        weak_count = data.get("weak_sectors", 3.0)
        total_sectors = data.get("total_sectors", 10.0)

        if total_sectors == 0:
            total_sectors = 10.0
        breadth = leading_count / total_sectors
        score = max(0.0, min(1.0, breadth))
        confidence = min(1.0, abs(score - 0.5) * 2.0)

        return RegimeSignal(
            signal_type=DetectionSignal.SECTOR_ROTATION,
            value=score,
            normalized_value=score,
            confidence=confidence,
            weight=1.1,
            description=f"Sector rotation: {score:.2f}",
        )


class LiquidityDetector:
    """Detects regime from liquidity conditions."""

    def detect(self, data: Dict[str, float]) -> RegimeSignal:
        bid_ask_spread = data.get("bid_ask_spread", 0.01)
        market_depth = data.get("market_depth", 1.0)
        turnover_ratio = data.get("turnover_ratio", 1.0)

        spread_score = max(0.0, min(1.0, 1.0 - bid_ask_spread * 100.0))
        depth_score = min(1.0, market_depth / 2.0)
        turnover_score = min(1.0, turnover_ratio / 2.0)

        score = spread_score * 0.4 + depth_score * 0.3 + turnover_score * 0.3
        confidence = min(1.0, abs(score - 0.5) * 2.0)

        return RegimeSignal(
            signal_type=DetectionSignal.LIQUIDITY,
            value=score,
            normalized_value=score,
            confidence=confidence,
            weight=0.8,
            description=f"Liquidity score: {score:.2f}",
        )


class ParticipationDetector:
    """Detects regime from market participation metrics."""

    def detect(self, data: Dict[str, float]) -> RegimeSignal:
        advance_pct = data.get("advance_decline_pct", 50.0)
        above_200ma = data.get("pct_above_ma200", 50.0)
        new_highs = data.get("new_52w_highs_pct", 10.0)
        up_volume_pct = data.get("up_volume_pct", 50.0)

        ad_score = advance_pct / 100.0
        ma_score = above_200ma / 100.0
        high_score = min(1.0, new_highs / 30.0)
        vol_score = up_volume_pct / 100.0

        score = ad_score * 0.3 + ma_score * 0.3 + high_score * 0.2 + vol_score * 0.2
        confidence = min(1.0, abs(score - 0.5) * 2.0)

        return RegimeSignal(
            signal_type=DetectionSignal.MARKET_PARTICIPATION,
            value=score,
            normalized_value=score,
            confidence=confidence,
            weight=1.2,
            description=f"Market participation: {score:.2f}",
        )


DETECTOR_MAP = {
    DetectionSignal.MOVING_AVERAGE_STRUCTURE: MovingAverageDetector,
    DetectionSignal.BREADTH_INDICATORS: BreadthDetector,
    DetectionSignal.VOLATILITY: VolatilityDetector,
    DetectionSignal.MOMENTUM: MomentumDetector,
    DetectionSignal.TREND_STRENGTH: TrendStrengthDetector,
    DetectionSignal.VOLUME_EXPANSION: VolumeExpansionDetector,
    DetectionSignal.SECTOR_ROTATION: SectorRotationDetector,
    DetectionSignal.LIQUIDITY: LiquidityDetector,
    DetectionSignal.MARKET_PARTICIPATION: ParticipationDetector,
}
