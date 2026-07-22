from __future__ import annotations

from typing import List, Optional

from modules.backtest_engine.core.types import (
    PriceBar,
    Signal,
    SignalAction,
    Trade,
    TradeExitReason,
)


class TradeSimulator:
    """Simulates individual trade execution with stop loss and take profit."""

    def __init__(
        self,
        commission_pct: float = 0.001,
        slippage_pct: float = 0.001,
        stop_loss_pct: float = 5.0,
        take_profit_pct: float = 15.0,
        trailing_stop_pct: float = 0.0,
        max_holding_days: int = 252,
    ) -> None:
        self.commission_pct = commission_pct
        self.slippage_pct = slippage_pct
        self.stop_loss_pct = stop_loss_pct
        self.take_profit_pct = take_profit_pct
        self.trailing_stop_pct = trailing_stop_pct
        self.max_holding_days = max_holding_days

    def simulate_entry(
        self,
        signal: Signal,
        bars: List[PriceBar],
        signal_idx: int,
        capital: float,
        position_size_pct: float,
    ) -> Optional[Trade]:
        if signal_idx >= len(bars) - 1:
            return None
        entry_bar = bars[signal_idx + 1]
        entry_price = entry_bar.open * (1 + self.slippage_pct / 100)
        if entry_price <= 0:
            return None
        investment = capital * (position_size_pct / 100)
        commission = investment * self.commission_pct
        net_investment = investment + commission
        quantity = net_investment / entry_price

        return Trade(
            symbol=signal.symbol,
            entry_date=entry_bar.timestamp,
            entry_price=round(entry_price, 4),
            quantity=round(quantity, 4),
            direction=SignalAction.BUY,
            entry_score=signal.score,
            entry_confidence=signal.confidence,
        )

    def simulate_exit(
        self,
        trade: Trade,
        bars: List[PriceBar],
        entry_idx: int,
    ) -> Trade:
        if entry_idx >= len(bars) - 1:
            trade.exit_date = bars[-1].timestamp if bars else ""
            trade.exit_price = bars[-1].close if bars else trade.entry_price
            trade.exit_reason = TradeExitReason.END_OF_DATA
            self._compute_pnl(trade)
            return trade

        peak_price = trade.entry_price
        for i in range(entry_idx + 1, len(bars)):
            bar = bars[i]
            days_held = i - entry_idx
            peak_price = max(peak_price, bar.high)

            mfe = (peak_price - trade.entry_price) / trade.entry_price * 100
            trade.mfe = max(trade.mfe, mfe)

            adverse = (trade.entry_price - bar.low) / trade.entry_price * 100
            trade.mae = max(trade.mae, adverse)

            if self.stop_loss_pct > 0 and adverse >= self.stop_loss_pct:
                trade.exit_price = trade.entry_price * (1 - self.stop_loss_pct / 100)
                trade.exit_date = bar.timestamp
                trade.exit_reason = TradeExitReason.STOP_LOSS
                trade.holding_days = days_held
                self._compute_pnl(trade)
                return trade

            if self.take_profit_pct > 0 and mfe >= self.take_profit_pct:
                trade.exit_price = trade.entry_price * (1 + self.take_profit_pct / 100)
                trade.exit_date = bar.timestamp
                trade.exit_reason = TradeExitReason.TAKE_PROFIT
                trade.holding_days = days_held
                self._compute_pnl(trade)
                return trade

            if self.trailing_stop_pct > 0 and peak_price > trade.entry_price:
                trail_price = peak_price * (1 - self.trailing_stop_pct / 100)
                if bar.low <= trail_price:
                    trade.exit_price = trail_price
                    trade.exit_date = bar.timestamp
                    trade.exit_reason = TradeExitReason.TRAILING_STOP
                    trade.holding_days = days_held
                    self._compute_pnl(trade)
                    return trade

            if days_held >= self.max_holding_days:
                trade.exit_price = bar.close
                trade.exit_date = bar.timestamp
                trade.exit_reason = TradeExitReason.TIME_EXIT
                trade.holding_days = days_held
                self._compute_pnl(trade)
                return trade

        last = bars[-1]
        trade.exit_price = last.close
        trade.exit_date = last.timestamp
        trade.exit_reason = TradeExitReason.END_OF_DATA
        trade.holding_days = len(bars) - 1 - entry_idx
        self._compute_pnl(trade)
        return trade

    def _compute_pnl(self, trade: Trade) -> None:
        gross_pnl = (trade.exit_price - trade.entry_price) * trade.quantity
        exit_value = trade.exit_price * trade.quantity
        commission = exit_value * self.commission_pct
        trade.pnl = round(gross_pnl - commission, 4)
        trade.pnl_pct = round(
            (trade.exit_price - trade.entry_price) / trade.entry_price * 100, 4
        ) if trade.entry_price > 0 else 0.0
