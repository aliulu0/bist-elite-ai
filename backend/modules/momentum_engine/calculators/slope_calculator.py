from __future__ import annotations

import math


class SlopeCalculator:

    @staticmethod
    def first_derivative(values: list[float | None], idx: int) -> float | None:
        if idx < 1:
            return None
        curr = values[idx]
        prev = values[idx - 1]
        if curr is None or prev is None or prev == 0:
            return None
        return (curr - prev) / abs(prev)

    @staticmethod
    def second_derivative(values: list[float | None], idx: int) -> float | None:
        if idx < 2:
            return None
        d1 = SlopeCalculator.first_derivative(values, idx)
        d0 = SlopeCalculator.first_derivative(values, idx - 1)
        if d1 is None or d0 is None:
            return None
        return d1 - d0

    @staticmethod
    def angle_degrees(slope: float | None) -> float | None:
        if slope is None:
            return None
        return math.degrees(math.atan(slope))

    @staticmethod
    def calculate(values: list[float | None], idx: int) -> dict:
        slope = SlopeCalculator.first_derivative(values, idx)
        acceleration = SlopeCalculator.second_derivative(values, idx)
        angle = SlopeCalculator.angle_degrees(slope)
        return {
            "slope": slope,
            "acceleration": acceleration,
            "angle_degrees": angle,
            "is_accelerating": acceleration is not None and acceleration > 0,
        }

    @staticmethod
    def calculate_all(values: list[float | None]) -> list[dict]:
        return [SlopeCalculator.calculate(values, i) for i in range(len(values))]
