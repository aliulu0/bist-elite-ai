from __future__ import annotations

import time

from modules.explainability_engine.core.types import (
    EvidenceObject, ExplanationCategory, ExplanationLevel, ExplanationResult,
    ExplanationType, ExplanationSection, Language, SignalDirection, SourceEngine,
)
from modules.explainability_engine.core.base import BaseExplanationBuilder
from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer


class PatternExplanationBuilder(BaseExplanationBuilder):

    @property
    def explanation_type(self) -> ExplanationType:
        return ExplanationType.PATTERN

    @property
    def name(self) -> str:
        return "pattern_explanation"

    def build(
        self, symbol: str, metrics: dict, evidence: list[EvidenceObject],
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH, **kwargs,
    ) -> ExplanationResult:
        start = time.perf_counter()
        normalizer = EvidenceNormalizer()
        sections = []

        classical = metrics.get("classical_pattern_score", 0.0)
        candle_bull = metrics.get("candlestick_bullish_score", 0.0)
        candle_bear = metrics.get("candlestick_bearish_score", 0.0)
        double_bottom = metrics.get("double_bottom", False)
        bull_flag = metrics.get("bull_flag", False)
        ascending_tri = metrics.get("ascending_triangle", False)
        cup_handle = metrics.get("cup_handle", False)
        hammer = metrics.get("hammer", False)
        engulfing = metrics.get("bullish_engulfing", False)
        morning_star = metrics.get("morning_star", False)
        double_top = metrics.get("double_top", False)

        detected = []
        if double_bottom: detected.append("Double Bottom" if language == Language.ENGLISH else "Çift Dip")
        if bull_flag: detected.append("Bull Flag" if language == Language.ENGLISH else "Boğa Bayrağı")
        if ascending_tri: detected.append("Ascending Triangle" if language == Language.ENGLISH else "Yükselen Üçgen")
        if cup_handle: detected.append("Cup & Handle" if language == Language.ENGLISH else "Fincan & Sap")
        if hammer: detected.append("Hammer" if language == Language.ENGLISH else "Çekiç")
        if engulfing: detected.append("Bullish Engulfing" if language == Language.ENGLISH else "Yükselen Yutan")
        if morning_star: detected.append("Morning Star" if language == Language.ENGLISH else "Sabah Yıldızı")
        if double_top: detected.append("Double Top" if language == Language.ENGLISH else "Çift Tepe")

        sections.append(ExplanationSection(
            title="Detected Patterns" if language == Language.ENGLISH else "Tespit Edilen Formasyonlar",
            content=self._explain_detected(detected, classical, candle_bull, candle_bear, language),
            category=ExplanationCategory.KEY_REASONS,
            evidence_refs=[e.reference for e in evidence if "pattern" in e.metric_name.lower() or "candlestick" in e.metric_name.lower()],
        ))

        if detected:
            bull_patterns = {"Double Bottom", "Bull Flag", "Ascending Triangle", "Cup & Handle", "Hammer", "Bullish Engulfing", "Morning Star"}
            bear_patterns = {"Double Top"}
            bull_count = sum(1 for d in detected if d in bull_patterns)
            bear_count = sum(1 for d in detected if d in bear_patterns)
            sections.append(ExplanationSection(
                title="Pattern Direction" if language == Language.ENGLISH else "Formasyon Yönü",
                content=f"{bull_count} bullish, {bear_count} bearish patterns detected" if language == Language.ENGLISH else f"{bull_count} boğa, {bear_count} ayı formasyonu tespit edildi",
                category=ExplanationCategory.SUPPORTING_EVIDENCE,
            ))

        pos_ev = [e for e in evidence if e.direction == SignalDirection.POSITIVE and e.source_engine == SourceEngine.PATTERN]
        neg_ev = [e for e in evidence if e.direction == SignalDirection.NEGATIVE and e.source_engine == SourceEngine.PATTERN]

        sections.append(ExplanationSection(
            title="Positive Signals" if language == Language.ENGLISH else "Olumlu Sinyaller",
            content="\n".join(f"+ {e.description}" for e in pos_ev[:10]) or ("None" if language == Language.ENGLISH else "Yok"),
            category=ExplanationCategory.POSITIVE_SIGNALS, evidence_refs=[e.reference for e in pos_ev],
        ))
        sections.append(ExplanationSection(
            title="Negative Signals" if language == Language.ENGLISH else "Olumsuz Sinyaller",
            content="\n".join(f"- {e.description}" for e in neg_ev[:10]) or ("None" if language == Language.ENGLISH else "Yok"),
            category=ExplanationCategory.NEGATIVE_SIGNALS, evidence_refs=[e.reference for e in neg_ev],
        ))

        elapsed = (time.perf_counter() - start) * 1000
        pev = [e for e in evidence if e.source_engine == SourceEngine.PATTERN]
        return ExplanationResult(
            symbol=symbol, explanation_type=ExplanationType.PATTERN,
            level=level, language=language, sections=sections,
            evidence_count=len(pev),
            evidence_quality_avg=sum(e.confidence for e in pev) / max(1, len(pev)),
            scores=normalizer.compute_explainability_scores(pev),
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"), generation_time_ms=elapsed,
        )

    def _explain_detected(self, detected, classical, candle_bull, candle_bear, lang) -> str:
        parts = []
        if detected:
            parts.append(f"Patterns found: {', '.join(detected)}" if lang == Language.ENGLISH else f"Bulunan formasyonlar: {', '.join(detected)}")
        if classical > 0.5:
            parts.append(f"Classical pattern score: {classical:.2f} (strong)" if lang == Language.ENGLISH else f"Klasik formasyon puanı: {classical:.2f} (güçlü)")
        if candle_bull > 0.5:
            parts.append(f"Bullish candlestick score: {candle_bull:.2f}" if lang == Language.ENGLISH else f"Boğa mum formasyonu puanı: {candle_bull:.2f}")
        if candle_bear > 0.6:
            parts.append(f"Bearish candlestick warning: {candle_bear:.2f}" if lang == Language.ENGLISH else f"Ayı mum formasyonu uyarısı: {candle_bear:.2f}")
        return ". ".join(parts) + "." if parts else "No significant patterns detected" if lang == Language.ENGLISH else "Önemli formasyon tespit edilmedi"
