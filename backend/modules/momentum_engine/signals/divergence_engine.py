from __future__ import annotations

from modules.momentum_engine.core.types import Divergence, DivergenceType
from modules.momentum_engine.calculators.divergence_calculator import DivergenceCalculator


class DivergenceEngine:

    def __init__(self) -> None:
        self._calculator = DivergenceCalculator()

    def detect(
        self,
        indicator: list[float | None],
        prices: list[float],
    ) -> list[Divergence]:
        all_divs: list[Divergence] = []
        all_divs.extend(
            self._calculator.detect_regular_bullish(indicator, prices)
        )
        all_divs.extend(
            self._calculator.detect_regular_bearish(indicator, prices)
        )
        all_divs.extend(
            self._calculator.detect_hidden_bullish(indicator, prices)
        )
        all_divs.extend(
            self._calculator.detect_hidden_bearish(indicator, prices)
        )
        return all_divs

    def detect_latest(
        self,
        indicator: list[float | None],
        prices: list[float],
    ) -> Divergence | None:
        divs = self.detect(indicator, prices)
        return divs[-1] if divs else None
