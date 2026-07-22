from __future__ import annotations

import math
from typing import Dict, List

from modules.monte_carlo_engine.core.types import (
    MarketScenario,
    ScenarioResult,
    SimulationResult,
    _mean,
    _percentile,
    _stdev,
)


class ScenarioGenerator:
    """Generates and evaluates market scenarios for Monte Carlo analysis."""

    SCENARIO_PARAMS: Dict[MarketScenario, Dict[str, float]] = {
        MarketScenario.BULL: {"return_shift": 0.15, "vol_multiplier": 0.8, "prob": 0.25},
        MarketScenario.BEAR: {"return_shift": -0.20, "vol_multiplier": 1.5, "prob": 0.15},
        MarketScenario.SIDEWAYS: {"return_shift": 0.0, "vol_multiplier": 1.0, "prob": 0.20},
        MarketScenario.HIGH_INFLATION: {"return_shift": -0.05, "vol_multiplier": 1.3, "prob": 0.08},
        MarketScenario.HIGH_INTEREST_RATE: {"return_shift": -0.08, "vol_multiplier": 1.2, "prob": 0.08},
        MarketScenario.LOW_LIQUIDITY: {"return_shift": -0.10, "vol_multiplier": 1.8, "prob": 0.05},
        MarketScenario.FLASH_CRASH: {"return_shift": -0.30, "vol_multiplier": 3.0, "prob": 0.02},
        MarketScenario.BLACK_SWAN: {"return_shift": -0.50, "vol_multiplier": 4.0, "prob": 0.01},
        MarketScenario.RECOVERY: {"return_shift": 0.20, "vol_multiplier": 0.7, "prob": 0.16},
    }

    def evaluate_scenarios(
        self,
        simulations: List[SimulationResult],
        scenarios: List[MarketScenario],
    ) -> List[ScenarioResult]:
        if not simulations or not scenarios:
            return []

        terminal_values = [s.terminal_value for s in simulations]
        all_returns = [s.total_return for s in simulations]

        results: List[ScenarioResult] = []
        for scenario in scenarios:
            params = self.SCENARIO_PARAMS.get(scenario, {})
            shift = params.get("return_shift", 0.0)
            vol_mult = params.get("vol_multiplier", 1.0)
            prob = params.get("prob", 0.1)

            shifted_returns = [r + shift * 100 for r in all_returns]
            sim_return = _mean(shifted_returns)
            sim_vol = _stdev(shifted_returns) * vol_mult

            var_val = _percentile(sorted(shifted_returns), 0.05) if shifted_returns else 0.0
            tail = [r for r in shifted_returns if r <= var_val]
            cvar_val = _mean(tail) if tail else var_val

            dd_values = [s.max_drawdown for s in simulations]
            avg_dd = _mean(dd_values) * vol_mult

            impact = self._calculate_impact(sim_return, sim_vol, avg_dd)

            results.append(ScenarioResult(
                scenario=scenario,
                label=scenario.value.replace("_", " ").title(),
                simulated_return=round(sim_return, 4),
                simulated_volatility=round(sim_vol, 4),
                simulated_var=round(abs(var_val), 4),
                simulated_cvar=round(abs(cvar_val), 4),
                simulated_max_drawdown=round(avg_dd, 4),
                probability=round(prob * 100, 2),
                impact_score=round(impact, 4),
            ))
        return results

    def get_scenario_probability(self, scenario: MarketScenario) -> float:
        params = self.SCENARIO_PARAMS.get(scenario, {})
        return params.get("prob", 0.0)

    def get_available_scenarios(self) -> List[MarketScenario]:
        return list(self.SCENARIO_PARAMS.keys())

    def rank_scenarios(
        self, scenario_results: List[ScenarioResult]
    ) -> List[ScenarioResult]:
        return sorted(
            scenario_results,
            key=lambda x: x.impact_score,
            reverse=True,
        )

    def _calculate_impact(
        self, sim_return: float, sim_vol: float, avg_dd: float
    ) -> float:
        return_impact = max(0, -sim_return) / 50.0
        vol_impact = max(0, sim_vol - 20) / 100.0
        dd_impact = max(0, avg_dd - 10) / 50.0
        return min(1.0, return_impact + vol_impact + dd_impact)
