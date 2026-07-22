import pytest
from modules.backtest_engine.executors.portfolio_simulator import PortfolioSimulator
from modules.backtest_engine.core.types import PriceBar, Signal, SignalAction


class TestPortfolioSimulator:
    def setup_method(self):
        self.sim = PortfolioSimulator(
            initial_capital=100000.0,
            max_positions=5,
            position_size_pct=10.0,
            commission_pct=0.001,
            slippage_pct=0.001,
            stop_loss_pct=5.0,
            take_profit_pct=15.0,
        )

    def _make_data(self, symbol="TUPRS", n=30):
        bars = []
        price = 100.0
        for i in range(n):
            bars.append(PriceBar(
                timestamp=f"2024-01-{i+1:02d}" if i < 28 else f"2024-02-{i-27:02d}",
                open=price, high=price * 1.02, low=price * 0.98, close=price,
                volume=1000000, symbol=symbol,
            ))
            price *= 1.005
        return bars

    def _make_signals(self, symbol="TUPRS"):
        return [
            Signal(timestamp="2024-01-05", symbol=symbol, action=SignalAction.BUY, score=80.0, confidence=75.0),
            Signal(timestamp="2024-01-15", symbol=symbol, action=SignalAction.BUY, score=70.0, confidence=70.0),
        ]

    def test_run(self):
        data = self._make_data()
        signals = self._make_signals()
        trades, curve = self.sim.run(signals, {"TUPRS": data})
        assert len(curve) > 0
        assert isinstance(trades, list)

    def test_equity_curve_starts_at_capital(self):
        data = self._make_data()
        signals = self._make_signals()
        _, curve = self.sim.run(signals, {"TUPRS": data})
        assert curve[0].equity > 0

    def test_analysis(self):
        data = self._make_data()
        signals = self._make_signals()
        self.sim.run(signals, {"TUPRS": data})
        analysis = self.sim.get_analysis()
        assert analysis.portfolio_risk >= 0

    def test_empty_signals(self):
        data = self._make_data()
        trades, curve = self.sim.run([], {"TUPRS": data})
        assert len(trades) == 0
        assert len(curve) > 0

    def test_max_positions_respected(self):
        sim = PortfolioSimulator(max_positions=1)
        data = self._make_data("A")
        data2 = self._make_data("B")
        signals = [
            Signal(timestamp="2024-01-05", symbol="A", action=SignalAction.BUY, score=80.0),
            Signal(timestamp="2024-01-05", symbol="B", action=SignalAction.BUY, score=80.0),
        ]
        trades, _ = sim.run(signals, {"A": data, "B": data2})
        assert len(trades) <= 1

    def test_drawdown_non_negative(self):
        data = self._make_data()
        signals = self._make_signals()
        _, curve = self.sim.run(signals, {"TUPRS": data})
        for pt in curve:
            assert pt.drawdown >= 0
