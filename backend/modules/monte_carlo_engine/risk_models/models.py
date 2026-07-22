from __future__ import annotations

import math
from typing import List

from modules.monte_carlo_engine.core.types import (
    ConfidenceInterval,
    RiskMetrics,
    SimulationResult,
    _mean,
    _percentile,
    _stdev,
)


class RiskModelEngine:
    """Calculates comprehensive risk metrics from Monte Carlo simulations."""

    def calculate_risk_metrics(
        self,
        simulations: List[SimulationResult],
        initial_capital: float = 100000.0,
        risk_free_rate: float = 0.05,
    ) -> RiskMetrics:
        if not simulations:
            return RiskMetrics()

        terminal_values = [s.terminal_value for s in simulations]
        total_returns = [s.total_return for s in simulations]
        max_drawdowns = [s.max_drawdown for s in simulations]

        var_90 = self._value_at_risk(terminal_values, initial_capital, 0.90)
        var_95 = self._value_at_risk(terminal_values, initial_capital, 0.95)
        var_99 = self._value_at_risk(terminal_values, initial_capital, 0.99)
        cvar_95 = self._conditional_var(terminal_values, initial_capital, 0.95)
        cvar_99 = self._conditional_var(terminal_values, initial_capital, 0.99)
        avg_dd = _mean(max_drawdowns)
        tail = self._tail_risk(total_returns)
        prob_loss = sum(1 for r in total_returns if r < 0) / len(total_returns) * 100
        prob_preserve = sum(1 for v in terminal_values if v >= initial_capital) / len(terminal_values) * 100
        risk_ruin = self._risk_of_ruin(total_returns)
        ulcer = self._ulcer_index(simulations)

        return RiskMetrics(
            value_at_risk=round(var_95, 4),
            conditional_var=round(cvar_95, 4),
            max_drawdown=round(max(max_drawdowns) if max_drawdowns else 0.0, 4),
            expected_drawdown=round(avg_dd, 4),
            tail_risk=round(tail, 4),
            probability_of_loss=round(prob_loss, 4),
            probability_of_outperformance=round(100 - prob_loss, 4),
            probability_of_capital_preservation=round(prob_preserve, 4),
            risk_of_ruin=round(risk_ruin, 4),
            ulcer_index=round(ulcer, 4),
            var_90=round(var_90, 4),
            var_95=round(var_95, 4),
            var_99=round(var_99, 4),
            cvar_95=round(cvar_95, 4),
            cvar_99=round(cvar_99, 4),
        )

    def calculate_confidence_intervals(
        self,
        simulations: List[SimulationResult],
        levels: List[float],
    ) -> List[ConfidenceInterval]:
        terminal_values = [s.terminal_value for s in simulations]
        if not terminal_values:
            return []
        intervals: List[ConfidenceInterval] = []
        for level in levels:
            alpha = (1 - level) / 2
            lower = _percentile(terminal_values, alpha)
            upper = _percentile(terminal_values, 1 - alpha)
            intervals.append(ConfidenceInterval(
                lower=round(lower, 2),
                upper=round(upper, 2),
                confidence_level=level,
                mean=round(_mean(terminal_values), 2),
                std=round(_stdev(terminal_values), 2),
            ))
        return intervals

    def _value_at_risk(
        self, terminal_values: List[float], initial_capital: float, confidence: float
    ) -> float:
        if not terminal_values:
            return 0.0
        sorted_vals = sorted(terminal_values)
        idx = int(len(sorted_vals) * (1 - confidence))
        idx = max(0, min(idx, len(sorted_vals) - 1))
        var_value = initial_capital - sorted_vals[idx]
        return max(0.0, var_value)

    def _conditional_var(
        self, terminal_values: List[float], initial_capital: float, confidence: float
    ) -> float:
        if not terminal_values:
            return 0.0
        threshold = _percentile(terminal_values, 1 - confidence)
        tail_values = [v for v in terminal_values if v <= threshold]
        if not tail_values:
            return 0.0
        avg_tail = _mean(tail_values)
        return max(0.0, initial_capital - avg_tail)

    def _tail_risk(self, total_returns: List[float]) -> float:
        if not total_returns:
            return 0.0
        sorted_returns = sorted(total_returns)
        n = len(sorted_returns)
        tail_5pct = n // 20
        if tail_5pct == 0:
            return 0.0
        worst = sorted_returns[:tail_5pct]
        return abs(_mean(worst)) if worst else 0.0

    def _risk_of_ruin(self, total_returns: List[float]) -> float:
        if not total_returns:
            return 0.0
        negative_count = sum(1 for r in total_returns if r < 0)
        severe_negative = sum(1 for r in total_returns if r < -30)
        loss_prob = negative_count / len(total_returns)
        severity = severe_negative / len(total_returns) if len(total_returns) > 0 else 0.0
        return min(100.0, loss_prob * severity * 10000)

    def _ulcer_index(self, simulations: List[SimulationResult]) -> float:
        if not simulations:
            return 0.0
        ulcer_values: List[float] = []
        for sim in simulations:
            if not sim.path:
                continue
            peak = sim.path[0]
            sq_dds: List[float] = []
            for v in sim.path:
                if v > peak:
                    peak = v
                if peak > 0:
                    dd = (peak - v) / peak * 100
                    sq_dds.append(dd ** 2)
            if sq_dds:
                ulcer_values.append((sum(sq_dds) / len(sq_dds)) ** 0.5)
        return _mean(ulcer_values) if ulcer_values else 0.0
