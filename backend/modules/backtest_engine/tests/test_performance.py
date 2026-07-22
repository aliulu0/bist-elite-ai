import pytest
from modules.backtest_engine.statistics.performance import PerformanceCalculator
from modules.backtest_engine.core.types import EquityPoint, Trade, TradeExitReason, SignalAction


class TestPerformanceCalculator:
    def setup_method(self):
        self.calc = PerformanceCalculator()

    def _make_curve(self, n=100, start=100000, drift=0.001):
        curve = []
        equity = start
        for i in range(n):
            equity *= (1 + drift)
            curve.append(EquityPoint(timestamp=f"2024-01-{(i%28)+1:02d}", equity=round(equity, 2)))
        return curve

    def _make_trades(self, n=10, win_rate=0.6):
        trades = []
        for i in range(n):
            is_win = (i / n) < win_rate
            pnl = 500.0 if is_win else -300.0
            trades.append(Trade(
                symbol="TUPRS",
                entry_date=f"2024-01-{i+1:02d}",
                entry_price=100.0,
                exit_date=f"2024-01-{i+5:02d}",
                exit_price=100.0 + pnl / 10,
                quantity=10.0,
                pnl=pnl,
                pnl_pct=pnl / 1000 * 100,
                holding_days=5,
                entry_score=75.0,
                entry_confidence=70.0,
            ))
        return trades

    def test_calculate(self):
        curve = self._make_curve()
        trades = self._make_trades()
        m = self.calc.calculate(trades, curve)
        assert m.total_trades == 10
        assert m.winning_trades == 6
        assert m.losing_trades == 4
        assert m.total_return != 0

    def test_empty(self):
        m = self.calc.calculate([], [])
        assert m.total_trades == 0

    def test_max_drawdown(self):
        curve = [
            EquityPoint("d1", 100000),
            EquityPoint("d2", 110000),
            EquityPoint("d3", 95000),
            EquityPoint("d4", 105000),
        ]
        m = self.calc.calculate([], curve)
        assert m.max_drawdown > 0
        assert m.max_drawdown <= 100

    def test_sharpe_ratio(self):
        curve = self._make_curve(200, drift=0.002)
        m = self.calc.calculate([], curve)
        assert m.sharpe_ratio > 0

    def test_sortino_ratio(self):
        curve = self._make_curve(200)
        m = self.calc.calculate([], curve)
        assert m.sortino_ratio >= 0

    def test_win_rate(self):
        trades = self._make_trades(20, win_rate=0.7)
        curve = self._make_curve()
        m = self.calc.calculate(trades, curve)
        assert m.win_rate == 70.0

    def test_profit_factor(self):
        trades = self._make_trades(10, win_rate=0.5)
        curve = self._make_curve()
        m = self.calc.calculate(trades, curve)
        assert m.profit_factor > 0

    def test_analyze_trades(self):
        trades = self._make_trades(10)
        ta = self.calc.analyze_trades(trades)
        assert ta.total_signals == 10
        assert ta.avg_holding_time > 0

    def test_analyze_trades_empty(self):
        ta = self.calc.analyze_trades([])
        assert ta.total_signals == 0

    def test_max_consecutive_wins(self):
        trades = [
            Trade("X", "d1", 100, pnl=100),
            Trade("X", "d2", 100, pnl=100),
            Trade("X", "d3", 100, pnl=-50),
            Trade("X", "d4", 100, pnl=100),
        ]
        curve = self._make_curve()
        m = self.calc.calculate(trades, curve)
        assert m.max_consecutive_wins == 2

    def test_max_consecutive_losses(self):
        trades = [
            Trade("X", "d1", 100, pnl=-50),
            Trade("X", "d2", 100, pnl=-50),
            Trade("X", "d3", 100, pnl=-50),
            Trade("X", "d4", 100, pnl=100),
        ]
        curve = self._make_curve()
        m = self.calc.calculate(trades, curve)
        assert m.max_consecutive_losses == 3

    def test_calmar_ratio(self):
        curve = [
            EquityPoint("d1", 100000),
            EquityPoint("d2", 110000),
            EquityPoint("d3", 95000),
            EquityPoint("d4", 120000),
        ]
        m = self.calc.calculate([], curve)
        assert m.calmar_ratio != 0

    def test_ulcer_index(self):
        curve = self._make_curve(100, drift=-0.001)
        m = self.calc.calculate([], curve)
        assert m.ulcer_index >= 0

    def test_all_metrics_bounded(self):
        curve = self._make_curve(200)
        trades = self._make_trades(20)
        m = self.calc.calculate(trades, curve)
        assert 0 <= m.win_rate <= 100
        assert m.max_drawdown >= 0
        assert m.total_trades == 20
