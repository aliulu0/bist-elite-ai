from __future__ import annotations

import time

from modules.early_opportunity_engine.core.types import (
    AnalysisCategory,
    AnalysisSignal,
    StageResult,
)
from modules.early_opportunity_engine.core.base import BaseAnalysisStage


class VolumeAnalysisStage(BaseAnalysisStage):

    @property
    def name(self) -> str:
        return "volume_analysis"

    @property
    def category(self) -> AnalysisCategory:
        return AnalysisCategory.VOLUME

    def analyze(
        self,
        symbol: str,
        metrics: dict,
        **kwargs,
    ) -> StageResult:
        start = time.perf_counter()
        signals: list[AnalysisSignal] = []
        warnings: list[str] = []

        vr = metrics.get("volume_ratio")
        if vr is not None:
            if vr > 2.0:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="volume_spike",
                    strength=min(1.0, (vr - 1) / 3),
                    confidence=0.8,
                    description=f"Volume spike: {vr:.1f}x average",
                    weight=1.5,
                ))
            elif vr > 1.5:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="above_average_volume",
                    strength=min(1.0, (vr - 1) / 2),
                    confidence=0.65,
                    description=f"Above average volume: {vr:.1f}x",
                    weight=1.0,
                ))
            elif vr < 0.5:
                warnings.append(f"Low volume: {vr:.1f}x average")

        rv = metrics.get("relative_volume")
        if rv is not None and rv > 1.5:
            signals.append(AnalysisSignal(
                category=self.category,
                name="high_relative_volume",
                strength=min(1.0, (rv - 1) / 2),
                confidence=0.7,
                description=f"High relative volume: {rv:.1f}x",
                weight=1.2,
            ))

        obv = metrics.get("obv_trend")
        if obv is not None:
            if obv > 0:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="obv_bullish",
                    strength=min(1.0, abs(obv) / 2),
                    confidence=0.65,
                    description="OBV trending upward (accumulation)",
                    weight=1.0,
                ))
            elif obv < -1:
                warnings.append("OBV trending downward (distribution)")

        cmf = metrics.get("cmf")
        if cmf is not None:
            if cmf > 0.1:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="strong_accumulation",
                    strength=min(1.0, cmf * 5),
                    confidence=0.75,
                    description=f"Strong accumulation: CMF {cmf:.3f}",
                    weight=1.3,
                ))
            elif cmf > 0.05:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="mild_accumulation",
                    strength=min(1.0, cmf * 10),
                    confidence=0.6,
                    description=f"Mild accumulation: CMF {cmf:.3f}",
                    weight=0.9,
                ))
            elif cmf < -0.1:
                warnings.append(f"Distribution detected: CMF {cmf:.3f}")

        mfi = metrics.get("mfi")
        if mfi is not None:
            if mfi < 20:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="mfi_oversold",
                    strength=min(1.0, (20 - mfi) / 20),
                    confidence=0.7,
                    description=f"MFI oversold: {mfi:.1f}",
                    weight=1.1,
                ))
            elif mfi > 80:
                warnings.append(f"MFI overbought: {mfi:.1f}")

        vwap = metrics.get("vwap")
        close = metrics.get("close")
        if vwap is not None and close is not None and close > 0:
            if close > vwap:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="above_vwap",
                    strength=min(1.0, (close - vwap) / close * 10),
                    confidence=0.6,
                    description=f"Price above VWAP",
                    weight=0.8,
                ))

        nvi = metrics.get("nvi_trend")
        if nvi is not None and nvi > 0:
            signals.append(AnalysisSignal(
                category=self.category,
                name="smart_money_accumulation",
                strength=min(1.0, abs(nvi) / 2),
                confidence=0.65,
                description="NVI rising (smart money accumulation)",
                weight=1.0,
            ))

        score = self._compute_score(signals)
        elapsed = (time.perf_counter() - start) * 1000

        return StageResult(
            category=self.category,
            score=score,
            signals=signals,
            warnings=warnings,
            details=f"Volume analysis: {len(signals)} signals, {len(warnings)} warnings",
            calculation_time_ms=elapsed,
        )

    def validate(self, metrics: dict) -> list[str]:
        warnings = []
        vol_keys = ["volume_ratio", "relative_volume", "obv_trend", "cmf", "mfi"]
        found = sum(1 for k in vol_keys if k in metrics)
        if found == 0:
            warnings.append("No volume metrics provided")
        return warnings

    def _compute_score(self, signals: list[AnalysisSignal]) -> float:
        if not signals:
            return 0.0
        total_weight = sum(s.weight for s in signals)
        if total_weight == 0:
            return 0.0
        weighted = sum(s.strength * s.confidence * s.weight for s in signals)
        return min(1.0, weighted / total_weight)
