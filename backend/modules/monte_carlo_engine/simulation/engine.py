from __future__ import annotations

import math
import random as _random
from typing import Any, Dict, List, Optional

from modules.monte_carlo_engine.core.types import (
    MonteCarloRequest,
    SimulationConfig,
    SimulationMethod,
    SimulationResult,
    _mean,
    _max_drawdown_from_values,
    _sharpe_from_returns,
    _stdev,
)


class MonteCarloSimulator:
    """Core Monte Carlo simulation engine supporting 8 simulation methods."""

    def simulate(self, config: SimulationConfig) -> List[SimulationResult]:
        methods = {
            SimulationMethod.HISTORICAL_BOOTSTRAP: self._historical_bootstrap,
            SimulationMethod.GEOMETRIC_BROWNIAN_MOTION: self._geometric_brownian_motion,
            SimulationMethod.BLOCK_BOOTSTRAP: self._block_bootstrap,
            SimulationMethod.REGIME_SWITCHING: self._regime_switching,
            SimulationMethod.STUDENT_T: self._student_t,
            SimulationMethod.FAT_TAIL: self._fat_tail,
            SimulationMethod.JUMP_DIFFUSION: self._jump_diffusion,
            SimulationMethod.CUSTOM_PROBABILITY: self._custom_probability,
        }
        method = methods.get(config.method, self._geometric_brownian_motion)
        rng = _random.Random(config.seed) if config.seed is not None else _random.Random()
        return method(config, rng)

    def simulate_from_request(self, request: MonteCarloRequest) -> List[SimulationResult]:
        config = SimulationConfig(
            method=request.simulation_method,
            num_simulations=request.num_simulations,
            num_days=request.num_days,
            initial_capital=request.initial_capital,
            annual_return=request.annual_return,
            annual_volatility=request.annual_volatility,
            risk_free_rate=request.risk_free_rate,
            seed=request.seed,
            parameters=request.parameters,
        )
        return self.simulate(config)

    def _build_result(self, sim_id: int, path: List[float]) -> SimulationResult:
        returns = []
        for i in range(1, len(path)):
            if path[i - 1] > 0:
                returns.append(path[i] / path[i - 1] - 1.0)
        terminal = path[-1] if path else 0.0
        initial = path[0] if path else 1.0
        total_return = (terminal / initial - 1.0) * 100 if initial > 0 else 0.0
        return SimulationResult(
            simulation_id=sim_id,
            path=path,
            terminal_value=terminal,
            total_return=round(total_return, 4),
            max_drawdown=round(_max_drawdown_from_values(path), 4),
            sharpe_ratio=round(_sharpe_from_returns(returns), 4),
            volatility=round(_stdev(returns) * math.sqrt(252) * 100, 4),
        )

    def _geometric_brownian_motion(
        self, config: SimulationConfig, rng: _random.Random
    ) -> List[SimulationResult]:
        results: List[SimulationResult] = []
        mu = config.annual_return / 252
        sigma = config.annual_volatility / math.sqrt(252)
        for i in range(config.num_simulations):
            path = [config.initial_capital]
            value = config.initial_capital
            for _ in range(config.num_days):
                z = rng.gauss(0, 1)
                value *= math.exp((mu - 0.5 * sigma ** 2) + sigma * z)
                path.append(value)
            results.append(self._build_result(i, path))
        return results

    def _historical_bootstrap(
        self, config: SimulationConfig, rng: _random.Random
    ) -> List[SimulationResult]:
        mu = config.annual_return / 252
        sigma = config.annual_volatility / math.sqrt(252)
        historical_returns = self._generate_historical_returns(
            config.num_days * 2, mu, sigma, rng
        )
        results: List[SimulationResult] = []
        for i in range(config.num_simulations):
            sampled_returns = [rng.choice(historical_returns) for _ in range(config.num_days)]
            path = [config.initial_capital]
            value = config.initial_capital
            for r in sampled_returns:
                value *= (1 + r)
                path.append(value)
            results.append(self._build_result(i, path))
        return results

    def _block_bootstrap(
        self, config: SimulationConfig, rng: _random.Random
    ) -> List[SimulationResult]:
        mu = config.annual_return / 252
        sigma = config.annual_volatility / math.sqrt(252)
        block_size = config.parameters.get("block_size", 20)
        if block_size < 2:
            block_size = 2
        historical_returns = self._generate_historical_returns(
            config.num_days * 2, mu, sigma, rng
        )
        results: List[SimulationResult] = []
        for i in range(config.num_simulations):
            path = [config.initial_capital]
            value = config.initial_capital
            blocks_needed = (config.num_days // block_size) + 1
            all_returns: List[float] = []
            for _ in range(blocks_needed):
                start = rng.randint(0, max(0, len(historical_returns) - block_size))
                block = historical_returns[start:start + block_size]
                all_returns.extend(block)
            for r in all_returns[:config.num_days]:
                value *= (1 + r)
                path.append(value)
            results.append(self._build_result(i, path))
        return results

    def _regime_switching(
        self, config: SimulationConfig, rng: _random.Random
    ) -> List[SimulationResult]:
        regimes = config.parameters.get("regimes", [
            {"mu": 0.10 / 252, "sigma": 0.15 / math.sqrt(252), "prob": 0.4},
            {"mu": -0.05 / 252, "sigma": 0.25 / math.sqrt(252), "prob": 0.3},
            {"mu": 0.03 / 252, "sigma": 0.10 / math.sqrt(252), "prob": 0.3},
        ])
        results: List[SimulationResult] = []
        for i in range(config.num_simulations):
            path = [config.initial_capital]
            value = config.initial_capital
            regime = 0
            for _ in range(config.num_days):
                r_val = rng.random()
                cumulative = 0.0
                for idx, reg in enumerate(regimes):
                    cumulative += reg.get("prob", 1.0 / len(regimes))
                    if r_val <= cumulative:
                        regime = idx
                        break
                reg = regimes[regime]
                mu = reg.get("mu", 0.0)
                sigma = reg.get("sigma", 0.1 / math.sqrt(252))
                z = rng.gauss(0, 1)
                value *= math.exp((mu - 0.5 * sigma ** 2) + sigma * z)
                path.append(value)
            results.append(self._build_result(i, path))
        return results

    def _student_t(
        self, config: SimulationConfig, rng: _random.Random
    ) -> List[SimulationResult]:
        df = config.parameters.get("degrees_of_freedom", 5)
        if df < 3:
            df = 3
        mu = config.annual_return / 252
        sigma = config.annual_volatility / math.sqrt(252)
        results: List[SimulationResult] = []
        for i in range(config.num_simulations):
            path = [config.initial_capital]
            value = config.initial_capital
            for _ in range(config.num_days):
                z = self._student_t_sample(df, rng)
                value *= math.exp((mu - 0.5 * sigma ** 2) + sigma * z)
                path.append(value)
            results.append(self._build_result(i, path))
        return results

    def _fat_tail(
        self, config: SimulationConfig, rng: _random.Random
    ) -> List[SimulationResult]:
        mu = config.annual_return / 252
        sigma = config.annual_volatility / math.sqrt(252)
        jump_prob = config.parameters.get("jump_probability", 0.02)
        jump_scale = config.parameters.get("jump_scale", 2.0)
        results: List[SimulationResult] = []
        for i in range(config.num_simulations):
            path = [config.initial_capital]
            value = config.initial_capital
            for _ in range(config.num_days):
                z = rng.gauss(0, 1)
                if rng.random() < jump_prob:
                    z += rng.gauss(0, jump_scale)
                value *= math.exp((mu - 0.5 * sigma ** 2) + sigma * z)
                path.append(value)
            results.append(self._build_result(i, path))
        return results

    def _jump_diffusion(
        self, config: SimulationConfig, rng: _random.Random
    ) -> List[SimulationResult]:
        mu = config.annual_return / 252
        sigma = config.annual_volatility / math.sqrt(252)
        jump_intensity = config.parameters.get("jump_intensity", 0.1)
        jump_mean = config.parameters.get("jump_mean", -0.02)
        jump_std = config.parameters.get("jump_std", 0.05)
        results: List[SimulationResult] = []
        for i in range(config.num_simulations):
            path = [config.initial_capital]
            value = config.initial_capital
            for _ in range(config.num_days):
                z = rng.gauss(0, 1)
                jump = 0.0
                if rng.random() < jump_intensity:
                    jump = rng.gauss(jump_mean, jump_std)
                value *= math.exp((mu - 0.5 * sigma ** 2) + sigma * z + jump)
                path.append(value)
            results.append(self._build_result(i, path))
        return results

    def _custom_probability(
        self, config: SimulationConfig, rng: _random.Random
    ) -> List[SimulationResult]:
        custom_dist = config.parameters.get("distribution", [])
        mu = config.annual_return / 252
        sigma = config.annual_volatility / math.sqrt(252)
        results: List[SimulationResult] = []
        for i in range(config.num_simulations):
            path = [config.initial_capital]
            value = config.initial_capital
            for _ in range(config.num_days):
                if custom_dist:
                    z = rng.choice(custom_dist)
                else:
                    z = rng.gauss(0, 1)
                value *= math.exp((mu - 0.5 * sigma ** 2) + sigma * z)
                path.append(value)
            results.append(self._build_result(i, path))
        return results

    def _generate_historical_returns(
        self, n: int, mu: float, sigma: float, rng: _random.Random
    ) -> List[float]:
        return [rng.gauss(mu, sigma) for _ in range(n)]

    def _student_t_sample(self, df: int, rng: _random.Random) -> float:
        u1 = max(rng.random(), 1e-10)
        u2 = rng.random()
        z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
        chi2 = sum(rng.gauss(0, 1) ** 2 for _ in range(df))
        t_sample = z / math.sqrt(chi2 / df)
        return t_sample * (df / (df - 2)) ** 0.5 if df > 2 else t_sample
