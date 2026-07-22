from __future__ import annotations

from typing import Any, Dict, List

from modules.portfolio_engine.core.types import (
    PortfolioResult,
    ReportType,
    _mean,
)


class ReportGenerator:
    def generate(self, result: PortfolioResult, report_type: ReportType) -> Dict[str, Any]:
        dispatch = {
            ReportType.FULL: self._full_report,
            ReportType.SUMMARY: self._summary_report,
            ReportType.SELECTED_STOCKS: self._selected_stocks_report,
            ReportType.REJECTED_STOCKS: self._rejected_stocks_report,
            ReportType.SECTOR_DISTRIBUTION: self._sector_distribution_report,
            ReportType.RISK_SUMMARY: self._risk_summary_report,
        }
        return dispatch[report_type](result)

    def _full_report(self, result: PortfolioResult) -> Dict[str, Any]:
        quality = result.proposal.quality_metrics
        return {
            "report_type": ReportType.FULL.value,
            "portfolio_id": result.proposal.portfolio_id,
            "reference_date": result.proposal.reference_date,
            "horizon": result.proposal.horizon.value,
            "size": result.proposal.size,
            "selected_count": len(result.proposal.selected),
            "rejected_count": len(result.proposal.rejected),
            "execution_time_ms": result.execution_time_ms,
            "selected_stocks": [
                {
                    "symbol": c.symbol,
                    "sector": c.sector,
                    "elite_score": c.elite_score,
                    "decision_score": c.decision_score,
                    "confidence": c.confidence,
                    "risk": c.risk,
                    "liquidity": c.liquidity,
                    "composite_score": c.composite_score,
                    "rank": c.rank,
                }
                for c in result.proposal.selected
            ],
            "rejected_stocks": [
                {
                    "symbol": r.symbol,
                    "reason": r.reason,
                    "rejection_reason": r.rejection_reason.value if r.rejection_reason else None,
                    "composite_score": r.composite_score,
                }
                for r in result.proposal.rejected
            ],
            "quality": self._quality_to_dict(quality) if quality else None,
            "sector_distribution": quality.sector_distribution if quality else {},
            "risk_distribution": quality.risk_distribution if quality else {},
            "liquidity_distribution": quality.liquidity_distribution if quality else {},
            "metadata": result.metadata,
        }

    def _summary_report(self, result: PortfolioResult) -> Dict[str, Any]:
        quality = result.proposal.quality_metrics
        return {
            "report_type": ReportType.SUMMARY.value,
            "portfolio_id": result.proposal.portfolio_id,
            "reference_date": result.proposal.reference_date,
            "horizon": result.proposal.horizon.value,
            "size": result.proposal.size,
            "selected_count": len(result.proposal.selected),
            "rejected_count": len(result.proposal.rejected),
            "avg_composite_score": quality.avg_composite_score if quality else 0.0,
            "avg_elite_score": quality.avg_elite_score if quality else 0.0,
            "avg_risk": quality.avg_risk if quality else 0.0,
            "diversification_score": quality.diversification_score if quality else 0.0,
            "concentration_risk": quality.concentration_risk if quality else 0.0,
            "execution_time_ms": result.execution_time_ms,
        }

    def _selected_stocks_report(self, result: PortfolioResult) -> Dict[str, Any]:
        return {
            "report_type": ReportType.SELECTED_STOCKS.value,
            "portfolio_id": result.proposal.portfolio_id,
            "count": len(result.proposal.selected),
            "stocks": [
                {
                    "symbol": c.symbol,
                    "sector": c.sector,
                    "elite_score": c.elite_score,
                    "decision_score": c.decision_score,
                    "confidence": c.confidence,
                    "risk": c.risk,
                    "liquidity": c.liquidity,
                    "composite_score": c.composite_score,
                    "rank": c.rank,
                }
                for c in result.proposal.selected
            ],
        }

    def _rejected_stocks_report(self, result: PortfolioResult) -> Dict[str, Any]:
        return {
            "report_type": ReportType.REJECTED_STOCKS.value,
            "portfolio_id": result.proposal.portfolio_id,
            "count": len(result.proposal.rejected),
            "stocks": [
                {
                    "symbol": r.symbol,
                    "reason": r.reason,
                    "rejection_reason": r.rejection_reason.value if r.rejection_reason else None,
                    "rank": r.rank,
                    "composite_score": r.composite_score,
                }
                for r in result.proposal.rejected
            ],
        }

    def _sector_distribution_report(self, result: PortfolioResult) -> Dict[str, Any]:
        quality = result.proposal.quality_metrics
        sector_dist = quality.sector_distribution if quality else {}
        total = len(result.proposal.selected)

        return {
            "report_type": ReportType.SECTOR_DISTRIBUTION.value,
            "portfolio_id": result.proposal.portfolio_id,
            "total_stocks": total,
            "sectors": {
                sector: {
                    "count": count,
                    "percentage": round((count / total * 100.0), 2) if total > 0 else 0.0,
                }
                for sector, count in sector_dist.items()
            },
        }

    def _risk_summary_report(self, result: PortfolioResult) -> Dict[str, Any]:
        quality = result.proposal.quality_metrics
        risk_dist = quality.risk_distribution if quality else {}
        avg_risk = quality.avg_risk if quality else 0.0
        total = len(result.proposal.selected)

        return {
            "report_type": ReportType.RISK_SUMMARY.value,
            "portfolio_id": result.proposal.portfolio_id,
            "total_stocks": total,
            "avg_risk": avg_risk,
            "risk_distribution": risk_dist,
            "risk_percentages": {
                level: round((count / total * 100.0), 2) if total > 0 else 0.0
                for level, count in risk_dist.items()
            },
        }

    def _quality_to_dict(self, quality: Any) -> Dict[str, Any]:
        return {
            "avg_elite_score": quality.avg_elite_score,
            "avg_confidence": quality.avg_confidence,
            "avg_risk": quality.avg_risk,
            "avg_liquidity": quality.avg_liquidity,
            "avg_composite_score": quality.avg_composite_score,
            "diversification_score": quality.diversification_score,
            "concentration_risk": quality.concentration_risk,
        }
