import pytest
from modules.monte_carlo_engine.core.types import SimulationConfig, SimulationMethod
from modules.monte_carlo_engine.simulation.engine import MonteCarloSimulator


class TestMonteCarloSimulator:
    def setup_method(self):
        self.sim = MonteCarloSimulator()

    def _config(self, **kwargs) -> SimulationConfig:
        defaults = {"num_simulations": 100, "num_days": 30, "seed": 42}
        defaults.update(kwargs)
        return SimulationConfig(**defaults)

    def test_gbm(self):
        results = self.sim.simulate(self._config(method=SimulationMethod.GEOMETRIC_BROWNIAN_MOTION))
        assert len(results) == 100
        assert all(r.terminal_value > 0 for r in results)

    def test_historical_bootstrap(self):
        results = self.sim.simulate(self._config(method=SimulationMethod.HISTORICAL_BOOTSTRAP))
        assert len(results) == 100

    def test_block_bootstrap(self):
        results = self.sim.simulate(self._config(
            method=SimulationMethod.BLOCK_BOOTSTRAP,
            parameters={"block_size": 5},
        ))
        assert len(results) == 100

    def test_regime_switching(self):
        results = self.sim.simulate(self._config(method=SimulationMethod.REGIME_SWITCHING))
        assert len(results) == 100

    def test_student_t(self):
        results = self.sim.simulate(self._config(
            method=SimulationMethod.STUDENT_T,
            parameters={"degrees_of_freedom": 5},
        ))
        assert len(results) == 100

    def test_fat_tail(self):
        results = self.sim.simulate(self._config(
            method=SimulationMethod.FAT_TAIL,
            parameters={"jump_probability": 0.05, "jump_scale": 2.0},
        ))
        assert len(results) == 100

    def test_jump_diffusion(self):
        results = self.sim.simulate(self._config(
            method=SimulationMethod.JUMP_DIFFUSION,
            parameters={"jump_intensity": 0.1, "jump_mean": -0.02, "jump_std": 0.05},
        ))
        assert len(results) == 100

    def test_custom_probability(self):
        results = self.sim.simulate(self._config(
            method=SimulationMethod.CUSTOM_PROBABILITY,
            parameters={"distribution": [0.5, 1.0, -0.5, 0.0, 1.5]},
        ))
        assert len(results) == 100

    def test_seed_determinism(self):
        r1 = self.sim.simulate(self._config(seed=123))
        r2 = self.sim.simulate(self._config(seed=123))
        assert r1[0].terminal_value == r2[0].terminal_value

    def test_different_seeds(self):
        r1 = self.sim.simulate(self._config(seed=1))
        r2 = self.sim.simulate(self._config(seed=2))
        assert r1[0].terminal_value != r2[0].terminal_value

    def test_simulate_from_request(self):
        from modules.monte_carlo_engine.core.types import MonteCarloRequest
        req = MonteCarloRequest(symbol="TUPRS", num_simulations=50, num_days=20, seed=42)
        results = self.sim.simulate_from_request(req)
        assert len(results) == 50

    def test_result_has_path(self):
        results = self.sim.simulate(self._config())
        assert len(results[0].path) > 0

    def test_result_metrics(self):
        results = self.sim.simulate(self._config())
        r = results[0]
        assert isinstance(r.total_return, float)
        assert isinstance(r.max_drawdown, float)
        assert isinstance(r.sharpe_ratio, float)

    def test_large_simulation(self):
        results = self.sim.simulate(self._config(num_simulations=500, num_days=60))
        assert len(results) == 500
