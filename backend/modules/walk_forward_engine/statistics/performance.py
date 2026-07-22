from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.walk_forward_engine.core.types import (
    GeneralizationScores,
    MarketRegime,
    OverfittingSeverity,
    RegimePerformance,
    ValidationMetrics,
    WalkForwardResult,
    WindowResult,
    _mean,
    _median,
    _stdev,
    classify_overfitting_severity,
    compute_consistency_score,
    compute_generalization_score,
    compute_overfitting_score,
    compute_robustness_score,
    generate_overfitting_recommendation,
)


class WalkForwardStatistics:
    """Calculates walk-forward analysis performance metrics."""

    def calculate_generalization_scores(
        self,
        window_results: List[WindowResult],
    ) -> GeneralizationScores:
        train_returns = []
        test_returns = []
        train_sharpes = []
        test_sharpes = []
        for wr in window_results:
            if wr.optimization:
                train_returns.append(wr.optimization.train_return)
                train_sharpes.append(wr.optimization.train_sharpe)
            if wr.validation:
                test_returns.append(wr.validation.out_of_sample_return)
                test_sharpes.append(wr.validation.out_of_sample_sharpe)

        avg_train_return = _mean(train_returns)
        avg_test_return = _mean(test_returns)
        avg_train_sharpe = _mean(train_sharpes)
        avg_test_sharpe = _mean(test_sharpes)

        generalization = compute_generalization_score(avg_test_return, avg_train_return)
        overfitting = compute_overfitting_score(avg_train_sharpe, avg_test_sharpe)
        consistency = compute_consistency_score(test_sharpes)
        severity = classify_overfitting_severity(overfitting)

        param_sensitivity = self._compute_parameter_sensitivity(window_results)
        perf_degradation = self._compute_performance_degradation(train_returns, test_returns)
        regime_dep = self._compute_regime_dependency(window_results)
        drift = self._compute_historical_drift(test_sharpes)

        regime_stability = 1.0 - regime_dep
        robustness = compute_robustness_score(generalization, consistency, regime_stability)

        return GeneralizationScores(
            generalization_score=round(generalization, 4),
            overfitting_score=round(overfitting, 4),
            robustness_score=round(robustness, 4),
            consistency_score=round(consistency, 4),
            parameter_sensitivity=round(param_sensitivity, 4),
            performance_degradation=round(perf_degradation, 4),
            regime_dependency=round(regime_dep, 4),
            historical_drift=round(drift, 4),
            severity=severity,
            recommendation=generate_overfitting_recommendation(severity, GeneralizationScores(
                performance_degradation=perf_degradation,
                regime_dependency=regime_dep,
            )),
        )

    def calculate_regime_performance(
        self,
        window_results: List[WindowResult],
    ) -> List[RegimePerformance]:
        regime_map: Dict[MarketRegime, List[WindowResult]] = {}
        for wr in window_results:
            regime = wr.window.regime
            if regime not in regime_map:
                regime_map[regime] = []
            regime_map[regime].append(wr)

        performances: List[RegimePerformance] = []
        for regime, wrs in regime_map.items():
            returns = [wr.validation.out_of_sample_return for wr in wrs if wr.validation]
            sharpes = [wr.validation.out_of_sample_sharpe for wr in wrs if wr.validation]
            drawdowns = [wr.validation.out_of_sample_drawdown for wr in wrs if wr.validation]
            win_rates = [wr.validation.out_of_sample_win_rate for wr in wrs if wr.validation]
            stability = compute_consistency_score(sharpes) if sharpes else 0.0

            performances.append(RegimePerformance(
                regime=regime,
                windows_count=len(wrs),
                avg_return=round(_mean(returns), 4),
                avg_sharpe=round(_mean(sharpes), 4),
                avg_drawdown=round(_mean(drawdowns), 4),
                avg_win_rate=round(_mean(win_rates), 4),
                stability=round(stability, 4),
            ))
        return sorted(performances, key=lambda x: x.windows_count, reverse=True)

    def calculate_window_metrics(
        self,
        train_metrics: Dict[str, float],
        test_metrics: Dict[str, float],
    ) -> ValidationMetrics:
        return ValidationMetrics(
            out_of_sample_return=test_metrics.get("total_return", 0.0),
            out_of_sample_win_rate=test_metrics.get("win_rate", 0.0),
            out_of_sample_sharpe=test_metrics.get("sharpe_ratio", 0.0),
            out_of_sample_sortino=test_metrics.get("sortino_ratio", 0.0),
            out_of_sample_drawdown=test_metrics.get("max_drawdown", 0.0),
            out_of_sample_trades=test_metrics.get("total_trades", 0),
            total_return=train_metrics.get("total_return", 0.0),
            sharpe_ratio=train_metrics.get("sharpe_ratio", 0.0),
            max_drawdown=train_metrics.get("max_drawdown", 0.0),
            win_rate=train_metrics.get("win_rate", 0.0),
            profit_factor=train_metrics.get("profit_factor", 0.0),
            expectancy=train_metrics.get("expectancy", 0.0),
        )

    def summarize_results(
        self,
        result: WalkForwardResult,
    ) -> Dict[str, Any]:
        successful = [wr for wr in result.window_results if wr.success]
        test_sharpes = [wr.validation.out_of_sample_sharpe for wr in successful if wr.validation]
        test_returns = [wr.validation.out_of_sample_return for wr in successful if wr.validation]
        return {
            "total_windows": result.total_windows,
            "successful_windows": result.successful_windows,
            "failed_windows": result.failed_windows,
            "avg_test_sharpe": round(_mean(test_sharpes), 4) if test_sharpes else 0.0,
            "avg_test_return": round(_mean(test_returns), 4) if test_returns else 0.0,
            "median_test_sharpe": round(_median(test_sharpes), 4) if test_sharpes else 0.0,
            "std_test_sharpe": round(_stdev(test_sharpes), 4) if len(test_sharpes) > 1 else 0.0,
            "generalization_score": result.generalization.generalization_score,
            "overfitting_score": result.generalization.overfitting_score,
            "robustness_score": result.generalization.robustness_score,
            "consistency_score": result.generalization.consistency_score,
            "severity": result.generalization.severity.value,
        }

    def _compute_parameter_sensitivity(self, window_results: List[WindowResult]) -> float:
        param_sets = [wr.selected_parameters for wr in window_results if wr.selected_parameters]
        if len(param_sets) < 2:
            return 0.0
        unique_count = len(set(str(p) for p in param_sets))
        total = len(param_sets)
        diversity = unique_count / total if total > 0 else 0.0
        return min(1.0, diversity)

    def _compute_performance_degradation(
        self,
        train_returns: List[float],
        test_returns: List[float],
    ) -> float:
        if not train_returns or not test_returns:
            return 0.0
        avg_train = _mean(train_returns)
        avg_test = _mean(test_returns)
        if avg_train == 0:
            return 0.0
        degradation = (avg_train - avg_test) / abs(avg_train)
        return max(0.0, min(1.0, degradation))

    def _compute_regime_dependency(self, window_results: List[WindowResult]) -> float:
        regime_sharpes: Dict[MarketRegime, List[float]] = {}
        for wr in window_results:
            if wr.validation:
                regime = wr.window.regime
                if regime not in regime_sharpes:
                    regime_sharpes[regime] = []
                regime_sharpes[regime].append(wr.validation.out_of_sample_sharpe)
        if len(regime_sharpes) < 2:
            return 0.0
        regime_avgs = [_mean(s) for s in regime_sharpes.values() if s]
        if not regime_avgs:
            return 0.0
        spread = max(regime_avgs) - min(regime_avgs)
        return min(1.0, spread / 2.0)

    def _compute_historical_drift(self, test_sharpes: List[float]) -> float:
        if len(test_sharpes) < 3:
            return 0.0
        n = len(test_sharpes)
        first_half = _mean(test_sharpes[: n // 2])
        second_half = _mean(test_sharpes[n // 2:])
        drift = abs(second_half - first_half) / (abs(first_half) + 1e-8)
        return min(1.0, drift)
