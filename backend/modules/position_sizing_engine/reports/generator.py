from __future__ import annotations

from typing import Any, Dict, List

from modules.position_sizing_engine.core.types import (
    PositionSizing,
    PositionSizingResult,
    PortfolioExposure,
    ReportType,
    _mean,
)


class ReportGenerator:

    def generate(
        self, result: PositionSizingResult, report_type: ReportType
    ) -> Dict[str, Any]:
        generators = {
            ReportType.FULL: self._full_report,
            ReportType.SUMMARY: self._summary_report,
            ReportType.ALLOCATION: self._allocation_report,
            ReportType.RISK: self._risk_report,
            ReportType.EXPOSURE: self._exposure_report,
            ReportType.EXPLAINABILITY: self._explainability_report,
        }
        generator = generators.get(report_type, self._full_report)
        return generator(result)

    def _full_report(self, result: PositionSizingResult) -> Dict[str, Any]:
        return {
            "report_type": "full",
            "reference_date": result.request.reference_date if result.request else "",
            "horizon": result.request.horizon.value if result.request else "",
            "risk_profile": result.request.risk_profile.value if result.request else "",
            "total_capital": result.request.total_capital if result.request else 0.0,
            "summary": self._build_summary(result),
            "allocation": self._build_allocation(result),
            "risk": self._build_risk(result),
            "exposure": self._build_exposure(result),
            "explainability": self._build_explainability(result),
            "execution_time_ms": result.execution_time_ms,
        }

    def _summary_report(self, result: PositionSizingResult) -> Dict[str, Any]:
        return {
            "report_type": "summary",
            **self._build_summary(result),
        }

    def _allocation_report(self, result: PositionSizingResult) -> Dict[str, Any]:
        return {
            "report_type": "allocation",
            **self._build_allocation(result),
        }

    def _risk_report(self, result: PositionSizingResult) -> Dict[str, Any]:
        return {
            "report_type": "risk",
            **self._build_risk(result),
        }

    def _exposure_report(self, result: PositionSizingResult) -> Dict[str, Any]:
        return {
            "report_type": "exposure",
            **self._build_exposure(result),
        }

    def _explainability_report(self, result: PositionSizingResult) -> Dict[str, Any]:
        return {
            "report_type": "explainability",
            **self._build_explainability(result),
        }

    def _build_summary(self, result: PositionSizingResult) -> Dict[str, Any]:
        positions = result.positions
        if not positions:
            return {"total_positions": 0}

        total_allocation = sum(p.recommended_pct for p in positions)
        avg_size = _mean([p.recommended_pct for p in positions])
        avg_risk = _mean([p.stop_loss.stop_loss_pct for p in positions if p.stop_loss])

        return {
            "total_positions": len(positions),
            "total_allocation_pct": round(total_allocation, 2),
            "cash_remaining_pct": round(100.0 - total_allocation, 2),
            "avg_position_size_pct": round(avg_size, 2),
            "avg_stop_loss_pct": round(avg_risk, 2),
            "grade_distribution": self._grade_distribution(positions),
        }

    def _build_allocation(self, result: PositionSizingResult) -> Dict[str, Any]:
        return {
            "positions": [
                {
                    "symbol": p.symbol,
                    "recommended_pct": p.recommended_pct,
                    "min_pct": p.min_pct,
                    "max_pct": p.max_pct,
                    "portfolio_weight": p.portfolio_weight,
                    "grade": p.position_grade.value,
                }
                for p in result.positions
            ],
            "total_allocation_pct": round(
                sum(p.recommended_pct for p in result.positions), 2
            ),
        }

    def _build_risk(self, result: PositionSizingResult) -> Dict[str, Any]:
        positions = result.positions
        return {
            "positions": [
                {
                    "symbol": p.symbol,
                    "grade": p.position_grade.value,
                    "stop_loss": {
                        "price": p.stop_loss.stop_loss_price,
                        "pct": p.stop_loss.stop_loss_pct,
                        "type": p.stop_loss.stop_loss_type.value,
                    } if p.stop_loss else None,
                    "take_profit": {
                        "primary": p.take_profit.primary_target,
                        "secondary": p.take_profit.secondary_target,
                        "risk_reward": p.take_profit.risk_reward_ratio,
                    } if p.take_profit else None,
                }
                for p in positions
            ],
            "total_risk_exposure": result.exposure.total_risk_exposure,
            "concentration_risk": result.exposure.concentration_risk,
        }

    def _build_exposure(self, result: PositionSizingResult) -> Dict[str, Any]:
        exp = result.exposure
        return {
            "sector_exposure": exp.sector_exposure,
            "market_exposure": exp.market_exposure,
            "total_risk_exposure": exp.total_risk_exposure,
            "cash_ratio": exp.cash_ratio,
            "concentration_risk": exp.concentration_risk,
            "sector_count": exp.sector_count,
        }

    def _build_explainability(self, result: PositionSizingResult) -> Dict[str, Any]:
        return {
            "positions": [
                {
                    "symbol": p.symbol,
                    "recommended_pct": p.recommended_pct,
                    "grade": p.position_grade.value,
                    "explanation": p.explanation,
                    "stop_loss_explanation": p.stop_loss.explanation if p.stop_loss else "",
                    "take_profit_explanation": p.take_profit.explanation if p.take_profit else "",
                }
                for p in result.positions
            ],
        }

    def _grade_distribution(self, positions: List[PositionSizing]) -> Dict[str, int]:
        dist: Dict[str, int] = {}
        for p in positions:
            key = p.position_grade.value
            dist[key] = dist.get(key, 0) + 1
        return dist
