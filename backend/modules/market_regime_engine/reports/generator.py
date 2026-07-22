from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.market_regime_engine.core.types import (
    MarketRegime,
    RegimeAnalysisResult,
    RegimeClassification,
    RegimeHistoryEntry,
    RegimeTransition,
    ReportType,
    SectorAnalysis,
    get_risk_level,
    get_strategy_profile,
    _mean,
)


class ReportGenerator:
    """Generates regime analysis reports."""

    def generate(
        self,
        result: RegimeAnalysisResult,
        report_type: ReportType = ReportType.CURRENT_REGIME,
    ) -> Dict[str, Any]:
        if report_type == ReportType.CURRENT_REGIME:
            return self._current_regime(result)
        elif report_type == ReportType.REGIME_HISTORY:
            return self._regime_history(result)
        elif report_type == ReportType.REGIME_CHANGES:
            return self._regime_changes(result)
        elif report_type == ReportType.SECTOR_ROTATION:
            return self._sector_rotation(result)
        elif report_type == ReportType.EXPECTED_NEXT_REGIME:
            return self._expected_next(result)
        elif report_type == ReportType.RISK_IMPLICATIONS:
            return self._risk_implications(result)
        elif report_type == ReportType.FULL:
            return self._full_report(result)
        return self._current_regime(result)

    def _current_regime(self, result: RegimeAnalysisResult) -> Dict[str, Any]:
        c = result.classification
        return {
            "report_type": "current_regime",
            "regime": c.regime.value,
            "confidence": c.confidence,
            "score": c.score,
            "stability": c.stability,
            "strategy_profile": result.strategy_profile.value,
            "risk_level": get_risk_level(c.regime),
            "contributing_signals": c.contributing_signals,
            "reference_date": result.request.reference_date,
        }

    def _regime_history(self, result: RegimeAnalysisResult) -> Dict[str, Any]:
        return {
            "report_type": "regime_history",
            "history": [
                {
                    "date": h.date,
                    "regime": h.regime.value,
                    "confidence": h.confidence,
                    "score": h.score,
                    "duration_days": h.duration_days,
                }
                for h in result.history
            ],
            "total_entries": len(result.history),
        }

    def _regime_changes(self, result: RegimeAnalysisResult) -> Dict[str, Any]:
        changes = []
        for i in range(1, len(result.history)):
            if result.history[i].regime != result.history[i - 1].regime:
                changes.append({
                    "date": result.history[i].date,
                    "from_regime": result.history[i - 1].regime.value,
                    "to_regime": result.history[i].regime.value,
                    "confidence": result.history[i].confidence,
                })
        return {
            "report_type": "regime_changes",
            "changes": changes,
            "total_changes": len(changes),
        }

    def _sector_rotation(self, result: RegimeAnalysisResult) -> Dict[str, Any]:
        sectors = []
        for s in result.sectors:
            sectors.append({
                "sector": s.sector_name,
                "strength": s.strength.value,
                "score": s.score,
                "relative_performance": s.relative_performance,
                "momentum": s.momentum,
            })
        leading = [s.sector_name for s in result.sectors if s.strength.value == "leading"]
        weak = [s.sector_name for s in result.sectors if s.strength.value == "weak"]
        return {
            "report_type": "sector_rotation",
            "sectors": sectors,
            "leading_sectors": leading,
            "weak_sectors": weak,
        }

    def _expected_next(self, result: RegimeAnalysisResult) -> Dict[str, Any]:
        transitions = []
        for t in result.transitions:
            transitions.append({
                "from": t.from_regime.value,
                "to": t.to_regime.value,
                "probability": t.probability,
                "transition_type": t.transition_type.value,
            })
        next_pred = result.next_regime_prediction
        return {
            "report_type": "expected_next_regime",
            "current_regime": result.classification.regime.value,
            "transitions": transitions,
            "predicted_next": next_pred.regime.value if next_pred else None,
            "prediction_confidence": next_pred.confidence if next_pred else 0.0,
        }

    def _risk_implications(self, result: RegimeAnalysisResult) -> Dict[str, Any]:
        c = result.classification
        risk = get_risk_level(c.regime)
        return {
            "report_type": "risk_implications",
            "regime": c.regime.value,
            "risk_level": risk,
            "strategy_profile": result.strategy_profile.value,
            "risk_implications": result.risk_implications,
            "recommended_actions": self._get_recommendations(c.regime),
        }

    def _full_report(self, result: RegimeAnalysisResult) -> Dict[str, Any]:
        return {
            "report_type": "full",
            "current_regime": self._current_regime(result),
            "history": self._regime_history(result),
            "changes": self._regime_changes(result),
            "sectors": self._sector_rotation(result),
            "expected_next": self._expected_next(result),
            "risk": self._risk_implications(result),
        }

    def _get_recommendations(self, regime: MarketRegime) -> List[str]:
        recommendations = {
            MarketRegime.STRONG_BULL: [
                "Maintain aggressive growth exposure",
                "Consider taking partial profits on extended positions",
                "Monitor for distribution signals",
            ],
            MarketRegime.BULL: [
                "Maintain moderate growth allocation",
                "Favor quality growth stocks",
                "Use dips for accumulation",
            ],
            MarketRegime.WEAK_BULL: [
                "Reduce position sizes",
                "Shift toward quality and dividends",
                "Tighten stop losses",
            ],
            MarketRegime.SIDEWAYS: [
                "Use range-bound strategies",
                "Focus on mean reversion",
                "Reduce directional exposure",
            ],
            MarketRegime.WEAK_BEAR: [
                "Increase defensive allocation",
                "Reduce equity exposure",
                "Consider hedging strategies",
            ],
            MarketRegime.BEAR: [
                "Maintain defensive posture",
                "Focus on cash and bonds",
                "Look for accumulation signals",
            ],
            MarketRegime.STRONG_BEAR: [
                "Maximum defensive positioning",
                "Avoid catching falling knives",
                "Prepare watchlist for recovery",
            ],
            MarketRegime.RECOVERY: [
                "Begin accumulating quality names",
                "Increase equity exposure gradually",
                "Focus on early-cycle sectors",
            ],
            MarketRegime.DISTRIBUTION: [
                "Reduce growth exposure",
                "Increase cash holdings",
                "Prepare for potential downturn",
            ],
            MarketRegime.ACCUMULATION: [
                "Begin building positions gradually",
                "Focus on value opportunities",
                "Use dollar-cost averaging",
            ],
            MarketRegime.HIGH_VOLATILITY: [
                "Reduce position sizes",
                "Use options for hedging",
                "Favor quality and low-beta",
            ],
            MarketRegime.LOW_VOLATILITY: [
                "Maintain standard allocation",
                "Consider volatility selling strategies",
                "Monitor for regime change signals",
            ],
        }
        return recommendations.get(regime, ["Maintain balanced allocation"])
