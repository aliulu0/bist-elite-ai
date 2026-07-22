from __future__ import annotations

import time
from typing import Any

from modules.explainability_engine.core.types import (
    ExplanationLevel, ExplanationType, Language, ExplanationResult,
)
from modules.explainability_engine.builders.explanation_builder import ExplanationBuilder
from modules.explainability_engine.evidence_mapper.mapper import EvidenceMapper
from modules.explainability_engine.validators.validator import ExplanationValidator
from modules.explainability_engine.cache.cache import get_cache
from modules.explainability_engine.templates.explanation_templates import ExplanationTemplateEngine
from modules.explainability_engine.localization.localization import LocalizationService
from modules.explainability_engine.benchmark.benchmark import ExplanationBenchmark
from modules.explainability_engine.schemas.schemas import (
    GenerateExplanationRequest, GenerateComprehensiveRequest,
    ExplanationSummaryResponse, ExplanationDetailResponse,
    ExplanationReportResponse, ExplanationHistoryEntry, ExplanationHistoryResponse,
    ExplanationListResponse, ValidateExplanationRequest, ValidateExplanationResponse,
    CacheStatsResponse, BenchmarkResponse,
    ExplanationResultSchema, ExplanationSectionSchema, ConflictInfoSchema,
    RiskSummarySchema, ExplainabilityScoreSchema,
)


