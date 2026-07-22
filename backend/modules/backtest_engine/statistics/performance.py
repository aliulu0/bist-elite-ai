from __future__ import annotations

import math
from typing import Dict, List, Optional

from modules.backtest_engine.core.types import (
    EquityPoint,
    PerformanceMetrics,
    Trade,
    TradeAnalysis,
    TradeExitReason,
)


class PerformanceCalculator:
    """Calculates comprehensive performance metrics from trade and equity data."""

    RISK_FREE_RATE = 0.0
    TRADING_DAYS_PER_YEAR = 252

    def calculate(self, trades: List[Trade], equity_curve: List[EquityPoint]) -> PerformanceMetrics:
        if not equity_curve:
            return PerformanceMetrics()

        wins = [t for t in trades if t.pnl > 0]
        losses = [t for t in trades if t.pnl <= 0]
        total_trades = len(trades)
        winning_trades = len(wins)
        losing_trades = len(losses)

        total_return = self._total_return(equity_curve)
        ann_return = self._annualized_return(equity_curve)
        max_dd = self._max_drawdown(equity_curve)
        sharpe = self._sharpe_ratio(equity_curve)
        sortino = self._sortino_ratio(equity_curve)
        calmar = self._calmar_ratio(ann_return, max_dd)
        win_rate = winning_trades / total_trades * 100 if total_trades > 0 else 0.0
        profit_factor = self._profit_factor(wins, losses)
        avg_gain = sum(t.pnl_pct for t in wins) / len(wins) if wins else 0.0
        avg_loss = sum(t.pnl_pct for t in losses) / len(losses) if losses else 0.0
        expectancy = self._expectancy(win_rate, avg_gain, avg_loss)
        recovery = self._recovery_factor(total_return, max_dd)
        ulcer = self._ulcer_index(equity_curve)
        avg_holding = sum(t.holding_days for t in trades) / total_trades if total_trades > 0 else 0.0
        max_consec_wins = self._max_consecutive(trades, True)
        max_consec_losses = self._max_consecutive(trades, False)

        return PerformanceMetrics(
            total_return=round(total_return, 4),
            annualized_return=round(ann_return, 4),
            max_drawdown=round(max_dd, 4),
            sharpe_ratio=round(sharpe, 4),
            sortino_ratio=round(sortino, 4),
            calmar_ratio=round(calmar, 4),
            win_rate=round(win_rate, 4),
            profit_factor=round(profit_factor, 4),
            average_gain=round(avg_gain, 4),
            average_loss=round(avg_loss, 4),
            expectancy=round(expectancy, 4),
            recovery_factor=round(recovery, 4),
            ulcer_index=round(ulcer, 4),
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            avg_holding_days=round(avg_holding, 2),
            max_consecutive_wins=max_consec_wins,
            max_consecutive_losses=max_consec_losses,
        )

    def analyze_trades(self, trades: List[Trade]) -> TradeAnalysis:
        if not trades:
            return TradeAnalysis()
        total = len(trades)
        avg_holding = sum(t.holding_days for t in trades) / total
        avg_score = sum(t.entry_score for t in trades) / total
        avg_conf = sum(t.entry_confidence for t in trades) / total
        executed = sum(1 for t in trades if t.exit_reason != TradeExitReason.END_OF_DATA)
        false_pos = sum(1 for t in trades if t.pnl < 0 and t.holding_days < 5)
        return TradeAnalysis(
            total_signals=total,
            signals_executed=executed,
            false_positives=false_pos,
            false_negatives=0,
            avg_holding_time=round(avg_holding, 2),
            avg_opportunity_score=round(avg_score, 4),
            avg_confidence=round(avg_conf, 4),
            signal_accuracy=round(executed / total * 100, 4) if total > 0 else 0.0,
        )

    def _total_return(self, curve: List[EquityPoint]) -> float:
        if len(curve) < 2:
            return 0.0
        return (curve[-1].equity - curve[0].equity) / curve[0].equity * 100

    def _annualized_return(self, curve: List[EquityPoint]) -> float:
        if len(curve) < 2:
            return 0.0
        total_ret = (curve[-1].equity / curve[0].equity) if curve[0].equity > 0 else 1.0
        days = len(curve)
        if days <= 0 or total_ret <= 0:
            return 0.0
        years = days / self.TRADING_DAYS_PER_YEAR
        if years <= 0:
            return 0.0
        return (total_ret ** (1 / years) - 1) * 100

    def _max_drawdown(self, curve: List[EquityPoint]) -> float:
        if len(curve) < 2:
            return 0.0
        peak = curve[0].equity
        max_dd = 0.0
        for pt in curve:
            peak = max(peak, pt.equity)
            if peak > 0:
                dd = (peak - pt.equity) / peak * 100
                max_dd = max(max_dd, dd)
        return max_dd

    def _sharpe_ratio(self, curve: List[EquityPoint]) -> float:
        if len(curve) < 3:
            return 0.0
        returns = [
            (curve[i].equity - curve[i - 1].equity) / curve[i - 1].equity
            for i in range(1, len(curve))
            if curve[i - 1].equity > 0
        ]
        if not returns:
            return 0.0
        mean = sum(returns) / len(returns)
        var = sum((r - mean) ** 2 for r in returns) / len(returns)
        std = var ** 0.5
        if std == 0:
            return 0.0
        daily_sharpe = (mean - self.RISK_FREE_RATE / self.TRADING_DAYS_PER_YEAR) / std
        return daily_sharpe * (self.TRADING_DAYS_PER_YEAR ** 0.5)

    def _sortino_ratio(self, curve: List[EquityPoint]) -> float:
        if len(curve) < 3:
            return 0.0
        returns = [
            (curve[i].equity - curve[i - 1].equity) / curve[i - 1].equity
            for i in range(1, len(curve))
            if curve[i - 1].equity > 0
        ]
        if not returns:
            return 0.0
        mean = sum(returns) / len(returns)
        downside = [r for r in returns if r < 0]
        if not downside:
            return 10.0
        downside_var = sum(r ** 2 for r in downside) / len(returns)
        downside_std = downside_var ** 0.5
        if downside_std == 0:
            return 10.0
        daily_sortino = (mean - self.RISK_FREE_RATE / self.TRADING_DAYS_PER_YEAR) / downside_std
        return daily_sortino * (self.TRADING_DAYS_PER_YEAR ** 0.5)

    def _calmar_ratio(self, ann_return: float, max_dd: float) -> float:
        if max_dd == 0:
            return 0.0
        return ann_return / max_dd

    def _profit_factor(self, wins: List[Trade], losses: List[Trade]) -> float:
        gross_profit = sum(t.pnl for t in wins) if wins else 0.0
        gross_loss = abs(sum(t.pnl for t in losses)) if losses else 0.0
        if gross_loss == 0:
            return 10.0 if gross_profit > 0 else 0.0
        return gross_profit / gross_loss

    def _expectancy(self, win_rate: float, avg_gain: float, avg_loss: float) -> float:
        wr = win_rate / 100
        return wr * avg_gain + (1 - wr) * avg_loss

    def _recovery_factor(self, total_return: float, max_dd: float) -> float:
        if max_dd == 0:
            return 0.0
        return total_return / max_dd

    def _ulcer_index(self, curve: List[EquityPoint]) -> float:
        if len(curve) < 2:
            return 0.0
        peak = curve[0].equity
        sq_dds: List[float] = []
        for pt in curve:
            peak = max(peak, pt.equity)
            if peak > 0:
                dd = (peak - pt.equity) / peak * 100
                sq_dds.append(dd ** 2)
        if not sq_dds:
            return 0.0
        return (sum(sq_dds) / len(sq_dds)) ** 0.5

    def _max_consecutive(self, trades: List[Trade], wins: bool) -> int:
        max_c = 0
        current = 0
        for t in trades:
            if (wins and t.pnl > 0) or (not wins and t.pnl <= 0):
                current += 1
                max_c = max(max_c, current)
            else:
                current = 0
        return max_c
