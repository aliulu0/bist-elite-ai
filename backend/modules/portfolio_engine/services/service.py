from __future__ import annotations

import time
import uuid
from typing import Any, Dict, List, Optional

from modules.portfolio_engine.core.types import (
    PortfolioRequest,
    PortfolioProposal,
    PortfolioResult,
    PortfolioQuality,
    StockCandidate,
    SelectionResult,
    SortField,
    ReportType,
    InvestmentHorizon,
    _mean,
    _clamp,
    risk_score_to_level,
)
from modules.portfolio_engine.ranking.ranker import StockRanker
from modules.portfolio_engine.selection.selector import PortfolioSelector
from modules.portfolio_engine.diversification.diversifier import Diversifier
from modules.portfolio_engine.validators.validator import RequestValidator, ResultValidator
from modules.portfolio_engine.reports.generator import ReportGenerator
from modules.portfolio_engine.cache.cache import PortfolioCache


class PortfolioService:
    def __init__(self) -> None:
        self._ranker = StockRanker()
        self._selector = PortfolioSelector()
        self._diversifier = Diversifier()
        self._request_validator = RequestValidator()
        self._result_validator = ResultValidator()
        self._report_generator = ReportGenerator()
        self._cache = PortfolioCache()
        self._history: List[Dict[str, Any]] = []
        self._current: Optional[PortfolioResult] = None

    def generate(self, request: PortfolioRequest) -> PortfolioResult:
        start = time.time()

        errors = self._request_validator.validate(request)
        if errors:
            raise ValueError(f"Invalid request: {'; '.join(errors)}")

        cache_key = self._cache.make_key(
            reference_date=request.reference_date,
            horizon=request.horizon.value,
            portfolio_size=request.portfolio_size,
            max_per_sector=request.max_per_sector,
        )
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        ranked = self._ranker.rank(request.candidates, sort_by=request.sort_by)

        selected, rejected = self._selector.select(ranked, request)

        max_per_sector = request.max_per_sector
        if request.diversification_preset:
            from modules.portfolio_engine.core.types import SECTOR_DIVERSIFICATION_PRESETS
            preset_value = SECTOR_DIVERSIFICATION_PRESETS.get(request.diversification_preset)
            if preset_value is not None:
                max_per_sector = preset_value

        diversified, overflow = self._diversifier.diversify(
            selected, rejected, max_per_sector
        )

        final_selected = diversified[:request.portfolio_size]
        overflow_rejected = rejected + overflow

        quality = self._compute_quality(final_selected)

        portfolio_id = f"pf-{uuid.uuid4().hex[:12]}"
        proposal = PortfolioProposal(
            portfolio_id=portfolio_id,
            reference_date=request.reference_date,
            horizon=request.horizon,
            size=request.portfolio_size,
            selected=final_selected,
            rejected=overflow_rejected,
            quality_metrics=quality,
        )

        execution_time_ms = (time.time() - start) * 1000.0

        result = PortfolioResult(
            request=request,
            proposal=proposal,
            execution_time_ms=execution_time_ms,
        )

        self._cache.put(cache_key, result)
        self._current = result
        self._history.append({
            "portfolio_id": portfolio_id,
            "reference_date": request.reference_date,
            "horizon": request.horizon.value,
            "selected_count": len(final_selected),
            "rejected_count": len(overflow_rejected),
            "execution_time_ms": execution_time_ms,
        })

        return result

    def get_current(self) -> Optional[PortfolioResult]:
        return self._current

    def get_history(self) -> List[Dict[str, Any]]:
        return list(self._history)

    def generate_report(
        self,
        report_type: ReportType,
        result: Optional[PortfolioResult] = None,
    ) -> Dict[str, Any]:
        target = result or self._current
        if target is None:
            return {"error": "No portfolio result available"}
        return self._report_generator.generate(target, report_type)

    def clear_cache(self) -> int:
        return self._cache.clear()

    def get_cache_stats(self) -> Dict[str, Any]:
        return self._cache.stats()

    def _compute_quality(self, selected: List[StockCandidate]) -> PortfolioQuality:
        if not selected:
            return PortfolioQuality()

        elite_scores = [c.elite_score for c in selected]
        decision_scores = [c.decision_score for c in selected]
        confidences = [c.confidence for c in selected]
        risks = [c.risk for c in selected]
        liquidities = [c.liquidity for c in selected]
        composites = [c.composite_score for c in selected]

        diversification_score = self._compute_diversification_score(selected)
        concentration_risk = self._diversifier.compute_concentration_risk(selected)

        return PortfolioQuality(
            avg_elite_score=_clamp(_mean(elite_scores)),
            avg_confidence=_clamp(_mean(confidences)),
            avg_risk=_clamp(_mean(risks)),
            avg_liquidity=_clamp(_mean(liquidities)),
            avg_composite_score=_clamp(_mean(composites)),
            sector_distribution=self._diversifier.compute_sector_distribution(selected),
            liquidity_distribution=self._diversifier.compute_liquidity_distribution(selected),
            risk_distribution=self._diversifier.compute_risk_distribution(selected),
            diversification_score=diversification_score,
            concentration_risk=concentration_risk,
        )

    def _compute_diversification_score(self, selected: List[StockCandidate]) -> float:
        return self._diversifier.compute_diversification_score(selected)
