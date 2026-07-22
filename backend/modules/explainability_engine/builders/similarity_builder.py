from __future__ import annotations

import time

from modules.explainability_engine.core.types import (
    EvidenceObject, ExplanationCategory, ExplanationLevel, ExplanationResult,
    ExplanationType, ExplanationSection, Language, HistoricalContext, SignalDirection,
    SourceEngine,
)
from modules.explainability_engine.core.base import BaseExplanationBuilder
from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer


class SimilarityExplanationBuilder(BaseExplanationBuilder):

    @property
    def explanation_type(self) -> ExplanationType:
        return ExplanationType.HISTORICAL_SIMILARITY

    @property
    def name(self) -> str:
        return "similarity_explanation"

    def build(
        self, symbol: str, metrics: dict, evidence: list[EvidenceObject],
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH, **kwargs,
    ) -> ExplanationResult:
        start = time.perf_counter()
        normalizer = EvidenceNormalizer()
        sections = []

        sim_score = metrics.get("similarity_score", 0.0)
        hist_success = metrics.get("historical_success_rate", 0.0)
        similar_symbols = kwargs.get("similar_symbols", [])
        historical_outcomes = kwargs.get("historical_outcomes", [])

        sections.append(ExplanationSection(
            title="Historical Similarity" if language == Language.ENGLISH else "Tarihsel Benzerlik",
            content=self._explain_similarity(sim_score, hist_success, language),
            category=ExplanationCategory.HISTORICAL_CONTEXT,
            evidence_refs=[e.reference for e in evidence if e.metric_name in ("similarity_score", "historical_success_rate")],
        ))

        if similar_symbols:
            sections.append(ExplanationSection(
                title="Most Similar Historical Situations" if language == Language.ENGLISH else "En Benzer Tarihsel Durumlar",
                content="\n".join(f"- {s}" for s in similar_symbols[:5]),
                category=ExplanationCategory.HISTORICAL_CONTEXT,
            ))

        if historical_outcomes:
            sections.append(ExplanationSection(
                title="Historical Outcomes" if language == Language.ENGLISH else "Tarihsel Sonuçlar",
                content="\n".join(f"- {o}" for o in historical_outcomes[:5]),
                category=ExplanationCategory.HISTORICAL_CONTEXT,
            ))

        sections.append(ExplanationSection(
            title="Lessons Learned" if language == Language.ENGLISH else "Çıkarılan Dersler",
            content=self._explain_lessons(sim_score, hist_success, language),
            category=ExplanationCategory.KEY_REASONS,
        ))

        sim_ev = [e for e in evidence if e.source_engine == SourceEngine.SIMILARITY]
        elapsed = (time.perf_counter() - start) * 1000
        return ExplanationResult(
            symbol=symbol, explanation_type=ExplanationType.HISTORICAL_SIMILARITY,
            level=level, language=language, sections=sections,
            historical_context=HistoricalContext(
                similar_situations=similar_symbols,
                historical_outcomes=historical_outcomes,
                similarity_score=sim_score,
                success_rate=hist_success,
            ),
            evidence_count=len(sim_ev),
            evidence_quality_avg=sum(e.confidence for e in sim_ev) / max(1, len(sim_ev)),
            scores=normalizer.compute_explainability_scores(sim_ev),
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"), generation_time_ms=elapsed,
        )

    def _explain_similarity(self, sim_score, hist_success, lang) -> str:
        parts = []
        if sim_score > 0.7:
            parts.append(f"High similarity score ({sim_score:.2f}) — strong historical match" if lang == Language.ENGLISH else f"Yüksek benzerlik puanı ({sim_score:.2f}) — güçlü tarihsel eşleşme")
        elif sim_score > 0.4:
            parts.append(f"Moderate similarity ({sim_score:.2f})" if lang == Language.ENGLISH else f"Orta düzey benzerlik ({sim_score:.2f})")
        else:
            parts.append(f"Low similarity ({sim_score:.2f}) — limited historical reference" if lang == Language.ENGLISH else f"Düşük benzerlik ({sim_score:.2f}) — sınırlı tarihsel referans")
        if hist_success > 0.6:
            parts.append(f"Historical success rate ({hist_success:.0%}) supports positive outlook" if lang == Language.ENGLISH else f"Tarihsel başarı oranı ({hist_success:.0%}) olumlu görünümü destekliyor")
        elif hist_success > 0.4:
            parts.append(f"Historical success rate ({hist_success:.0%}) is mixed" if lang == Language.ENGLISH else f"Tarihsel başarı oranı ({hist_success:.0%}) karmaşık")
        elif hist_success > 0:
            parts.append(f"Low historical success rate ({hist_success:.0%}) — caution needed" if lang == Language.ENGLISH else f"Düşük tarihsel başarı oranı ({hist_success:.0%}) — dikkat gerekli")
        return ". ".join(parts) + "."

    def _explain_lessons(self, sim_score, hist_success, lang) -> str:
        if sim_score > 0.7 and hist_success > 0.6:
            return "Historical patterns suggest high probability of positive outcome" if lang == Language.ENGLISH else "Tarihsel kalıplar olumlu sonuca yüksek olasılık gösteriyor"
        elif sim_score > 0.4:
            return "Mixed historical precedent — monitor key levels closely" if lang == Language.ENGLISH else "Karmaşık tarihsel emsal — anahtar seviyeleri yakından izleyin"
        else:
            return "Limited historical reference — rely more on current analysis" if lang == Language.ENGLISH else "Sınırlı tarihsel referans — güncel analize daha fazla güvenin"
