from __future__ import annotations

import math
from typing import Dict, List

from modules.monte_carlo_engine.core.types import (
    PortfolioMetrics,
    SimulationResult,
    _mean,
    _sharpe_from_returns,
    _sortino_from_returns,
    _stdev,
)


class PortfolioAnalyzer:
    """Analyzes portfolio-level metrics from Monte Carlo simulations."""

    def analyze(
        self,
        simulations: List[SimulationResult],
        weights: Dict[str, float] = None,
        risk_free_rate: float = 0.05,
    ) -> PortfolioMetrics:
        if not simulations:
            return PortfolioMetrics()

        all_returns: List[float] = []
        for sim in simulations:
            if len(sim.path) >= 2 and sim.path[0] > 0:
                all_returns.append(sim.path[-1] / sim.path[0] - 1.0)

        terminal_values = [s.terminal_value for s in simulations]
        portfolio_return = _mean(all_returns) * 100 if all_returns else 0.0
        portfolio_vol = _stdev(all_returns) * 100 if all_returns else 0.0
        sharpe = _sharpe_from_returns(all_returns, risk_free_rate) if all_returns else 0.0
        sortino = _sortino_from_returns(all_returns, risk_free_rate) if all_returns else 0.0

        weights = weights or {}
        num_positions = len(weights) if weights else 1
        max_weight = max(weights.values()) if weights else 1.0
        concentration = self._sector_concentration(weights)
        div_benefit = self._diversification_benefit(simulations)
        corr_impact = self._correlation_impact(weights)
        liq_stress = self._liquidity_stress(simulations)

        return PortfolioMetrics(
            portfolio_return=round(portfolio_return, 4),
            portfolio_volatility=round(portfolio_vol, 4),
            diversification_benefit=round(div_benefit, 4),
            correlation_impact=round(corr_impact, 4),
            sector_concentration=round(concentration, 4),
            liquidity_stress=round(liq_stress, 4),
            sharpe_ratio=round(sharpe, 4),
            sortino_ratio=round(sortino, 4),
            num_positions=num_positions,
            max_weight=round(max_weight, 4),
            weights=weights,
        )

    def _sector_concentration(self, weights: Dict[str, float] = None) -> float:
        if not weights:
            return 0.0
        vals = list(weights.values())
        if not vals:
            return 0.0
        total = sum(abs(v) for v in vals)
        if total == 0:
            return 0.0
        normalized = [abs(v) / total for v in vals]
        hhi = sum(w ** 2 for w in normalized)
        max_hhi = 1.0
        if len(normalized) > 1:
            equal_hhi = 1.0 / len(normalized)
            max_hhi = 1.0
        return min(1.0, hhi)

    def _diversification_benefit(self, simulations: List[SimulationResult]) -> float:
        if len(simulations) < 2:
            return 0.0
        individual_vols = []
        for sim in simulations:
            if len(sim.path) >= 2 and sim.path[0] > 0:
                ret = sim.path[-1] / sim.path[0] - 1.0
                individual_vols.append(abs(ret))
        if not individual_vols:
            return 0.0
        avg_individual_vol = _stdev(individual_vols) if len(individual_vols) > 1 else 0.0
        terminal_values = [s.terminal_value for s in simulations]
        portfolio_vol = _stdev(terminal_values) if len(terminal_values) > 1 else 0.0
        if avg_individual_vol == 0:
            return 0.0
        benefit = 1.0 - (portfolio_vol / (avg_individual_vol * len(simulations) + 1e-10))
        return max(0.0, min(1.0, benefit))

    def _correlation_impact(self, weights: Dict[str, float] = None) -> float:
        if not weights or len(weights) < 2:
            return 0.0
        vals = list(weights.values())
        mean_w = _mean(vals)
        std_w = _stdev(vals) if len(vals) > 1 else 0.0
        if mean_w == 0:
            return 0.0
        return min(1.0, std_w / abs(mean_w)) if mean_w != 0 else 0.0

    def _liquidity_stress(self, simulations: List[SimulationResult]) -> float:
        if not simulations:
            return 0.0
        dd_values = [s.max_drawdown for s in simulations if s.max_drawdown > 0]
        if not dd_values:
            return 0.0
        avg_dd = _mean(dd_values)
        severe = sum(1 for d in dd_values if d > 20) / len(dd_values) if dd_values else 0.0
        return min(1.0, (avg_dd / 50.0 + severe) / 2.0)
