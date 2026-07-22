from __future__ import annotations

import time

from modules.explainability_engine.core.types import (
    EvidenceObject, ExplainabilityScore, ExplanationCategory, ExplanationLevel,
    ExplanationResult, ExplanationSection, ExplanationType, Language,
    RiskSummary, SeverityLevel, SignalDirection, SourceEngine,
)
from modules.explainability_engine.evidence_mapper.mapper import EvidenceMapper
from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer
from modules.explainability_engine.builders.fundamental_builder import FundamentalExplanationBuilder
from modules.explainability_engine.builders.technical_builder import TechnicalExplanationBuilder
from modules.explainability_engine.builders.volume_builder import VolumeExplanationBuilder
from modules.explainability_engine.builders.pattern_builder import PatternExplanationBuilder
from modules.explainability_engine.builders.smart_money_builder import SmartMoneyExplanationBuilder
from modules.explainability_engine.builders.opportunity_builder import OpportunityExplanationBuilder
from modules.explainability_engine.builders.risk_builder import RiskExplanationBuilder
from modules.explainability_engine.builders.similarity_builder import SimilarityExplanationBuilder
from modules.explainability_engine.builders.conflict_builder import ConflictExplanationBuilder


class ExplanationBuilder:

    def __init__(self) -> None:
        self._mapper = EvidenceMapper()
        self._normalizer = EvidenceNormalizer()
        self._builders = {
            ExplanationType.FUNDAMENTAL: FundamentalExplanationBuilder(),
            ExplanationType.TECHNICAL: TechnicalExplanationBuilder(),
            ExplanationType.VOLUME: VolumeExplanationBuilder(),
            ExplanationType.PATTERN: PatternExplanationBuilder(),
            ExplanationType.SMART_MONEY: SmartMoneyExplanationBuilder(),
            ExplanationType.OPPORTUNITY: OpportunityExplanationBuilder(),
            ExplanationType.RISK: RiskExplanationBuilder(),
            ExplanationType.HISTORICAL_SIMILARITY: SimilarityExplanationBuilder(),
        }
        self._conflict_builder = ConflictExplanationBuilder()

    @property
    def available_types(self) -> list[ExplanationType]:
        return list(self._builders.keys())

    def build(
        self,
        symbol: str,
        metrics: dict,
        explanation_type: ExplanationType,
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH,
        stage_results: list | None = None,
        **kwargs,
    ) -> ExplanationResult:
        start = time.perf_counter()

        evidence = self._mapper.map_metrics_to_evidence(metrics, symbol=symbol)
        if stage_results:
            stage_evidence = self._mapper.map_stage_results(stage_results, symbol=symbol)
            evidence = self._mapper.merge_evidence(evidence, stage_evidence)

        builder = self._builders.get(explanation_type)
        if builder is None:
            return ExplanationResult(
                symbol=symbol, explanation_type=explanation_type,
                level=level, language=language,
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            )

        if not builder.validate_input(symbol, metrics, evidence):
            pass

        result = builder.build(
            symbol, metrics, evidence,
            level=level, language=language, **kwargs,
        )

        conflict_result = self._conflict_builder.build(
            symbol, metrics, evidence,
            level=level, language=language, **kwargs,
        )
        result.conflicts = conflict_result.conflicts

        if result.risks is None:
            result.risks = []

        result.scores = self._normalizer.compute_explainability_scores(evidence)
        result.evidence_count = len(evidence)
        result.evidence_quality_avg = (
            sum(e.confidence for e in evidence) / max(1, len(evidence))
        )

        elapsed = (time.perf_counter() - start) * 1000
        result.generation_time_ms = elapsed
        return result

    def build_comprehensive(
        self,
        symbol: str,
        metrics: dict,
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH,
        stage_results: list | None = None,
        explanation_types: list[ExplanationType] | None = None,
        **kwargs,
    ) -> ExplanationResult:
        start = time.perf_counter()

        evidence = self._mapper.map_metrics_to_evidence(metrics, symbol=symbol)
        if stage_results:
            stage_evidence = self._mapper.map_stage_results(stage_results, symbol=symbol)
            evidence = self._mapper.merge_evidence(evidence, stage_evidence)

        all_sections = []
        all_risks = []
        all_conflicts = []
        all_evidence_count = 0

        types_to_build = explanation_types or self.available_types
        for etype in types_to_build:
            builder = self._builders.get(etype)
            if builder is None:
                continue
            partial = builder.build(
                symbol, metrics, evidence,
                level=level, language=language, **kwargs,
            )
            all_sections.extend(partial.sections)
            all_risks.extend(partial.risks)
            all_evidence_count += partial.evidence_count

        conflict_result = self._conflict_builder.build(
            symbol, metrics, evidence,
            level=level, language=language, **kwargs,
        )
        all_conflicts = conflict_result.conflicts

        exec_summary = self._build_executive_summary(
            symbol, metrics, evidence, all_risks, all_conflicts, language,
        )

        final_conclusion = self._build_final_conclusion(
            symbol, metrics, evidence, all_risks, all_conflicts, language,
        )

        all_sections.insert(0, ExplanationSection(
            title="Executive Summary" if language == Language.ENGLISH else "Yönetici Özeti",
            content=exec_summary,
            category=ExplanationCategory.EXECUTIVE_SUMMARY,
        ))
        all_sections.append(ExplanationSection(
            title="Final Conclusion" if language == Language.ENGLISH else "Sonuç",
            content=final_conclusion,
            category=ExplanationCategory.FINAL_CONCLUSION,
        ))

        elapsed = (time.perf_counter() - start) * 1000
        return ExplanationResult(
            symbol=symbol,
            explanation_type=ExplanationType.ELITE_SCORE,
            level=level, language=language,
            sections=all_sections,
            conflicts=all_conflicts,
            risks=all_risks,
            scores=self._normalizer.compute_explainability_scores(evidence),
            evidence_count=len(evidence),
            evidence_quality_avg=sum(e.confidence for e in evidence) / max(1, len(evidence)),
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            generation_time_ms=elapsed,
        )

    def _build_executive_summary(self, symbol, metrics, evidence, risks, conflicts, lang) -> str:
        pos = [e for e in evidence if e.direction == SignalDirection.POSITIVE]
        neg = [e for e in evidence if e.direction == SignalDirection.NEGATIVE]
        opp_score = metrics.get("opportunity_score", 0)

        parts = [f"Analysis of {symbol}:" if lang == Language.ENGLISH else f"{symbol} Analizi:"]
        parts.append(f"{len(pos)} positive signals, {len(neg)} negative signals detected." if lang == Language.ENGLISH else f"{len(pos)} olumlu sinyal, {len(neg)} olumsuz sinyal tespit edildi.")
        if opp_score > 0:
            parts.append(f"Opportunity score: {opp_score:.1f}/100." if lang == Language.ENGLISH else f"Fırsat puanı: {opp_score:.1f}/100.")
        critical_risks = [r for r in risks if r.severity in (SeverityLevel.CRITICAL, SeverityLevel.HIGH)]
        if critical_risks:
            parts.append(f"{len(critical_risks)} high-priority risk(s) identified." if lang == Language.ENGLISH else f"{len(critical_risks)} yüksek öncelikli risk belirlendi.")
        if conflicts:
            parts.append(f"{len(conflicts)} indicator conflict(s) detected." if lang == Language.ENGLISH else f"{len(conflicts)} gösterge çelişkisi tespit edildi.")
        return " ".join(parts)

    def _build_final_conclusion(self, symbol, metrics, evidence, risks, conflicts, lang) -> str:
        pos = [e for e in evidence if e.direction == SignalDirection.POSITIVE]
        neg = [e for e in evidence if e.direction == SignalDirection.NEGATIVE]
        pos_score = sum(e.confidence for e in pos)
        neg_score = sum(e.confidence for e in neg)
        total = pos_score + neg_score

        if total == 0:
            return "Insufficient data for a conclusive assessment" if lang == Language.ENGLISH else "Kesin bir değerlendirme için yetersiz veri"

        ratio = pos_score / total
        critical_risks = [r for r in risks if r.severity in (SeverityLevel.CRITICAL, SeverityLevel.HIGH)]

        if ratio > 0.7 and not critical_risks and len(conflicts) < 2:
            return f"{symbol} shows strong positive indicators with limited risk. Consider accumulation." if lang == Language.ENGLISH else f"{symbol} sınırlı riskle güçlü olumlu göstergeler gösteriyor. Birikim düşünülebilir."
        elif ratio > 0.5:
            return f"{symbol} has a moderately positive outlook. Monitor for confirmation." if lang == Language.ENGLISH else f"{symbol} orta düzey olumlu görünüme sahip. Doğrulama için izleyin."
        elif ratio > 0.3:
            return f"{symbol} shows mixed signals. Exercise caution and await clarity." if lang == Language.ENGLISH else f"{symbol} karışık sinyaller gösteriyor. Dikkatli olun ve netleşmesini bekleyin."
        else:
            return f"{symbol} shows predominantly negative indicators. Avoid or reduce exposure." if lang == Language.ENGLISH else f"{symbol} ağırlıklı olarak olumsuz göstergeler gösteriyor. Kaçının veya pozisyonu azaltın."
