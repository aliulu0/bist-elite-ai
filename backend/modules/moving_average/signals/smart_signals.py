from __future__ import annotations

import math
from modules.moving_average.core.types import SmartSignal, CrossResult, CrossType


class SmartSignalEngine:

    def generate(
        self,
        fast_ma: list[float | None],
        slow_ma: list[float | None],
        closes: list[float],
        dates: list[str],
        fast_period: int,
        slow_period: int,
        lookback: int = 20,
    ) -> list[SmartSignal]:
        signals: list[SmartSignal] = []
        n = min(len(fast_ma), len(slow_ma), len(closes))
        if n < lookback + 1:
            return signals

        idx = n - 1
        f_curr = fast_ma[idx]
        s_curr = slow_ma[idx]
        if f_curr is None or s_curr is None:
            return signals

        diff = f_curr - s_curr
        diff_pct = diff / abs(s_curr) if s_curr != 0 else 0

        f_slope = self._slope(fast_ma, idx, 5)
        s_slope = self._slope(slow_ma, idx, 5)

        recent_crosses = self._count_recent_crosses(fast_ma, slow_ma, idx, lookback)

        if diff > 0 and f_slope is not None and f_slope > 0:
            dist_shrinking = self._is_converging(fast_ma, slow_ma, idx, 10)
            if dist_shrinking:
                signals.append(SmartSignal(
                    signal_type="trend_exhaustion",
                    direction="bearish",
                    confidence=0.6,
                    description=f"Bullish trend may be exhausting. MAs converging while above.",
                ))

        if diff < 0 and f_slope is not None and f_slope > 0 and s_slope is not None and s_slope < 0:
            signals.append(SmartSignal(
                signal_type="early_bullish",
                direction="bullish",
                confidence=0.5,
                description=f"Early bullish signal. Fast MA accelerating toward slow MA.",
            ))

        if diff > 0 and f_slope is not None and f_slope < 0 and s_slope is not None and s_slope > 0:
            signals.append(SmartSignal(
                signal_type="early_bearish",
                direction="bearish",
                confidence=0.5,
                description=f"Early bearish signal. Fast MA decelerating toward slow MA.",
            ))

        if diff < 0 and abs(diff_pct) < 0.005:
            signals.append(SmartSignal(
                signal_type="pullback_opportunity",
                direction="bullish",
                confidence=0.65,
                description=f"Potential pullback opportunity. Price near MA support.",
            ))

        if diff > 0 and recent_crosses == 0:
            bars_above = self._bars_since_cross(fast_ma, slow_ma, idx, CrossType.GOLDEN)
            if bars_above is not None and bars_above > lookback // 2:
                signals.append(SmartSignal(
                    signal_type="trend_continuation",
                    direction="bullish",
                    confidence=0.55,
                    description=f"Bullish trend continuation. {bars_above} bars above slow MA.",
                ))

        if diff < 0 and recent_crosses == 0:
            bars_below = self._bars_since_cross(fast_ma, slow_ma, idx, CrossType.DEATH)
            if bars_below is not None and bars_below > lookback // 2:
                signals.append(SmartSignal(
                    signal_type="trend_continuation",
                    direction="bearish",
                    confidence=0.55,
                    description=f"Bearish trend continuation. {bars_below} bars below slow MA.",
                ))

        return signals

    @staticmethod
    def _slope(values: list[float | None], idx: int, window: int) -> float | None:
        start = max(0, idx - window)
        vals = [v for v in values[start:idx + 1] if v is not None]
        if len(vals) < 2:
            return None
        return (vals[-1] - vals[0]) / len(vals)

    @staticmethod
    def _is_converging(
        fast_ma: list[float | None],
        slow_ma: list[float | None],
        idx: int,
        window: int,
    ) -> bool:
        diffs = []
        for i in range(max(0, idx - window), idx + 1):
            f = fast_ma[i]
            s = slow_ma[i]
            if f is not None and s is not None:
                diffs.append(abs(f - s))
        if len(diffs) < 3:
            return False
        return diffs[-1] < diffs[0]

    @staticmethod
    def _count_recent_crosses(
        fast_ma: list[float | None],
        slow_ma: list[float | None],
        idx: int,
        lookback: int,
    ) -> int:
        count = 0
        start = max(1, idx - lookback)
        for i in range(start, idx + 1):
            f_c = fast_ma[i]
            f_p = fast_ma[i - 1]
            s_c = slow_ma[i]
            s_p = slow_ma[i - 1]
            if any(v is None for v in [f_c, f_p, s_c, s_p]):
                continue
            if (f_p <= s_p and f_c > s_c) or (f_p >= s_p and f_c < s_c):
                count += 1
        return count

    @staticmethod
    def _bars_since_cross(
        fast_ma: list[float | None],
        slow_ma: list[float | None],
        idx: int,
        cross_type: CrossType,
    ) -> int | None:
        for i in range(idx, 0, -1):
            f_c = fast_ma[i]
            f_p = fast_ma[i - 1]
            s_c = slow_ma[i]
            s_p = slow_ma[i - 1]
            if any(v is None for v in [f_c, f_p, s_c, s_p]):
                continue
            if cross_type == CrossType.GOLDEN and f_p <= s_p and f_c > s_c:
                return idx - i
            if cross_type == CrossType.DEATH and f_p >= s_p and f_c < s_c:
                return idx - i
        return None
