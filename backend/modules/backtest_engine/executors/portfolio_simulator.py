from __future__ import annotations

import math
from typing import Dict, List, Optional

from modules.backtest_engine.core.types import (
    EquityPoint,
    PortfolioAnalysis,
    PriceBar,
    Signal,
    SignalAction,
    Trade,
    TradeExitReason,
)
from modules.backtest_engine.executors.trade_simulator import TradeSimulator


class PortfolioSimulator:
    """Simulates portfolio-level execution with position management."""

    def __init__(
        self,
        initial_capital: float = 100000.0,
        max_positions: int = 10,
        position_size_pct: float = 10.0,
        commission_pct: float = 0.001,
        slippage_pct: float = 0.001,
        stop_loss_pct: float = 5.0,
        take_profit_pct: float = 15.0,
    ) -> None:
        self.initial_capital = initial_capital
        self.max_positions = max_positions
        self.position_size_pct = position_size_pct
        self.simulator = TradeSimulator(
            commission_pct=commission_pct,
            slippage_pct=slippage_pct,
            stop_loss_pct=stop_loss_pct,
            take_profit_pct=take_profit_pct,
        )
        self._trades: List[Trade] = []
        self._equity_curve: List[EquityPoint] = []
        self._open_positions: Dict[str, Trade] = {}
        self._cash = initial_capital
        self._peak_equity = initial_capital

    def run(
        self,
        signals: List[Signal],
        price_data: Dict[str, List[PriceBar]],
    ) -> tuple:
        self._trades = []
        self._equity_curve = []
        self._open_positions = {}
        self._cash = self.initial_capital
        self._peak_equity = self.initial_capital

        all_dates = self._collect_dates(price_data)
        signal_map = self._build_signal_map(signals)

        for date in all_dates:
            self._process_exits(date, price_data)
            self._process_entries(date, signal_map, price_data)
            equity = self._compute_equity(date, price_data)
            dd = (self._peak_equity - equity) / self._peak_equity * 100 if self._peak_equity > 0 else 0.0
            dd = max(0.0, dd)
            self._peak_equity = max(self._peak_equity, equity)
            self._equity_curve.append(EquityPoint(
                timestamp=date,
                equity=round(equity, 2),
                drawdown=round(dd, 2),
            ))

        self._close_all_positions(all_dates[-1] if all_dates else "", price_data)
        return self._trades, self._equity_curve

    def get_analysis(self) -> PortfolioAnalysis:
        total_exposure = sum(
            t.quantity * t.entry_price for t in self._open_positions.values()
        )
        turnover = sum(abs(t.pnl) for t in self._trades) / self.initial_capital if self.initial_capital > 0 else 0.0
        cash_pct = self._cash / self._compute_current_equity_value() * 100 if self._compute_current_equity_value() > 0 else 100.0
        return PortfolioAnalysis(
            portfolio_return=self._total_return_pct(),
            portfolio_risk=self._portfolio_risk(),
            sector_distribution={},
            cash_utilization=round(max(0, 100 - cash_pct), 2),
            exposure=round(total_exposure / self.initial_capital * 100, 2) if self.initial_capital > 0 else 0.0,
            turnover=round(turnover, 4),
            diversification_ratio=self._diversification_ratio(),
        )

    def _collect_dates(self, price_data: Dict[str, List[PriceBar]]) -> List[str]:
        dates: set = set()
        for bars in price_data.values():
            for bar in bars:
                dates.add(bar.timestamp)
        return sorted(dates)

    def _build_signal_map(self, signals: List[Signal]) -> Dict[str, List[Signal]]:
        result: Dict[str, List[Signal]] = {}
        for s in signals:
            result.setdefault(s.timestamp, []).append(s)
        return result

    def _process_exits(self, date: str, price_data: Dict[str, List[PriceBar]]) -> None:
        to_close: List[str] = []
        for sym, trade in self._open_positions.items():
            bars = price_data.get(sym, [])
            bar_idx = self._find_bar_index(bars, date)
            if bar_idx < 0:
                continue
            bar = bars[bar_idx]
            days_held = bar_idx - self._find_bar_index(bars, trade.entry_date)
            if days_held <= 0:
                days_held = 1

            pnl_pct = (bar.close - trade.entry_price) / trade.entry_price * 100 if trade.entry_price > 0 else 0

            if self.simulator.stop_loss_pct > 0 and pnl_pct <= -self.simulator.stop_loss_pct:
                trade.exit_price = bar.close
                trade.exit_date = date
                trade.exit_reason = TradeExitReason.STOP_LOSS
                trade.holding_days = days_held
                self._close_trade(trade)
                to_close.append(sym)
            elif self.simulator.take_profit_pct > 0 and pnl_pct >= self.simulator.take_profit_pct:
                trade.exit_price = bar.close
                trade.exit_date = date
                trade.exit_reason = TradeExitReason.TAKE_PROFIT
                trade.holding_days = days_held
                self._close_trade(trade)
                to_close.append(sym)

        for sym in to_close:
            del self._open_positions[sym]

    def _process_entries(self, date: str, signal_map: Dict[str, List[Signal]], price_data: Dict[str, List[PriceBar]]) -> None:
        day_signals = signal_map.get(date, [])
        buy_signals = [s for s in day_signals if s.action == SignalAction.BUY]
        for sig in buy_signals:
            if len(self._open_positions) >= self.max_positions:
                break
            if sig.symbol in self._open_positions:
                continue
            bars = price_data.get(sig.symbol, [])
            bar_idx = self._find_bar_index(bars, date)
            if bar_idx < 0 or bar_idx >= len(bars) - 1:
                continue
            available = self._cash * (self.position_size_pct / 100)
            if available <= 0:
                continue
            entry_price = bars[bar_idx + 1].open * (1 + self.simulator.slippage_pct / 100)
            if entry_price <= 0:
                continue
            commission = available * self.simulator.commission_pct
            quantity = (available - commission) / entry_price
            trade = Trade(
                symbol=sig.symbol,
                entry_date=bars[bar_idx + 1].timestamp,
                entry_price=round(entry_price, 4),
                quantity=round(quantity, 4),
                direction=SignalAction.BUY,
                entry_score=sig.score,
                entry_confidence=sig.confidence,
            )
            self._open_positions[sig.symbol] = trade
            self._cash -= available

    def _close_trade(self, trade: Trade) -> None:
        gross_pnl = (trade.exit_price - trade.entry_price) * trade.quantity
        exit_commission = trade.exit_price * trade.quantity * self.simulator.commission_pct
        trade.pnl = round(gross_pnl - exit_commission, 4)
        trade.pnl_pct = round(
            (trade.exit_price - trade.entry_price) / trade.entry_price * 100, 4
        ) if trade.entry_price > 0 else 0.0
        self._cash += trade.exit_price * trade.quantity
        self._trades.append(trade)

    def _close_all_positions(self, last_date: str, price_data: Dict[str, List[PriceBar]]) -> None:
        for sym, trade in list(self._open_positions.items()):
            bars = price_data.get(sym, [])
            if bars:
                trade.exit_price = bars[-1].close
                trade.exit_date = bars[-1].timestamp
            else:
                trade.exit_price = trade.entry_price
                trade.exit_date = last_date
            trade.exit_reason = TradeExitReason.END_OF_DATA
            trade.holding_days = max(1, len(bars) - 1) if bars else 1
            self._close_trade(trade)
        self._open_positions.clear()

    def _compute_equity(self, date: str, price_data: Dict[str, List[PriceBar]]) -> float:
        equity = self._cash
        for sym, trade in self._open_positions.items():
            bars = price_data.get(sym, [])
            bar_idx = self._find_bar_index(bars, date)
            if bar_idx >= 0:
                equity += bars[bar_idx].close * trade.quantity
            else:
                equity += trade.entry_price * trade.quantity
        return equity

    def _compute_current_equity_value(self) -> float:
        return self._cash + sum(
            t.entry_price * t.quantity for t in self._open_positions.values()
        )

    def _find_bar_index(self, bars: List[PriceBar], date: str) -> int:
        for i, bar in enumerate(bars):
            if bar.timestamp == date:
                return i
        return -1

    def _total_return_pct(self) -> float:
        if not self._equity_curve:
            return 0.0
        final = self._equity_curve[-1].equity
        return round((final - self.initial_capital) / self.initial_capital * 100, 4)

    def _portfolio_risk(self) -> float:
        if len(self._equity_curve) < 2:
            return 0.0
        returns = [
            (self._equity_curve[i].equity - self._equity_curve[i - 1].equity)
            / self._equity_curve[i - 1].equity
            for i in range(1, len(self._equity_curve))
            if self._equity_curve[i - 1].equity > 0
        ]
        if not returns:
            return 0.0
        mean = sum(returns) / len(returns)
        var = sum((r - mean) ** 2 for r in returns) / len(returns)
        return round((var ** 0.5) * (252 ** 0.5) * 100, 4)

    def _diversification_ratio(self) -> float:
        if not self._open_positions:
            return 1.0
        return round(min(1.0, len(self._open_positions) / self.max_positions), 4)
