from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.similarity_engine.core.types import (
    HistoricalOutcome,
    PatternMemory,
    ReportType,
    SimilarityAnalysis,
    SimilarityResult,
    _mean,
    _median,
)


class ReportGenerator:
    """Generates similarity analysis reports."""

    def generate(
        self,
        analysis: SimilarityAnalysis,
        report_type: ReportType = ReportType.EXECUTIVE_SUMMARY,
    ) -> Dict[str, Any]:
        if report_type == ReportType.EXECUTIVE_SUMMARY:
            return self._executive_summary(analysis)
        elif report_type == ReportType.TOP_SIMILAR_STOCKS:
            return self._top_similar_stocks(analysis)
        elif report_type == ReportType.PERFORMANCE_COMPARISON:
            return self._performance_comparison(analysis)
        elif report_type == ReportType.SIMILARITY_HEATMAP:
            return self._similarity_heatmap(analysis)
        elif report_type == ReportType.FEATURE_COMPARISON:
            return self._feature_comparison(analysis)
        elif report_type == ReportType.RISK_COMPARISON:
            return self._risk_comparison(analysis)
        elif report_type == ReportType.FULL:
            return self._full_report(analysis)
        return self._executive_summary(analysis)

    def _executive_summary(self, analysis: SimilarityAnalysis) -> Dict[str, Any]:
        results = analysis.top_similar_stocks or analysis.results
        scores = [r.similarity_score for r in results]
        return {
            "report_type": "executive_summary",
            "symbol": analysis.request.symbol,
            "reference_date": analysis.request.reference_date,
            "total_results": len(results),
            "avg_similarity": round(_mean(scores), 6) if scores else 0.0,
            "median_similarity": round(_median(scores), 6) if scores else 0.0,
            "top_similar": [
                {
                    "symbol": r.target_symbol,
                    "date": r.target_date,
                    "score": r.similarity_score,
                    "label": r.similarity_label.value,
                }
                for r in results[:5]
            ],
            "confidence_score": analysis.confidence_score,
            "regime_distribution": analysis.regime_distribution,
            "execution_time_ms": analysis.execution_time_ms,
        }

    def _top_similar_stocks(self, analysis: SimilarityAnalysis) -> Dict[str, Any]:
        results = analysis.top_similar_stocks or analysis.results
        return {
            "report_type": "top_similar_stocks",
            "symbol": analysis.request.symbol,
            "stocks": [
                {
                    "rank": i + 1,
                    "symbol": r.target_symbol,
                    "date": r.target_date,
                    "score": r.similarity_score,
                    "label": r.similarity_label.value,
                    "method": r.method.value,
                    "top_contributing": dict(
                        sorted(
                            r.contributing_features.items(),
                            key=lambda x: x[1],
                            reverse=True,
                        )[:5]
                    ) if r.contributing_features else {},
                }
                for i, r in enumerate(results[:10])
            ],
        }

    def _performance_comparison(self, analysis: SimilarityAnalysis) -> Dict[str, Any]:
        results = analysis.top_similar_stocks or analysis.results
        outcomes = analysis.historical_outcomes
        perf_data = []
        for r in results:
            key = f"{r.target_symbol}_{r.target_date}"
            outcome = outcomes.get(key)
            if outcome:
                perf_data.append({
                    "symbol": r.target_symbol,
                    "similarity": r.similarity_score,
                    "period_returns": outcome.period_return,
                    "max_drawdown": outcome.max_drawdown,
                    "win_rate": outcome.win_rate,
                    "avg_return": outcome.avg_return,
                })
        return {
            "report_type": "performance_comparison",
            "symbol": analysis.request.symbol,
            "comparisons": perf_data,
            "aggregate": {
                "avg_return": round(
                    _mean([p["avg_return"] for p in perf_data]), 4
                ) if perf_data else 0.0,
                "avg_win_rate": round(
                    _mean([p["win_rate"] for p in perf_data]), 2
                ) if perf_data else 0.0,
                "avg_drawdown": round(
                    _mean([abs(p["max_drawdown"]) for p in perf_data]), 4
                ) if perf_data else 0.0,
            },
        }

    def _similarity_heatmap(self, analysis: SimilarityAnalysis) -> Dict[str, Any]:
        results = analysis.top_similar_stocks or analysis.results
        symbols = list(set(r.target_symbol for r in results))
        heatmap: Dict[str, Dict[str, float]] = {}
        for r in results:
            if r.target_symbol not in heatmap:
                heatmap[r.target_symbol] = {}
            heatmap[r.target_symbol][r.target_date] = r.similarity_score
        return {
            "report_type": "similarity_heatmap",
            "symbol": analysis.request.symbol,
            "symbols": symbols,
            "heatmap": heatmap,
            "max_score": max((r.similarity_score for r in results), default=0.0),
            "min_score": min((r.similarity_score for r in results), default=0.0),
        }

    def _feature_comparison(self, analysis: SimilarityAnalysis) -> Dict[str, Any]:
        results = analysis.top_similar_stocks or analysis.results
        feature_data: Dict[str, List[Dict[str, Any]]] = {}
        for r in results:
            for feat, dist in r.feature_distances.items():
                if feat not in feature_data:
                    feature_data[feat] = []
                feature_data[feat].append({
                    "symbol": r.target_symbol,
                    "distance": dist,
                })
        feature_summary = {}
        for feat, data in feature_data.items():
            distances = [d["distance"] for d in data]
            feature_summary[feat] = {
                "avg_distance": round(_mean(distances), 6),
                "min_distance": round(min(distances), 6) if distances else 0.0,
                "max_distance": round(max(distances), 6) if distances else 0.0,
            }
        return {
            "report_type": "feature_comparison",
            "symbol": analysis.request.symbol,
            "feature_summary": feature_summary,
        }

    def _risk_comparison(self, analysis: SimilarityAnalysis) -> Dict[str, Any]:
        results = analysis.top_similar_stocks or analysis.results
        outcomes = analysis.historical_outcomes
        risk_data = []
        for r in results:
            key = f"{r.target_symbol}_{r.target_date}"
            outcome = outcomes.get(key)
            if outcome:
                risk_data.append({
                    "symbol": r.target_symbol,
                    "similarity": r.similarity_score,
                    "max_drawdown": outcome.max_drawdown,
                    "win_rate": outcome.win_rate,
                    "regime": r.market_regime.value,
                    "pattern_outcome": r.pattern_outcome.value,
                })
        return {
            "report_type": "risk_comparison",
            "symbol": analysis.request.symbol,
            "risk_data": risk_data,
            "aggregate": {
                "avg_drawdown": round(
                    _mean([abs(d["max_drawdown"]) for d in risk_data]), 4
                ) if risk_data else 0.0,
                "avg_win_rate": round(
                    _mean([d["win_rate"] for d in risk_data]), 2
                ) if risk_data else 0.0,
            },
        }

    def _full_report(self, analysis: SimilarityAnalysis) -> Dict[str, Any]:
        return {
            "report_type": "full",
            "symbol": analysis.request.symbol,
            "executive_summary": self._executive_summary(analysis),
            "top_stocks": self._top_similar_stocks(analysis),
            "performance": self._performance_comparison(analysis),
            "heatmap": self._similarity_heatmap(analysis),
            "features": self._feature_comparison(analysis),
            "risk": self._risk_comparison(analysis),
            "pattern_memories": [
                {
                    "symbol": m.symbol,
                    "date": m.date,
                    "outcome": m.outcome.value,
                    "return_pct": m.return_pct,
                    "regime": m.market_regime.value,
                    "similarity": m.similarity_score,
                }
                for m in analysis.pattern_memories
            ],
        }
