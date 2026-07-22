import pytest
from modules.monte_carlo_engine.core.types import SimulationResult
from modules.monte_carlo_engine.risk_models.models import RiskModelEngine


class TestRiskModelEngine:
    def setup_method(self):
        self.engine = RiskModelEngine()

    def _simulations(self, n=100) -> list:
        sims = []
        for i in range(n):
            path = [100000.0]
            v = 100000.0
            for _ in range(20):
                v *= 1.001
                path.append(v)
            sims.append(SimulationResult(
                simulation_id=i, path=path, terminal_value=path[-1],
                total_return=(path[-1] / 100000 - 1) * 100,
                max_drawdown=2.0, sharpe_ratio=1.0,
            ))
        return sims

    def test_risk_metrics(self):
        sims = self._simulations()
        rm = self.engine.calculate_risk_metrics(sims, 100000.0)
        assert rm.var_95 >= 0
        assert rm.var_99 >= 0
        assert rm.max_drawdown >= 0

    def test_risk_metrics_empty(self):
        rm = self.engine.calculate_risk_metrics([])
        assert rm.value_at_risk == 0.0

    def test_confidence_intervals(self):
        sims = self._simulations()
        cis = self.engine.calculate_confidence_intervals(sims, [0.90, 0.95, 0.99])
        assert len(cis) == 3
        assert cis[0].confidence_level == 0.90

    def test_confidence_intervals_empty(self):
        cis = self.engine.calculate_confidence_intervals([], [0.95])
        assert cis == []

    def test_value_at_risk(self):
        sims = self._simulations()
        rm = self.engine.calculate_risk_metrics(sims, 100000.0)
        assert rm.var_90 <= rm.var_99

    def test_conditional_var(self):
        sims = self._simulations()
        rm = self.engine.calculate_risk_metrics(sims, 100000.0)
        assert rm.cvar_95 >= rm.var_95

    def test_tail_risk(self):
        sims = self._simulations()
        rm = self.engine.calculate_risk_metrics(sims, 100000.0)
        assert rm.tail_risk >= 0

    def test_risk_of_ruin(self):
        sims = self._simulations()
        rm = self.engine.calculate_risk_metrics(sims, 100000.0)
        assert rm.risk_of_ruin >= 0

    def test_ulcer_index(self):
        sims = self._simulations()
        rm = self.engine.calculate_risk_metrics(sims, 100000.0)
        assert rm.ulcer_index >= 0

    def test_probability_of_loss(self):
        sims = self._simulations()
        rm = self.engine.calculate_risk_metrics(sims, 100000.0)
        assert 0 <= rm.probability_of_loss <= 100

    def test_probability_of_preservation(self):
        sims = self._simulations()
        rm = self.engine.calculate_risk_metrics(sims, 100000.0)
        assert 0 <= rm.probability_of_capital_preservation <= 100
