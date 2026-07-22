import pytest
from modules.monte_carlo_engine.core.types import MarketScenario, SimulationResult
from modules.monte_carlo_engine.scenario_generator.generator import ScenarioGenerator


class TestScenarioGenerator:
    def setup_method(self):
        self.gen = ScenarioGenerator()

    def _simulations(self, n=50) -> list:
        sims = []
        for i in range(n):
            sims.append(SimulationResult(
                simulation_id=i, terminal_value=100000 + i * 100,
                total_return=5.0 + i * 0.1, max_drawdown=5.0,
                sharpe_ratio=1.0,
            ))
        return sims

    def test_evaluate_scenarios(self):
        sims = self._simulations()
        results = self.gen.evaluate_scenarios(sims, [MarketScenario.BULL, MarketScenario.BEAR])
        assert len(results) == 2
        assert results[0].scenario == MarketScenario.BULL

    def test_evaluate_empty(self):
        results = self.gen.evaluate_scenarios([], [MarketScenario.BULL])
        assert results == []

    def test_scenario_probability(self):
        prob = self.gen.get_scenario_probability(MarketScenario.BULL)
        assert 0 < prob <= 1

    def test_available_scenarios(self):
        scenarios = self.gen.get_available_scenarios()
        assert len(scenarios) == 9
        assert MarketScenario.FLASH_CRASH in scenarios

    def test_rank_scenarios(self):
        sims = self._simulations()
        results = self.gen.evaluate_scenarios(sims, list(MarketScenario))
        ranked = self.gen.rank_scenarios(results)
        assert len(ranked) == 9
        assert all(ranked[i].impact_score >= ranked[i+1].impact_score for i in range(len(ranked)-1))

    def test_impact_score(self):
        sims = self._simulations()
        results = self.gen.evaluate_scenarios(sims, [MarketScenario.BLACK_SWAN])
        assert results[0].impact_score > 0
