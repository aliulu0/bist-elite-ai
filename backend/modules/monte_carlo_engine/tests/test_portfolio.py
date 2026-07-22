import pytest
from modules.monte_carlo_engine.core.types import SimulationResult
from modules.monte_carlo_engine.portfolio.analyzer import PortfolioAnalyzer


class TestPortfolioAnalyzer:
    def setup_method(self):
        self.analyzer = PortfolioAnalyzer()

    def _simulations(self, n=50) -> list:
        sims = []
        for i in range(n):
            path = [100000.0]
            v = 100000.0
            for _ in range(10):
                v *= (1 + (i % 3 - 1) * 0.01)
                path.append(v)
            sims.append(SimulationResult(
                simulation_id=i, path=path, terminal_value=path[-1],
                total_return=(path[-1] / 100000 - 1) * 100,
                max_drawdown=3.0, sharpe_ratio=0.8,
            ))
        return sims

    def test_analyze(self):
        metrics = self.analyzer.analyze(self._simulations())
        assert isinstance(metrics.portfolio_return, float)
        assert isinstance(metrics.portfolio_volatility, float)
        assert isinstance(metrics.sharpe_ratio, float)

    def test_analyze_empty(self):
        metrics = self.analyzer.analyze([])
        assert metrics.portfolio_return == 0.0

    def test_with_weights(self):
        weights = {"TUPRS": 0.5, "THYAO": 0.3, "ASELS": 0.2}
        metrics = self.analyzer.analyze(self._simulations(), weights=weights)
        assert metrics.num_positions == 3
        assert metrics.max_weight == 0.5

    def test_diversification_benefit(self):
        metrics = self.analyzer.analyze(self._simulations())
        assert 0 <= metrics.diversification_benefit <= 1

    def test_sector_concentration(self):
        weights = {"A": 1.0}
        metrics = self.analyzer.analyze(self._simulations(), weights=weights)
        assert metrics.sector_concentration > 0

    def test_liquidity_stress(self):
        metrics = self.analyzer.analyze(self._simulations())
        assert 0 <= metrics.liquidity_stress <= 1

    def test_single_simulation(self):
        sims = [SimulationResult(
            simulation_id=0, path=[100000, 110000],
            terminal_value=110000, total_return=10.0,
            max_drawdown=0.0, sharpe_ratio=1.5,
        )]
        metrics = self.analyzer.analyze(sims)
        assert metrics.portfolio_return != 0
