from __future__ import annotations

import time

from modules.explainability_engine.core.types import (
    EvidenceObject, ExplanationCategory, ExplanationLevel, ExplanationResult,
    ExplanationType, ExplanationSection, Language, SignalDirection, SourceEngine,
)
from modules.explainability_engine.core.base import BaseExplanationBuilder
from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer


class OpportunityExplanationBuilder(BaseExplanationBuilder):

    @property
    def explanation_type(self) -> ExplanationType:
        return ExplanationType.OPPORTUNITY

    @property
    def name(self) -> str:
        return "opportunity_explanation"

    def build(
        self, symbol: str, metrics: dict, evidence: list[EvidenceObject],
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH, **kwargs,
    ) -> ExplanationResult:
        start = time.perf_counter()
        normalizer = EvidenceNormalizer()
        sections = []

        opp_score = metrics.get("opportunity_score", 0.0)
        opp_stage = metrics.get("opportunity_stage", "unknown")
        confidence = metrics.get("opportunity_confidence", 0.0)
        expected_ret = metrics.get("expected_return", 0.0)
        window = metrics.get("expected_window", "")

        stage_map = {
            "stage_0_ignore": ("Stage 0: No opportunity" if language == Language.ENGLISH else "Aşama 0: Fırsat yok"),
            "stage_1_silent_accumulation": ("Stage 1: Silent Accumulation" if language == Language.ENGLISH else "Aşama 1: Sessiz Birikim"),
            "stage_2_early_smart_money": ("Stage 2: Early Smart Money" if language == Language.ENGLISH else "Aşama 2: Erken Akıllı Para"),
            "stage_3_institutional_accumulation": ("Stage 3: Institutional Accumulation" if language == Language.ENGLISH else "Aşama 3: Kurumsal Birikim"),
            "stage_4_breakout_preparation": ("Stage 4: Breakout Preparation" if language == Language.ENGLISH else "Aşama 4: Kırılma Hazırlığı"),
            "stage_5_breakout": ("Stage 5: Breakout" if language == Language.ENGLISH else "Aşama 5: Kırılma"),
            "stage_6_trend_expansion": ("Stage 6: Trend Expansion" if language == Language.ENGLISH else "Aşama 6: Trend Genişlemesi"),
            "stage_7_late_opportunity": ("Stage 7: Late Opportunity" if language == Language.ENGLISH else "Aşama 7: Geç Fırsat"),
        }

        stage_desc = stage_map.get(str(opp_stage), str(opp_stage))

        sections.append(ExplanationSection(
            title="Opportunity Overview" if language == Language.ENGLISH else "Fırsat Genel Bakışı",
            content=self._explain_overview(opp_score, stage_desc, confidence, expected_ret, window, language),
            category=ExplanationCategory.EXECUTIVE_SUMMARY,
        ))

        reasons_for = []
        reasons_against = []
        if opp_score > 60:
            reasons_for.append(f"High opportunity score ({opp_score:.1f}/100)" if language == Language.ENGLISH else f"Yüksek fırsat puanı ({opp_score:.1f}/100)")
        if confidence > 70:
            reasons_for.append(f"High confidence ({confidence:.1f}%)" if language == Language.ENGLISH else f"Yüksek güven ({confidence:.1f}%)")
        if expected_ret > 15:
            reasons_for.append(f"Strong expected return ({expected_ret:.1f}%)" if language == Language.ENGLISH else f"Güçlü beklenen getiri ({expected_ret:.1f}%)")

        if opp_score < 40:
            reasons_against.append(f"Low opportunity score ({opp_score:.1f}/100)" if language == Language.ENGLISH else f"Düşük fırsat puanı ({opp_score:.1f}/100)")
        if confidence < 50:
            reasons_against.append(f"Low confidence ({confidence:.1f}%)" if language == Language.ENGLISH else f"Düşük güven ({confidence:.1f}%)")

        sections.append(ExplanationSection(
            title="Reasons For Selection" if language == Language.ENGLISH else "Seçim Nedenleri",
            content="\n".join(f"+ {r}" for r in reasons_for) or ("No strong reasons identified" if language == Language.ENGLISH else "Güçlü neden belirlenmedi"),
            category=ExplanationCategory.POSITIVE_SIGNALS,
        ))
        sections.append(ExplanationSection(
            title="Reasons Against Selection" if language == Language.ENGLISH else "Seçim Karşıtı Nedenler",
            content="\n".join(f"- {r}" for r in reasons_against) or ("No significant concerns" if language == Language.ENGLISH else "Önemli endişe yok"),
            category=ExplanationCategory.NEGATIVE_SIGNALS,
        ))

        elapsed = (time.perf_counter() - start) * 1000
        oev = [e for e in evidence if e.source_engine == SourceEngine.EARLY_OPPORTUNITY]
        return ExplanationResult(
            symbol=symbol, explanation_type=ExplanationType.OPPORTUNITY,
            level=level, language=language, sections=sections,
            evidence_count=len(oev),
            evidence_quality_avg=sum(e.confidence for e in oev) / max(1, len(oev)),
            scores=normalizer.compute_explainability_scores(oev),
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"), generation_time_ms=elapsed,
        )

    def _explain_overview(self, opp_score, stage_desc, confidence, expected_ret, window, lang) -> str:
        parts = [
            f"Opportunity Score: {opp_score:.1f}/100" if lang == Language.ENGLISH else f"Fırsat Puanı: {opp_score:.1f}/100",
            f"Stage: {stage_desc}" if lang == Language.ENGLISH else f"Aşama: {stage_desc}",
            f"Confidence: {confidence:.1f}%" if lang == Language.ENGLISH else f"Güven: {confidence:.1f}%",
        ]
        if expected_ret > 0:
            parts.append(f"Expected Return: {expected_ret:.1f}%" if lang == Language.ENGLISH else f"Beklenen Getiri: {expected_ret:.1f}%")
        if window:
            parts.append(f"Action Window: {window}" if lang == Language.ENGLISH else f"Eylem Penceresi: {window}")
        return ". ".join(parts) + "."
