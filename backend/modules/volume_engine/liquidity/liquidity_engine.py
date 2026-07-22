from __future__ import annotations

from modules.volume_engine.core.types import PriceBar, LiquidityResult
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator


class LiquidityEngine:

    def calculate(self, prices: list[PriceBar]) -> LiquidityResult:
        if not prices:
            return LiquidityResult()

        n = len(prices)
        volumes = [p.volume for p in prices]
        turnovers = [p.turnover for p in prices]

        avg_vol = sum(volumes) / n if n > 0 else 0.0
        vol_sma = VolumeCalculator.sma(volumes, 20)
        current_sma_vol = vol_sma[-1] if vol_sma[-1] is not None else avg_vol

        liquidity_score = min(100.0, avg_vol / 1000.0 * 10)

        total_turnover = sum(turnovers)
        turnover_score = min(100.0, total_turnover / 1_000_000.0 * 10) if total_turnover > 0 else 0.0

        spreads = []
        for p in prices:
            rng = p.high - p.low
            mid = (p.high + p.low) / 2
            if mid > 0:
                spreads.append(rng / mid)
        avg_spread = sum(spreads) / len(spreads) if spreads else 0.0
        spread_score = max(0.0, 100.0 - avg_spread * 1000)

        recent_vols = volumes[-min(10, n):]
        trade_activity = len([v for v in recent_vols if v > current_sma_vol * 0.5]) / len(recent_vols) * 100 if recent_vols else 50.0

        vol_sma_5 = VolumeCalculator.sma(volumes, 5)
        vol_sma_20 = VolumeCalculator.sma(volumes, 20)
        participation = 50.0
        if vol_sma_5[-1] is not None and vol_sma_20[-1] is not None and vol_sma_20[-1] > 0:
            participation = min(100.0, (vol_sma_5[-1] / vol_sma_20[-1]) * 50)

        return LiquidityResult(
            liquidity_score=round(liquidity_score, 2),
            turnover_score=round(turnover_score, 2),
            spread_score=round(spread_score, 2),
            trade_activity=round(trade_activity, 2),
            avg_daily_volume=round(avg_vol, 0),
            market_participation=round(participation, 2),
        )
