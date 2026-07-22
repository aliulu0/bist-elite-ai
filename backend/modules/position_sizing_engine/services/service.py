from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from modules.position_sizing_engine.allocation.calculator import PositionCalculator
from modules.position_sizing_engine.core.types import (
    InvestmentHorizon,
    PortfolioExposure,
    PositionSizing,
    PositionSizingRequest,
    PositionSizingResult,
    ReportType,
    RiskProfile,
)
from modules.position_sizing_engine.profiles.risk_profiles import RiskProfileManager
from modules.position_sizing_engine.reports.generator import ReportGenerator
from modules.position_sizing_engine.risk.allocator import RiskAllocator
from modules.position_sizing_engine.validators.validator import RequestValidator, ResultValidator
from modules.position_sizing_engine.cache.cache import PositionSizingCache


class PositionSizingService:

    def __init__(self) -> None:
        self._calculator = PositionCalculator()
        self._allocator = RiskAllocator()
        self._profile_manager = RiskProfileManager()
        self._validator = RequestValidator()
        self._report_generator = ReportGenerator()
        self._cache = PositionSizingCache()
        self._history: List[Dict[str, Any]] = []
        self._current: Optional[PositionSizingResult] = None

    def calculate(self, request: PositionSizingRequest) -> PositionSizingResult:
        start = time.time()

        errors = self._validator.validate(request)
        if errors:
            raise ValueError(f"Invalid request: {'; '.join(errors)}")

        cache_key = self._cache.make_key(
            reference_date=request.reference_date,
            horizon=request.horizon.value,
            risk_profile=request.risk_profile.value,
            total_capital=request.total_capital,
            position_count=len(request.positions),
        )
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        profile_params = self._get_effective_params(request)

        calculated_positions: List[PositionSizing] = []
        for pos_input in request.positions:
            sizing = self._calculator.calculate(pos_input, profile_params)
            calculated_positions.append(sizing)

        adjusted_positions = self._allocator.allocate(calculated_positions, request)

        exposure = self._allocator.compute_portfolio_exposure(adjusted_positions, request)

        execution_time_ms = (time.time() - start) * 1000.0

        result = PositionSizingResult(
            request=request,
            positions=adjusted_positions,
            exposure=exposure,
            execution_time_ms=execution_time_ms,
            metadata={
                "profile": request.risk_profile.value,
                "horizon": request.horizon.value,
                "position_count": len(adjusted_positions),
            },
        )

        self._cache.put(cache_key, result)
        self._current = result
        self._history.append({
            "reference_date": request.reference_date,
            "horizon": request.horizon.value,
            "risk_profile": request.risk_profile.value,
            "position_count": len(adjusted_positions),
            "execution_time_ms": execution_time_ms,
        })

        return result

    def get_current(self) -> Optional[PositionSizingResult]:
        return self._current

    def get_history(self) -> List[Dict[str, Any]]:
        return list(self._history)

    def generate_report(
        self,
        report_type: ReportType,
        result: Optional[PositionSizingResult] = None,
    ) -> Dict[str, Any]:
        target = result or self._current
        if target is None:
            return {"error": "No position sizing result available"}
        return self._report_generator.generate(target, report_type)

    def get_exposure(self) -> Optional[PortfolioExposure]:
        if self._current is None:
            return None
        return self._current.exposure

    def clear_cache(self) -> int:
        return self._cache.clear()

    def get_cache_stats(self) -> Dict[str, Any]:
        return self._cache.stats()

    def _get_effective_params(self, request: PositionSizingRequest) -> Dict[str, Any]:
        base_params = self._profile_manager.get_params(request.risk_profile)
        if request.risk_profile == RiskProfile.CUSTOM and request.custom_params:
            custom_validated = self._profile_manager._validate_custom_params(
                request.custom_params
            )
            base_params.update(custom_validated)
        return base_params
