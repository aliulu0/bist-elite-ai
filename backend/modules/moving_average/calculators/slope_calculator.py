from __future__ import annotations

import math
from modules.moving_average.core.types import SlopeResult


class SlopeCalculator:

    @staticmethod
    def _first_derivative(values: list[float | None], idx: int) -> float | None:
        if idx < 1:
            return None
        curr = values[idx]
        prev = values[idx - 1]
        if curr is None or prev is None or prev == 0:
            return None
        return (curr - prev) / abs(prev)

    @staticmethod
    def _second_derivative(values: list[float | None], idx: int) -> float | None:
        if idx < 2:
            return None
        d1 = SlopeCalculator._first_derivative(values, idx)
        d0 = SlopeCalculator._first_derivative(values, idx - 1)
        if d1 is None or d0 is None:
            return None
        return d1 - d0

    def calculate(self, values: list[float | None], idx: int) -> SlopeResult:
        slope = self._first_derivative(values, idx)
        prev_slope = self._first_derivative(values, idx - 1)
        acceleration = self._second_derivative(values, idx)

        angle = None
        if slope is not None:
            angle = math.degrees(math.atan(slope))

        is_accelerating = False
        if acceleration is not None:
            is_accelerating = acceleration > 0

        return SlopeResult(
            slope=slope,
            angle_degrees=angle,
            acceleration=acceleration,
            is_accelerating=is_accelerating,
        )

    def calculate_all(self, values: list[float | None]) -> list[SlopeResult]:
        return [self.calculate(values, i) for i in range(len(values))]
