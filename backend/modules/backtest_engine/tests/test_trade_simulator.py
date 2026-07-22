import pytest
from modules.backtest_engine.executors.trade_simulator import TradeSimulator
from modules.backtest_engine.core.types import PriceBar, Signal, SignalAction, TradeExitReason


class TestTradeSimulator:
    def setup_method(self):
        self.sim = TradeSimulator(
            commission_pct=0.001,
            slippage_pct=0.001,
            stop_loss_pct=5.0,
            take_profit_pct=15.0,
        )

    def _make_bars(self, n=20, start_price=100.0):
        bars = []
        price = start_price
        for i in range(n):
            bars.append(PriceBar(
                timestamp=f"2024-01-{i+1:02d}",
                open=price,
                high=price * 1.02,
                low=price * 0.98,
                close=price,
                volume=1000000,
                symbol="TUPRS",
            ))
            price *= 1.01
        return bars

    def test_simulate_entry(self):
        bars = self._make_bars(5)
        signal = Signal(timestamp="2024-01-01", symbol="TUPRS", action=SignalAction.BUY, score=80.0)
        trade = self.sim.simulate_entry(signal, bars, 0, 100000.0, 10.0)
        assert trade is not None
        assert trade.entry_price > 0
        assert trade.quantity > 0

    def test_simulate_entry_out_of_bounds(self):
        bars = self._make_bars(2)
        signal = Signal(timestamp="2024-01-01", symbol="TUPRS", action=SignalAction.BUY, score=80.0)
        trade = self.sim.simulate_entry(signal, bars, 10, 100000.0, 10.0)
        assert trade is None

    def test_simulate_exit_normal(self):
        bars = self._make_bars(10)
        signal = Signal(timestamp="2024-01-01", symbol="TUPRS", action=SignalAction.BUY, score=80.0)
        trade = self.sim.simulate_entry(signal, bars, 0, 100000.0, 10.0)
        assert trade is not None
        trade = self.sim.simulate_exit(trade, bars, 1)
        assert trade.exit_date != ""
        assert trade.exit_price > 0
        assert trade.holding_days >= 0

    def test_stop_loss(self):
        sim = TradeSimulator(stop_loss_pct=2.0, take_profit_pct=100.0)
        bars = []
        price = 100.0
        for i in range(10):
            bars.append(PriceBar(
                timestamp=f"2024-01-{i+1:02d}",
                open=price, high=price, low=price, close=price,
                volume=1000, symbol="TUPRS",
            ))
            if i < 5:
                price *= 0.99
            else:
                price *= 0.95
        signal = Signal(timestamp="2024-01-01", symbol="TUPRS", action=SignalAction.BUY, score=80.0)
        trade = sim.simulate_entry(signal, bars, 0, 100000.0, 10.0)
        trade = sim.simulate_exit(trade, bars, 1)
        assert trade.exit_reason == TradeExitReason.STOP_LOSS

    def test_take_profit(self):
        sim = TradeSimulator(stop_loss_pct=100.0, take_profit_pct=2.0)
        bars = []
        price = 100.0
        for i in range(10):
            bars.append(PriceBar(
                timestamp=f"2024-01-{i+1:02d}",
                open=price, high=price * 1.01, low=price * 0.99, close=price * 1.01,
                volume=1000, symbol="TUPRS",
            ))
            price *= 1.015
        signal = Signal(timestamp="2024-01-01", symbol="TUPRS", action=SignalAction.BUY, score=80.0)
        trade = sim.simulate_entry(signal, bars, 0, 100000.0, 10.0)
        trade = sim.simulate_exit(trade, bars, 1)
        assert trade.exit_reason == TradeExitReason.TAKE_PROFIT

    def test_pnl_computation(self):
        bars = self._make_bars(10)
        signal = Signal(timestamp="2024-01-01", symbol="TUPRS", action=SignalAction.BUY, score=80.0)
        trade = self.sim.simulate_entry(signal, bars, 0, 100000.0, 10.0)
        trade = self.sim.simulate_exit(trade, bars, 1)
        assert trade.pnl != 0 or trade.pnl_pct != 0

    def test_no_stop_no_tp(self):
        sim = TradeSimulator(stop_loss_pct=0, take_profit_pct=0, max_holding_days=5)
        bars = []
        price = 100.0
        for i in range(10):
            bars.append(PriceBar(
                timestamp=f"2024-01-{i+1:02d}",
                open=price, high=price, low=price, close=price,
                volume=1000, symbol="TUPRS",
            ))
            price *= 1.005
        signal = Signal(timestamp="2024-01-01", symbol="TUPRS", action=SignalAction.BUY, score=80.0)
        trade = sim.simulate_entry(signal, bars, 0, 100000.0, 10.0)
        trade = sim.simulate_exit(trade, bars, 1)
        assert trade.exit_reason == TradeExitReason.TIME_EXIT

    def test_mfe_mae_tracking(self):
        bars = []
        for i in range(5):
            bars.append(PriceBar(
                timestamp=f"2024-01-{i+1:02d}",
                open=100, high=110, low=90, close=100,
                volume=1000, symbol="TUPRS",
            ))
        signal = Signal(timestamp="2024-01-01", symbol="TUPRS", action=SignalAction.BUY, score=80.0)
        trade = self.sim.simulate_entry(signal, bars, 0, 100000.0, 10.0)
        trade = self.sim.simulate_exit(trade, bars, 1)
        assert trade.mfe >= 0
        assert trade.mae >= 0
