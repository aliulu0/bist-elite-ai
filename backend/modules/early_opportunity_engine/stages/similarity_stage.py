from __future__ import annotations

import time

from modules.early_opportunity_engine.core.types import (
    AnalysisCategory,
    AnalysisSignal,
    SimilarityAnalysis,
    StageResult,
)
from modules.early_opportunity_engine.core.base import BaseAnalysisStage


class SimilarityAnalysisStage(BaseAnalysisStage):

    @property
    def name(self) -> str:
        return "similarity_analysis"

    @property
    def category(self) -> AnalysisCategory:
        return AnalysisCategory.SIMILARITY

    def analyze(
        self,
        symbol: str,
        metrics: dict,
        **kwargs,
    ) -> StageResult:
        start = time.perf_counter()
        signals: list[AnalysisSignal] = []
        warnings: list[str] = []

        sim_score = metrics.get("similarity_score")
        sim_symbols = metrics.get("similar_symbols", [])
        success_rate = metrics.get("historical_success_rate", 0)
        timeline = metrics.get("similarity_timeline", "")

        if sim_score is not None and sim_score > 0.5:
            signals.append(AnalysisSignal(
                category=self.category,
                name="historical_match",
                strength=sim_score,
                confidence=0.65,
                description=f"Historical similarity: {sim_score:.2f}",
                weight=1.2,
                metadata={
                    "similar_symbols": sim_symbols,
                    "success_rate": success_rate,
                    "timeline": timeline,
                },
            ))

        if success_rate > 0.6:
            signals.append(AnalysisSignal(
                category=self.category,
                name="high_success_rate",
                strength=success_rate,
                confidence=0.7,
                description=f"High historical success rate: {success_rate:.0%}",
                weight=1.0,
            ))
        elif success_rate > 0 and success_rate < 0.3:
            warnings.append(f"Low historical success rate: {success_rate:.0%}")

        pe = metrics.get("pe_ratio")
        pb = metrics.get("pb_ratio")
        roe = metrics.get("roe")
        if pe and pb and roe:
            if pe < 12 and pb < 1.5 and roe > 15:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="value_similarity",
                    strength=0.7,
                    confidence=0.6,
                    description="Matches historical value leader profile",
                    weight=1.0,
                ))

        eg = metrics.get("earnings_growth")
        rv = metrics.get("relative_volume")
        if eg and rv:
            if eg > 20 and rv > 1.5:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="growth_momentum_match",
                    strength=0.75,
                    confidence=0.65,
                    description="Matches growth-momentum leader profile",
                    weight=1.1,
                ))

        score = self._compute_score(signals)
        elapsed = (time.perf_counter() - start) * 1000

        analysis = SimilarityAnalysis(
            score=score,
            similar_symbols=sim_symbols,
            historical_success_rate=success_rate,
            timeline_match=timeline,
            details=f"Similarity analysis: {len(signals)} signals",
        )

        result = StageResult(
            category=self.category,
            score=score,
            signals=signals,
            warnings=warnings,
            details=f"Similarity analysis: {len(signals)} signals, {len(warnings)} warnings",
            calculation_time_ms=elapsed,
        )
        return result

    def validate(self, metrics: dict) -> list[str]:
        return []

    def _compute_score(self, signals: list[AnalysisSignal]) -> float:
        if not signals:
            return 0.0
        total_weight = sum(s.weight for s in signals)
        if total_weight == 0:
            return 0.0
        weighted = sum(s.strength * s.confidence * s.weight for s in signals)
        return min(1.0, weighted / total_weight)
