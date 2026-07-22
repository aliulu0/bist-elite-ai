from __future__ import annotations

import math
from typing import Any, Dict, List

from modules.monte_carlo_engine.core.types import (
    MonteCarloResult,
    ProbabilityMetrics,
    SimulationResult,
    _kurtosis,
    _mean,
    _median,
    _percentile,
    _skewness,
    _stdev,
)


class MonteCarloStatistics:
    """Calculates probability and statistical metrics from simulations."""

    def calculate_probability_metrics(
        self,
        simulations: List[SimulationResult],
        initial_capital: float = 100000.0,
    ) -> ProbabilityMetrics:
        if not simulations:
            return ProbabilityMetrics()

        total_returns = [s.total_return for s in simulations]
        terminal_values = [s.terminal_value for s in simulations]

        prob_loss_1 = sum(1 for r in total_returns if r < -1) / len(total_returns) * 100
        prob_loss_5 = sum(1 for r in total_returns if r < -5) / len(total_returns) * 100
        prob_loss_10 = sum(1 for r in total_returns if r < -10) / len(total_returns) * 100
        prob_loss_20 = sum(1 for r in total_returns if r < -20) / len(total_returns) * 100
        prob_gain_5 = sum(1 for r in total_returns if r > 5) / len(total_returns) * 100
        prob_gain_10 = sum(1 for r in total_returns if r > 10) / len(total_returns) * 100
        prob_gain_20 = sum(1 for r in total_returns if r > 20) / len(total_returns) * 100
        prob_gain_50 = sum(1 for r in total_returns if r > 50) / len(total_returns) * 100
        prob_double = sum(1 for v in terminal_values if v >= initial_capital * 2) / len(terminal_values) * 100
        prob_halve = sum(1 for v in terminal_values if v <= initial_capital * 0.5) / len(terminal_values) * 100

        return ProbabilityMetrics(
            prob_loss_1pct=round(prob_loss_1, 4),
            prob_loss_5pct=round(prob_loss_5, 4),
            prob_loss_10pct=round(prob_loss_10, 4),
            prob_loss_20pct=round(prob_loss_20, 4),
            prob_gain_5pct=round(prob_gain_5, 4),
            prob_gain_10pct=round(prob_gain_10, 4),
            prob_gain_20pct=round(prob_gain_20, 4),
            prob_gain_50pct=round(prob_gain_50, 4),
            prob_double=round(prob_double, 4),
            prob_halve=round(prob_halve, 4),
            expected_return=round(_mean(total_returns), 4),
            median_return=round(_median(total_returns), 4),
            return_std=round(_stdev(total_returns), 4),
            skewness=round(_skewness(total_returns), 4),
            kurtosis=round(_kurtosis(total_returns), 4),
        )

    def calculate_summary_statistics(
        self,
        simulations: List[SimulationResult],
    ) -> Dict[str, Any]:
        if not simulations:
            return {}

        terminal_values = [s.terminal_value for s in simulations]
        total_returns = [s.total_return for s in simulations]

        return {
            "num_simulations": len(simulations),
            "mean_terminal": round(_mean(terminal_values), 2),
            "median_terminal": round(_median(terminal_values), 2),
            "std_terminal": round(_stdev(terminal_values), 2),
            "min_terminal": round(min(terminal_values), 2),
            "max_terminal": round(max(terminal_values), 2),
            "mean_return": round(_mean(total_returns), 4),
            "median_return": round(_median(total_returns), 4),
            "std_return": round(_stdev(total_returns), 4),
            "min_return": round(min(total_returns), 4),
            "max_return": round(max(total_returns), 4),
            "percentile_5": round(_percentile(total_returns, 0.05), 4),
            "percentile_25": round(_percentile(total_returns, 0.25), 4),
            "percentile_75": round(_percentile(total_returns, 0.75), 4),
            "percentile_95": round(_percentile(total_returns, 0.95), 4),
        }

    def summarize_terminal_values(
        self,
        simulations: List[SimulationResult],
    ) -> Dict[str, float]:
        terminal = [s.terminal_value for s in simulations]
        if not terminal:
            return {}
        return {
            "mean": round(_mean(terminal), 2),
            "median": round(_median(terminal), 2),
            "std": round(_stdev(terminal), 2),
            "min": round(min(terminal), 2),
            "max": round(max(terminal), 2),
            "p5": round(_percentile(terminal, 0.05), 2),
            "p25": round(_percentile(terminal, 0.25), 2),
            "p75": round(_percentile(terminal, 0.75), 2),
            "p95": round(_percentile(terminal, 0.95), 2),
        }
