from __future__ import annotations

import math
from modules.moving_average.core.types import DistanceResult


class ProximityEngine:

    def estimate_crossover(
        self,
        fast_ma: list[float | None],
        slow_ma: list[float | None],
        max_bars: int = 100,
    ) -> dict:
        n = min(len(fast_ma), len(slow_ma))
        if n < 3:
            return {"estimated_bars": None, "probability": None}

        recent_f = [v for v in fast_ma[-5:] if v is not None]
        recent_s = [v for v in slow_ma[-5:] if v is not None]
        if len(recent_f) < 2 or len(recent_s) < 2:
            return {"estimated_bars": None, "probability": None}

        f_slope = (recent_f[-1] - recent_f[0]) / max(len(recent_f) - 1, 1)
        s_slope = (recent_s[-1] - recent_s[0]) / max(len(recent_s) - 1, 1)

        f_curr = fast_ma[-1]
        s_curr = slow_ma[-1]
        if f_curr is None or s_curr is None:
            return {"estimated_bars": None, "probability": None}

        gap = s_curr - f_curr
        slope_diff = f_slope - s_slope

        if slope_diff == 0:
            return {"estimated_bars": None, "probability": self._calc_probability(gap, 0, slope_diff)}

        if gap > 0 and slope_diff <= 0:
            return {"estimated_bars": None, "probability": self._calc_probability(gap, 0, slope_diff)}
        if gap < 0 and slope_diff >= 0:
            return {"estimated_bars": None, "probability": self._calc_probability(gap, 0, slope_diff)}

        bars = abs(gap / slope_diff) if slope_diff != 0 else None
        if bars is not None:
            bars = min(int(math.ceil(bars)), max_bars)

        probability = self._calc_probability(gap, bars, slope_diff)

        return {
            "estimated_bars": bars,
            "probability": probability,
        }

    @staticmethod
    def _calc_probability(
        gap: float, bars: float | None, slope_diff: float
    ) -> float:
        gap_score = max(0, 1.0 - abs(gap) / (abs(gap) + 1.0))
        slope_score = min(1.0, abs(slope_diff) * 100) if slope_diff != 0 else 0
        bars_score = 1.0
        if bars is not None:
            bars_score = max(0, 1.0 - bars / 50)
        probability = (gap_score * 0.3 + slope_score * 0.4 + bars_score * 0.3)
        return round(max(0.0, min(1.0, probability)), 4)