class ExplanationService:

    def __init__(self) -> None:
        self._builder = ExplanationBuilder()
        self._mapper = EvidenceMapper()
        self._validator = ExplanationValidator()
        self._cache = get_cache()
        self._templates = ExplanationTemplateEngine()
        self._localization = LocalizationService()
        self._benchmark = ExplanationBenchmark()
        self._history: list[dict] = []

    def generate(self, request: GenerateExplanationRequest) -> ExplanationDetailResponse:
        start = time.perf_counter()
        etype = self._parse_type(request.explanation_type)
        level = self._parse_level(request.level)
        lang = self._parse_lang(request.language)

        cached = self._cache.get(request.symbol, etype, level, lang)
        if cached:
            return ExplanationDetailResponse(result=self._result_to_schema(cached))

        stage_results = None
        if request.stage_results:
            stage_results = request.stage_results

        result = self._builder.build(
            request.symbol, request.metrics, etype,
            level=level, language=lang, stage_results=stage_results,
        )

        self._cache.set(request.symbol, etype, level, lang, result)

        self._history.append({
            "symbol": result.symbol,
            "explanation_type": result.explanation_type.value,
            "level": result.level.value,
            "evidence_count": result.evidence_count,
            "generation_time_ms": result.generation_time_ms,
            "timestamp": result.timestamp,
        })

        return ExplanationDetailResponse(result=self._result_to_schema(result))

    def generate_comprehensive(
        self, request: GenerateComprehensiveRequest,
    ) -> ExplanationDetailResponse:
        etypes = None
        if request.explanation_types:
            etypes = [self._parse_type(t) for t in request.explanation_types]

        level = self._parse_level(request.level)
        lang = self._parse_lang(request.language)

        result = self._builder.build_comprehensive(
            request.symbol, request.metrics,
            level=level, language=lang,
            stage_results=request.stage_results or None,
            explanation_types=etypes,
        )

        self._history.append({
            "symbol": result.symbol,
            "explanation_type": result.explanation_type.value,
            "level": result.level.value,
            "evidence_count": result.evidence_count,
            "generation_time_ms": result.generation_time_ms,
            "timestamp": result.timestamp,
        })

        return ExplanationDetailResponse(result=self._result_to_schema(result))

    def get_summary(
        self, symbol: str, metrics: dict, explanation_type: str = "elite_score",
    ) -> ExplanationSummaryResponse:
        etype = self._parse_type(explanation_type)
        evidence = self._mapper.map_metrics_to_evidence(metrics, symbol=symbol)
        from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer
        normalizer = EvidenceNormalizer()
        scores = normalizer.compute_explainability_scores(evidence)

        return ExplanationSummaryResponse(
            symbol=symbol,
            explanation_type=etype.value,
            level=ExplanationLevel.SUMMARY.value,
            language=Language.ENGLISH.value,
            section_count=0,
            evidence_count=len(evidence),
            conflict_count=0,
            risk_count=0,
            scores=ExplainabilityScoreSchema(
                explainability=scores.explainability,
                coverage=scores.coverage,
                transparency=scores.transparency,
                evidence_quality=scores.evidence_quality,
                overall=scores.overall,
            ),
        )

    def get_history(self, limit: int = 100) -> ExplanationHistoryResponse:
        entries = self._history[-limit:]
        return ExplanationHistoryResponse(
            history=[ExplanationHistoryEntry(**e) for e in entries],
            total=len(entries),
        )

    def validate(self, request: ValidateExplanationRequest) -> ValidateExplanationResponse:
        etype = self._parse_type(request.explanation_type)
        errors = self._validator.validate_comprehensive_input(request.symbol, request.metrics, etype)
        evidence = self._mapper.map_metrics_to_evidence(request.metrics, request.symbol)
        return ValidateExplanationResponse(
            valid=len(errors) == 0,
            errors=errors,
            evidence_count=len(evidence),
            message="Valid" if not errors else "; ".join(errors),
        )

    def cache_stats(self) -> CacheStatsResponse:
        return CacheStatsResponse(**self._cache.stats())

    def clear_cache(self) -> int:
        count = self._cache.size
        self._cache.clear()
        return count

    def run_benchmark(self, iterations: int = 100) -> BenchmarkResponse:
        def fn():
            self._builder.build("TEST", {"close": 50.0, "rsi": 45.0}, ExplanationType.FUNDAMENTAL)
        result = self._benchmark.run(fn, iterations=iterations)
        return BenchmarkResponse(
            iterations=result.iterations,
            avg_ms=result.avg_ms,
            ops_per_second=result.ops_per_second,
            total_seconds=result.total_seconds,
            summary=self._benchmark.get_summary(),
        )

    def get_templates(self) -> list[dict]:
        return self._templates.list_templates()

    def get_localization_keys(self, language: str = "en") -> list[str]:
        lang = self._parse_lang(language)
        return self._localization.get_all_keys(lang)

    def _result_to_schema(self, r: ExplanationResult) -> ExplanationResultSchema:
        return ExplanationResultSchema(
            symbol=r.symbol,
            explanation_type=r.explanation_type.value,
            level=r.level.value,
            language=r.language.value,
            sections=[
                ExplanationSectionSchema(
                    title=s.title, content=s.content, category=s.category.value,
                    evidence_refs=s.evidence_refs, strength=s.strength, confidence=s.confidence,
                ) for s in r.sections
            ],
            conflicts=[
                ConflictInfoSchema(
                    conflict_type=c.conflict_type.value, description=c.description,
                    involved_indicators=c.involved_indicators, severity=c.severity.value,
                    recommendation=c.recommendation,
                ) for c in r.conflicts
            ],
            risks=[
                RiskSummarySchema(
                    description=ri.description, risk_type=ri.risk_type,
                    severity=ri.severity.value, probability=ri.probability,
                    impact=ri.impact, mitigation=ri.mitigation,
                ) for ri in r.risks
            ],
            scores=ExplainabilityScoreSchema(
                explainability=r.scores.explainability, coverage=r.scores.coverage,
                transparency=r.scores.transparency,
                evidence_quality=r.scores.evidence_quality,
                overall=r.scores.overall,
            ),
            evidence_count=r.evidence_count,
            evidence_quality_avg=r.evidence_quality_avg,
            timestamp=r.timestamp,
            generation_time_ms=r.generation_time_ms,
        )

    def _parse_type(self, value: str) -> ExplanationType:
        try:
            return ExplanationType(value)
        except ValueError:
            return ExplanationType.ELITE_SCORE

    def _parse_level(self, value: str) -> ExplanationLevel:
        try:
            return ExplanationLevel(value)
        except ValueError:
            return ExplanationLevel.DETAILED

    def _parse_lang(self, value: str) -> Language:
        try:
            return Language(value)
        except ValueError:
            return Language.ENGLISH
