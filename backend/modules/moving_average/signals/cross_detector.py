from __future__ import annotations

import math
from modules.moving_average.core.types import CrossResult, CrossType, CrossStrength


class CrossDetector:

    def detect(
        self,
        fast_ma: list[float | None],
        slow_ma: list[float | None],
        dates: list[str],
        fast_period: int,
        slow_period: int,
        lookback: int = 5,
    ) -> list[CrossResult]:
        n = min(len(fast_ma), len(slow_ma), len(dates))
        crosses: list[CrossResult] = []
        for i in range(1, n):
            f_curr = fast_ma[i]
            f_prev = fast_ma[i - 1]
            s_curr = slow_ma[i]
            s_prev = slow_ma[i - 1]
            if any(v is None for v in [f_curr, f_prev, s_curr, s_prev]):
                continue
            diff_curr = f_curr - s_curr
            diff_prev = f_prev - s_prev
            if diff_prev <= 0 < diff_curr:
                cross_type = CrossType.GOLDEN
            elif diff_prev >= 0 > diff_curr:
                cross_type = CrossType.DEATH
            else:
                continue
            strength = self._evaluate_strength(
                fast_ma, slow_ma, i, diff_curr, lookback
            )
            confirmed = self._check_confirmed(fast_ma, slow_ma, i, cross_type)
            false_cross = self._check_false_cross(fast_ma, slow_ma, i, cross_type)
            if false_cross:
                strength = CrossStrength.FALSE

            crosses.append(CrossResult(
                cross_type=cross_type,
                cross_strength=strength,
                cross_date=dates[i],
                fast_period=fast_period,
                slow_period=slow_period,
                confirmed=confirmed,
                false_cross=false_cross,
                distance_at_cross=abs(diff_curr),
            ))
        return crosses

    def detect_latest(
        self,
        fast_ma: list[float | None],
        slow_ma: list[float | None],
        dates: list[str],
        fast_period: int,
        slow_period: int,
    ) -> CrossResult | None:
        crosses = self.detect(fast_ma, slow_ma, dates, fast_period, slow_period)
        return crosses[-1] if crosses else None

    def _evaluate_strength(
        self,
        fast_ma: list[float | None],
        slow_ma: list[float | None],
        idx: int,
        diff: float,
        lookback: int,
    ) -> CrossStrength:
        avg_diff = 0.0
        count = 0
        for i in range(max(1, idx - lookback), idx):
            f = fast_ma[i]
            s = slow_ma[i]
            if f is not None and s is not None and s != 0:
                avg_diff += abs((f - s) / s)
                count += 1
        avg_diff = avg_diff / count if count > 0 else 0
        separation = abs(diff)
        if separation > avg_diff * 2:
            return CrossStrength.STRONG
        elif separation > avg_diff * 0.5:
            return CrossStrength.MODERATE
        return CrossStrength.WEAK

    def _check_confirmed(
        self,
        fast_ma: list[float | None],
        slow_ma: list[float | None],
        idx: int,
        cross_type: CrossType,
    ) -> bool:
        if idx + 1 >= len(fast_ma):
            return False
        f_next = fast_ma[idx + 1]
        s_next = slow_ma[idx + 1]
        if f_next is None or s_next is None:
            return False
        if cross_type == CrossType.GOLDEN:
            return f_next > s_next
        return f_next < s_next

    def _check_false_cross(
        self,
        fast_ma: list[float | None],
        slow_ma: list[float | None],
        idx: int,
        cross_type: CrossType,
    ) -> bool:
        required = min(3, len(fast_ma) - idx)
        if required < 2:
            return False
        reversals = 0
        for i in range(idx + 1, idx + required):
            f = fast_ma[i]
            s = slow_ma[i]
            if f is None or s is None:
                continue
            if cross_type == CrossType.GOLDEN and f < s:
                reversals += 1
            elif cross_type == CrossType.DEATH and f > s:
                reversals += 1
        return reversals >= 2
