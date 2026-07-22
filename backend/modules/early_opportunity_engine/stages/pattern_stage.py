from __future__ import annotations

import time

from modules.early_opportunity_engine.core.types import (
    AnalysisCategory,
    AnalysisSignal,
    StageResult,
)
from modules.early_opportunity_engine.core.base import BaseAnalysisStage


class PatternAnalysisStage(BaseAnalysisStage):

    @property
    def name(self) -> str:
        return "pattern_analysis"

    @property
    def category(self) -> AnalysisCategory:
        return AnalysisCategory.PATTERN

    def analyze(
        self,
        symbol: str,
        metrics: dict,
        **kwargs,
    ) -> StageResult:
        start = time.perf_counter()
        signals: list[AnalysisSignal] = []
        warnings: list[str] = []

        classical = metrics.get("classical_pattern_score", 0)
        if classical > 0.5:
            signals.append(AnalysisSignal(
                category=self.category,
                name="classical_pattern",
                strength=classical,
                confidence=0.7,
                description=f"Classical pattern detected (score: {classical:.2f})",
                weight=1.3,
            ))

        bull_candle = metrics.get("candlestick_bullish_score", 0)
        if bull_candle > 0.5:
            signals.append(AnalysisSignal(
                category=self.category,
                name="bullish_candlestick",
                strength=bull_candle,
                confidence=0.65,
                description=f"Bullish candlestick pattern (score: {bull_candle:.2f})",
                weight=1.0,
            ))

        bear_candle = metrics.get("candlestick_bearish_score", 0)
        if bear_candle > 0.6:
            warnings.append(f"Bearish candlestick pattern (score: {bear_candle:.2f})")

        if metrics.get("double_bottom"):
            signals.append(AnalysisSignal(
                category=self.category,
                name="double_bottom",
                strength=0.85,
                confidence=0.8,
                description="Double bottom pattern",
                weight=1.5,
            ))

        if metrics.get("cup_handle"):
            signals.append(AnalysisSignal(
                category=self.category,
                name="cup_handle",
                strength=0.85,
                confidence=0.8,
                description="Cup and handle pattern",
                weight=1.5,
            ))

        if metrics.get("bull_flag"):
            signals.append(AnalysisSignal(
                category=self.category,
                name="bull_flag",
                strength=0.8,
                confidence=0.75,
                description="Bull flag pattern",
                weight=1.3,
            ))

        if metrics.get("ascending_triangle"):
            signals.append(AnalysisSignal(
                category=self.category,
                name="ascending_triangle",
                strength=0.8,
                confidence=0.75,
                description="Ascending triangle pattern",
                weight=1.3,
            ))

        if metrics.get("hammer"):
            signals.append(AnalysisSignal(
                category=self.category,
                name="hammer",
                strength=0.7,
                confidence=0.65,
                description="Hammer candlestick",
                weight=1.0,
            ))

        if metrics.get("bullish_engulfing"):
            signals.append(AnalysisSignal(
                category=self.category,
                name="bullish_engulfing",
                strength=0.75,
                confidence=0.7,
                description="Bullish engulfing pattern",
                weight=1.1,
            ))

        if metrics.get("morning_star"):
            signals.append(AnalysisSignal(
                category=self.category,
                name="morning_star",
                strength=0.85,
                confidence=0.8,
                description="Morning star pattern",
                weight=1.5,
            ))

        if metrics.get("double_top"):
            warnings.append("Double top pattern detected (bearish)")

        score = self._compute_score(signals)
        elapsed = (time.perf_counter() - start) * 1000

        return StageResult(
            category=self.category,
            score=score,
            signals=signals,
            warnings=warnings,
            details=f"Pattern analysis: {len(signals)} signals, {len(warnings)} warnings",
            calculation_time_ms=elapsed,
        )

    def validate(self, metrics: dict) -> list[str]:
        warnings = []
        pattern_keys = [
            "classical_pattern_score", "candlestick_bullish_score",
            "double_bottom", "cup_handle", "bull_flag",
        ]
        found = sum(1 for k in pattern_keys if k in metrics)
        if found == 0:
            warnings.append("No pattern metrics provided")
        return warnings

    def _compute_score(self, signals: list[AnalysisSignal]) -> float:
        if not signals:
            return 0.0
        total_weight = sum(s.weight for s in signals)
        if total_weight == 0:
            return 0.0
        weighted = sum(s.strength * s.confidence * s.weight for s in signals)
        return min(1.0, weighted / total_weight)
