from __future__ import annotations

from modules.moving_average.core.types import TrendResult, TrendDirection


class TrendAnalyzer:

    def analyze(
        self,
        ma_values: list[float | None],
        closes: list[float],
        period: int,
        lookback: int = 20,
    ) -> TrendResult:
        n = len(ma_values)
        valid_ma = [(i, v) for i, v in enumerate(ma_values) if v is not None]
        if len(valid_ma) < 5:
            return TrendResult(
                direction=TrendDirection.SIDEWAYS,
                strength=0.0,
                age=0,
                stability=0.0,
                ma_value=ma_values[-1] if ma_values else None,
                price_position=None,
            )

        current_ma = valid_ma[-1][1]
        recent = [v for _, v in valid_ma[-lookback:]]

        ma_slope = self._avg_slope(recent)

        direction = self._determine_direction(ma_slope, recent)
        strength = self._calculate_strength(ma_slope, recent, closes[-1] if closes else 0, current_ma)
        age = self._calculate_age(ma_values, direction)
        stability = self._calculate_stability(recent)

        price_pos = None
        if closes:
            price = closes[-1]
            if current_ma:
                pct = (price - current_ma) / abs(current_ma) if current_ma != 0 else 0
                if pct > 0.02:
                    price_pos = "above"
                elif pct < -0.02:
                    price_pos = "below"
                else:
                    price_pos = "at"

        return TrendResult(
            direction=direction,
            strength=round(strength, 4),
            age=age,
            stability=round(stability, 4),
            ma_value=current_ma,
            price_position=price_pos,
        )

    @staticmethod
    def _avg_slope(values: list[float]) -> float:
        if len(values) < 2:
            return 0.0
        total = 0.0
        for i in range(1, len(values)):
            if values[i - 1] != 0:
                total += (values[i] - values[i - 1]) / abs(values[i - 1])
        return total / (len(values) - 1)

    @staticmethod
    def _determine_direction(slope: float, recent: list[float]) -> TrendDirection:
        if not recent:
            return TrendDirection.SIDEWAYS
        if slope > 0.0005:
            return TrendDirection.UPTREND
        elif slope < -0.0005:
            return TrendDirection.DOWNTREND
        return TrendDirection.SIDEWAYS

    @staticmethod
    def _calculate_strength(
        slope: float, recent: list[float], price: float, ma_value: float
    ) -> float:
        slope_score = min(1.0, abs(slope) * 200)
        if ma_value != 0:
            price_dist = abs(price - ma_value) / abs(ma_value)
            dist_score = min(1.0, price_dist * 20)
        else:
            dist_score = 0.0
        if len(recent) >= 2:
            direction_changes = 0
            for i in range(2, len(recent)):
                if (recent[i] - recent[i - 1]) * (recent[i - 1] - recent[i - 2]) < 0:
                    direction_changes += 1
            consistency = 1.0 - (direction_changes / max(len(recent) - 2, 1))
        else:
            consistency = 0.5
        return slope_score * 0.4 + dist_score * 0.3 + consistency * 0.3

    @staticmethod
    def _calculate_age(ma_values: list[float | None], direction: TrendDirection) -> int:
        count = 0
        for i in range(len(ma_values) - 1, 0, -1):
            curr = ma_values[i]
            prev = ma_values[i - 1]
            if curr is None or prev is None:
                break
            if direction == TrendDirection.UPTREND and curr > prev:
                count += 1
            elif direction == TrendDirection.DOWNTREND and curr < prev:
                count += 1
            else:
                break
        return count

    @staticmethod
    def _calculate_stability(values: list[float]) -> float:
        if len(values) < 3:
            return 1.0
        slopes = []
        for i in range(1, len(values)):
            if values[i - 1] != 0:
                slopes.append((values[i] - values[i - 1]) / abs(values[i - 1]))
        if not slopes:
            return 1.0
        mean_s = sum(slopes) / len(slopes)
        variance = sum((s - mean_s) ** 2 for s in slopes) / len(slopes)
        stability = max(0.0, 1.0 - variance * 10000)
        return stability
