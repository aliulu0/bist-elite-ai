from __future__ import annotations

import math
from modules.volume_engine.core.types import PriceBar, VolumeAnalysis, VolumeNodeType


class VolumeCalculator:

    @staticmethod
    def sma(values: list[float], period: int) -> list[float | None]:
        n = len(values)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        window = sum(values[:period])
        result[period - 1] = window / period
        for i in range(period, n):
            window += values[i] - values[i - period]
            result[i] = window / period
        return result

    @staticmethod
    def ema(values: list[float], period: int) -> list[float | None]:
        n = len(values)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        k = 2.0 / (period + 1)
        sma_val = sum(values[:period]) / period
        result[period - 1] = sma_val
        for i in range(period, n):
            sma_val = values[i] * k + sma_val * (1 - k)
            result[i] = sma_val
        return result

    @staticmethod
    def wilder_smoothing(values: list[float], period: int) -> list[float | None]:
        n = len(values)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        avg = sum(values[:period]) / period
        result[period - 1] = avg
        for i in range(period, n):
            avg = (avg * (period - 1) + values[i]) / period
            result[i] = avg
        return result

    @staticmethod
    def true_range(prices: list[PriceBar]) -> list[float]:
        n = len(prices)
        tr = [0.0] * n
        for i in range(1, n):
            h = prices[i].high
            l = prices[i].low
            pc = prices[i - 1].close
            tr[i] = max(h - l, abs(h - pc), abs(l - pc))
        return tr

    @staticmethod
    def money_flow(prices: list[PriceBar]) -> list[float]:
        n = len(prices)
        mf = [0.0] * n
        for i in range(n):
            tp = (prices[i].high + prices[i].low + prices[i].close) / 3
            mf[i] = tp * prices[i].volume
        return mf

    @staticmethod
    def positive_negative_flow(prices: list[PriceBar]) -> tuple[list[float], list[float]]:
        n = len(prices)
        pos = [0.0] * n
        neg = [0.0] * n
        for i in range(1, n):
            tp = (prices[i].high + prices[i].low + prices[i].close) / 3
            if tp > (prices[i - 1].high + prices[i - 1].low + prices[i - 1].close) / 3:
                pos[i] = tp * prices[i].volume
            else:
                neg[i] = tp * prices[i].volume
        return pos, neg

    @staticmethod
    def volume_weighted_average(prices: list[PriceBar]) -> list[float | None]:
        n = len(prices)
        result: list[float | None] = [None] * n
        cumulative_tpv = 0.0
        cumulative_vol = 0.0
        for i in range(n):
            tp = (prices[i].high + prices[i].low + prices[i].close) / 3
            cumulative_tpv += tp * prices[i].volume
            cumulative_vol += prices[i].volume
            if cumulative_vol > 0:
                result[i] = cumulative_tpv / cumulative_vol
        return result

    @staticmethod
    def relative_volume(prices: list[PriceBar], period: int = 20) -> list[float | None]:
        n = len(prices)
        volumes = [p.volume for p in prices]
        vol_sma = VolumeCalculator.sma(volumes, period)
        result: list[float | None] = [None] * n
        for i in range(n):
            if vol_sma[i] is not None and vol_sma[i] > 0:
                result[i] = volumes[i] / vol_sma[i]
        return result

    @staticmethod
    def analyze(prices: list[PriceBar], period: int = 20) -> VolumeAnalysis:
        n = len(prices)
        volumes = [p.volume for p in prices]
        vol_sma = VolumeCalculator.sma(volumes, period)
        vol_ema = VolumeCalculator.ema(volumes, period)

        current_vol = volumes[-1] if n > 0 else 0.0
        current_sma = vol_sma[-1] if vol_sma[-1] is not None else current_vol
        current_ema = vol_ema[-1] if vol_ema[-1] is not None else current_vol

        relative_vol = current_vol / current_sma if current_sma > 0 else 1.0

        growth = 0.0
        if n >= 2:
            prev_vol = volumes[-2]
            growth = (current_vol - prev_vol) / prev_vol if prev_vol > 0 else 0.0

        momentum = 0.0
        if n >= 3:
            momentum = (current_vol - volumes[-3]) / volumes[-3] if volumes[-3] > 0 else 0.0

        acceleration = 0.0
        if n >= 3:
            m1 = (volumes[-2] - volumes[-3]) / volumes[-3] if volumes[-3] > 0 else 0
            m2 = growth
            acceleration = m2 - m1

        sorted_vols = sorted(volumes)
        rank = 0.0
        if n > 0:
            idx = 0
            for i, v in enumerate(sorted_vols):
                if v >= current_vol:
                    idx = i
                    break
            rank = (idx / n) * 100

        mean_vol = sum(volumes) / n if n > 0 else 0.0
        variance = sum((v - mean_vol) ** 2 for v in volumes) / n if n > 0 else 0.0
        std_vol = variance ** 0.5
        z_score = (current_vol - mean_vol) / std_vol if std_vol > 0 else 0.0

        percentile = 0.0
        if n > 0:
            count_below = sum(1 for v in volumes if v < current_vol)
            percentile = (count_below / n) * 100

        decay = -growth if growth < 0 else 0.0

        return VolumeAnalysis(
            volume_sma=round(current_sma, 2),
            volume_ema=round(current_ema, 2),
            relative_volume=round(relative_vol, 4),
            volume_growth=round(growth, 4),
            volume_decay=round(decay, 4),
            volume_momentum=round(momentum, 4),
            volume_acceleration=round(acceleration, 4),
            volume_percentile=round(percentile, 2),
            volume_z_score=round(z_score, 4),
            volume_rank=round(rank, 2),
        )

    @staticmethod
    def distribution(prices: list[PriceBar]) -> list[float]:
        n = len(prices)
        result = [0.0] * n
        for i in range(n):
            rng = prices[i].high - prices[i].low
            if rng > 0:
                result[i] = (prices[i].close - prices[i].low) / rng
            else:
                result[i] = 0.5
        return result

    @staticmethod
    def volume_nodes(
        prices: list[PriceBar], num_bins: int = 24
    ) -> list[VolumeNodeType]:
        if not prices:
            return []
        lows = [p.low for p in prices]
        highs = [p.high for p in prices]
        min_p = min(lows)
        max_p = max(highs)
        if max_p == min_p:
            return [VolumeNodeType.BALANCED] * len(prices)

        bin_size = (max_p - min_p) / num_bins
        price_bins: dict[int, float] = {}
        for i, p in enumerate(prices):
            mid = (p.high + p.low) / 2
            b = int((mid - min_p) / bin_size) if bin_size > 0 else 0
            b = min(b, num_bins - 1)
            price_bins[b] = price_bins.get(b, 0) + p.volume

        if not price_bins:
            return [VolumeNodeType.BALANCED] * len(prices)

        avg_vol = sum(price_bins.values()) / len(price_bins)
        nodes: list[VolumeNodeType] = []
        for p in prices:
            mid = (p.high + p.low) / 2
            b = int((mid - min_p) / bin_size) if bin_size > 0 else 0
            b = min(b, num_bins - 1)
            bin_vol = price_bins.get(b, 0)
            if bin_vol > avg_vol * 1.5:
                nodes.append(VolumeNodeType.HIGH)
            elif bin_vol < avg_vol * 0.5:
                nodes.append(VolumeNodeType.LOW)
            else:
                nodes.append(VolumeNodeType.BALANCED)
        return nodes
