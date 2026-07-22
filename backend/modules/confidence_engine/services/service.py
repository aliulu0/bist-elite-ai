from __future__ import annotations

from typing import Dict, List, Optional, Any
import datetime

from modules.confidence_engine.core.types import (
    ConfidenceDimension,
    ConfidenceResult,
    ConfidenceHistoryEntry,
    ConfidenceTrendResult,
    ConfidenceWeightConfig,
    ConfidenceProfile,
    ConfidenceCalculationRequest,
    ConfidenceLabel,
    ConfidenceTrend,
    ConfidenceWarning,
    ReportType,
    ConfidenceReport,
    classify_confidence,
)
from modules.confidence_engine.calculators.confidence_calculator import (
    ConfidenceCalculator,
    ConfidenceTrendTracker,
)
from modules.confidence_engine.profiles.profiles import get_profile_weights
from modules.confidence_engine.profiles.manager import ProfileManager
from modules.confidence_engine.validators.validator import ConfidenceValidator
from modules.confidence_engine.registry.registry import ConfidenceRegistry
from modules.confidence_engine.cache.cache import ConfidenceCache
from modules.confidence_engine.benchmark.benchmark import ConfidenceBenchmark


class ConfidenceService:
    def __init__(self) -> None:
        self._profile_manager = ProfileManager()
        self._trend_tracker = ConfidenceTrendTracker()
        self._validator = ConfidenceValidator()
        self._registry = ConfidenceRegistry()
        self._cache = ConfidenceCache()
        self._benchmark = ConfidenceBenchmark()

    def calculate(
        self,
        request: ConfidenceCalculationRequest,
    ) -> ConfidenceResult:
        cache_key = (
            f"{request.symbol}:{request.profile_name}:"
            f"{hash(frozenset(request.scores.items()) if request.scores else frozenset())}"
        )
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        config = get_profile_weights(request.profile_name)
        calculator = ConfidenceCalculator(config)

        data = dict(request.scores)
        if request.source_data:
            data.update(request.source_data)
        if request.dimension_scores:
            for k, v in request.dimension_scores.items():
                data[k] = v

        calc_result = calculator.calculate(request.symbol, data)

        confidence_score = calc_result["confidence_score"]
        confidence_label = classify_confidence(confidence_score)

        result = ConfidenceResult(
            symbol=request.symbol,
            confidence_score=confidence_score,
            confidence_label=confidence_label,
            dimension_contributions=calc_result["dimension_contributions"],
            bonuses=calc_result["bonuses"],
            penalties=calc_result["penalties"],
            warnings=calc_result["warnings"],
            raw_score=calc_result["raw_score"],
            total_weight=calc_result["total_weight"],
            source_data=request.source_data,
        )

        self._trend_tracker.record(
            symbol=request.symbol,
            confidence_score=confidence_score,
            confidence_label=confidence_label,
        )

        self._cache.set(cache_key, result)
        return result

    def calculate_list(
        self,
        symbols: List[str],
        scores_map: Dict[str, Dict[str, float]],
        profile_name: str = "standard",
    ) -> List[ConfidenceResult]:
        results: List[ConfidenceResult] = []
        for symbol in symbols:
            symbol_scores = scores_map.get(symbol, {})
            request = ConfidenceCalculationRequest(
                symbol=symbol,
                scores=symbol_scores,
                profile_name=profile_name,
            )
            results.append(self.calculate(request))
        return results

    def get_details(self, symbol: str) -> Optional[Dict[str, Any]]:
        history = self._trend_tracker.get_history(symbol, limit=1)
        if not history:
            return None

        trend = self._trend_tracker.get_trend(symbol)
        return {
            "symbol": symbol,
            "history": history,
            "trend": trend,
            "history_count": len(
                self._trend_tracker.get_history(symbol, limit=1000)
            ),
        }

    def get_history(
        self,
        symbol: str,
        limit: int = 30,
    ) -> List[ConfidenceHistoryEntry]:
        return self._trend_tracker.get_history(symbol, limit)

    def get_trend(self, symbol: str) -> Optional[ConfidenceTrend]:
        return self._trend_tracker.get_trend(symbol)

    def get_breakdown(self, result: ConfidenceResult) -> Dict[str, Any]:
        dim_scores = {}
        dim_details = {}
        for dim, contrib in result.dimension_contributions.items():
            dim_scores[dim.value] = contrib.normalized_score
            dim_details[dim.value] = contrib.details

        bonus_total = sum(b.points * b.applied_count for b in result.bonuses)
        penalty_total = sum(p.points * p.applied_count for p in result.penalties)

        return {
            "symbol": result.symbol,
            "confidence_score": result.confidence_score,
            "confidence_label": result.confidence_label.value,
            "dimension_scores": dim_scores,
            "dimension_details": dim_details,
            "bonus_total": bonus_total,
            "penalty_total": penalty_total,
            "warning_count": len(result.warnings),
        }

    def get_profiles(self) -> Dict[str, ConfidenceProfile]:
        return self._profile_manager.get_all_profiles()

    def validate(
        self,
        data: Optional[Dict[str, Any]] = None,
        config: Optional[ConfidenceWeightConfig] = None,
    ) -> List[str]:
        errors: List[str] = []
        if data is not None:
            errors.extend(self._validator.validate_input_data(data))
        if config is not None:
            errors.extend(self._validator.validate_config(config))
        return errors

    def cache_stats(self) -> Dict[str, Any]:
        return self._cache.stats()

    def clear_cache(self) -> int:
        return self._cache.clear()

    def run_benchmark(
        self,
        iterations: int = 10,
        warmup: int = 3,
        symbol: str = "TUPRS",
        profile_name: str = "standard",
    ) -> Any:
        request = ConfidenceCalculationRequest(
            symbol=symbol,
            scores={"financial": 70, "technical": 65, "volume": 60},
            profile_name=profile_name,
        )

        def run_calc() -> ConfidenceResult:
            return self.calculate(request)

        return self._benchmark.run(
            operation="confidence_calculate",
            func=run_calc,
            iterations=iterations,
            warmup=warmup,
        )

    def generate_report(
        self,
        symbol: str,
        report_type: str = "executive",
        source_data: Optional[Dict[str, Any]] = None,
    ) -> ConfidenceReport:
        rtype = ReportType(report_type) if report_type in [e.value for e in ReportType] else ReportType.EXECUTIVE

        data = source_data or {}
        request = ConfidenceCalculationRequest(
            symbol=symbol,
            scores=data,
            source_data=data,
        )
        result = self.calculate(request)

        if rtype == ReportType.EXECUTIVE:
            return self._executive_report(result)
        if rtype == ReportType.DIMENSION_ANALYSIS:
            return self._dimension_report(result)
        if rtype == ReportType.WEAKNESS_ANALYSIS:
            return self._weakness_report(result)
        return self._improvement_report(result)

    def _executive_report(self, result: ConfidenceResult) -> ConfidenceReport:
        sections = []
        sections.append({
            "title": "Overall Confidence",
            "content": f"Confidence Score: {result.confidence_score:.1f} ({result.confidence_label.value})",
        })
        if result.warnings:
            sections.append({
                "title": "Warnings",
                "content": "; ".join(w.message for w in result.warnings),
            })
        if result.bonuses:
            sections.append({
                "title": "Positive Factors",
                "content": "; ".join(b.condition for b in result.bonuses),
            })
        if result.penalties:
            sections.append({
                "title": "Negative Factors",
                "content": "; ".join(p.condition for p in result.penalties),
            })
        return ConfidenceReport(
            symbol=result.symbol,
            report_type=ReportType.EXECUTIVE,
            title=f"Executive Confidence Report - {result.symbol}",
            summary=f"Overall confidence: {result.confidence_score:.1f}/100 ({result.confidence_label.value})",
            sections=sections,
        )

    def _dimension_report(self, result: ConfidenceResult) -> ConfidenceReport:
        sections = []
        for dim, contrib in sorted(
            result.dimension_contributions.items(),
            key=lambda x: x[1].normalized_score,
            reverse=True,
        ):
            sections.append({
                "title": dim.value,
                "content": f"Score: {contrib.normalized_score:.1f}, Weight: {contrib.weight:.2f}",
                "details": contrib.details,
            })
        return ConfidenceReport(
            symbol=result.symbol,
            report_type=ReportType.DIMENSION_ANALYSIS,
            title=f"Dimension Analysis - {result.symbol}",
            summary=f"Analyzed {len(result.dimension_contributions)} dimensions",
            sections=sections,
        )

    def _weakness_report(self, result: ConfidenceResult) -> ConfidenceReport:
        weak = []
        for dim, contrib in result.dimension_contributions.items():
            if contrib.normalized_score < 40:
                weak.append({"dimension": dim.value, "score": contrib.normalized_score})
        sections = [{"title": "Weak Dimensions", "items": weak}] if weak else []
        return ConfidenceReport(
            symbol=result.symbol,
            report_type=ReportType.WEAKNESS_ANALYSIS,
            title=f"Weakness Analysis - {result.symbol}",
            summary=f"Found {len(weak)} weak dimensions",
            sections=sections,
        )

    def _improvement_report(self, result: ConfidenceResult) -> ConfidenceReport:
        suggestions = []
        for dim, contrib in result.dimension_contributions.items():
            if contrib.normalized_score < 50:
                suggestions.append(f"Improve {dim.value} (currently {contrib.normalized_score:.1f})")
        return ConfidenceReport(
            symbol=result.symbol,
            report_type=ReportType.IMPROVEMENT_SUGGESTIONS,
            title=f"Improvement Suggestions - {result.symbol}",
            summary=f"{len(suggestions)} improvement areas identified",
            sections=[{"title": "Suggestions", "items": suggestions}],
        )
