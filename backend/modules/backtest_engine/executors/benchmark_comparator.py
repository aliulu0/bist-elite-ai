from __future__ import annotations

from typing import Dict, List, Optional

from modules.backtest_engine.core.types import (
    BenchmarkType,
    EquityPoint,
    PerformanceMetrics,
    PriceBar,
    Signal,
    Trade,
)
from modules.backtest_engine.statistics.performance import PerformanceCalculator


class BenchmarkComparator:
    """Compares backtest results against standard benchmarks."""

    def __init__(self) -> None:
        self.calculator = PerformanceCalculator()

    def compute_buy_and_hold(
        self,
        prices: List[PriceBar],
        initial_capital: float = 100000.0,
    ) -> PerformanceMetrics:
        if len(prices) < 2:
            return PerformanceMetrics()
        entry_price = prices[0].open
        if entry_price <= 0:
            return PerformanceMetrics()
        quantity = initial_capital / entry_price
        equity_curve = [
            EquityPoint(
                timestamp=bar.timestamp,
                equity=round(bar.close * quantity, 2),
            )
            for bar in prices
        ]
        trades = [Trade(
            symbol=prices[0].symbol,
            entry_date=prices[0].timestamp,
            entry_price=entry_price,
            exit_date=prices[-1].timestamp,
            exit_price=prices[-1].close,
            quantity=quantity,
            pnl=round((prices[-1].close - entry_price) * quantity, 2),
            pnl_pct=round((prices[-1].close - entry_price) / entry_price * 100, 4),
            holding_days=len(prices) - 1,
        )]
        return self.calculator.calculate(trades, equity_curve)

    def compute_equal_weight(
        self,
        all_prices: Dict[str, List[PriceBar]],
        initial_capital: float = 100000.0,
    ) -> PerformanceMetrics:
        if not all_prices:
            return PerformanceMetrics()
        n = len(all_prices)
        per_stock = initial_capital / n
        combined_equity: Dict[str, float] = {}
        for sym, bars in all_prices.items():
            if not bars:
                continue
            first_price = bars[0].open
            if first_price <= 0:
                continue
            qty = per_stock / first_price
            for bar in bars:
                combined_equity[bar.timestamp] = combined_equity.get(bar.timestamp, 0) + bar.close * qty

        if not combined_equity:
            return PerformanceMetrics()

        dates = sorted(combined_equity.keys())
        curve = [
            EquityPoint(timestamp=d, equity=round(combined_equity[d], 2))
            for d in dates
        ]
        return self.calculator.calculate([], curve)

    def compare(
        self,
        strategy_metrics: PerformanceMetrics,
        benchmark_metrics: PerformanceMetrics,
    ) -> Dict[str, Any]:
        return {
            "return_diff": round(strategy_metrics.total_return - benchmark_metrics.total_return, 4),
            "sharpe_diff": round(strategy_metrics.sharpe_ratio - benchmark_metrics.sharpe_ratio, 4),
            "drawdown_diff": round(strategy_metrics.max_drawdown - benchmark_metrics.max_drawdown, 4),
            "win_rate_diff": round(strategy_metrics.win_rate - benchmark_metrics.win_rate, 4),
            "strategy_better_return": strategy_metrics.total_return > benchmark_metrics.total_return,
            "strategy_better_sharpe": strategy_metrics.sharpe_ratio > benchmark_metrics.sharpe_ratio,
            "strategy_lower_drawdown": strategy_metrics.max_drawdown < benchmark_metrics.max_drawdown,
        }

    def get_benchmark_prices(
        self,
        benchmark: BenchmarkType,
        all_prices: Dict[str, List[PriceBar]],
    ) -> List[PriceBar]:
        if benchmark == BenchmarkType.BIST100:
            return self._compute_index_proxy(all_prices)
        elif benchmark == BenchmarkType.EQUAL_WEIGHT:
            symbols = list(all_prices.keys())
            if symbols:
                return all_prices[symbols[0]]
            return []
        elif benchmark == BenchmarkType.BUY_AND_HOLD:
            symbols = list(all_prices.keys())
            if symbols:
                return all_prices[symbols[0]]
            return []
        else:
            symbols = list(all_prices.keys())
            if symbols:
                return all_prices[symbols[0]]
            return []

    def _compute_index_proxy(self, all_prices: Dict[str, List[PriceBar]]) -> List[PriceBar]:
        if not all_prices:
            return []
        date_map: Dict[str, List[float]] = {}
        for bars in all_prices.values():
            for bar in bars:
                date_map.setdefault(bar.timestamp, []).append(bar.close)

        result: List[PriceBar] = []
        for date in sorted(date_map.keys()):
            prices_list = date_map[date]
            avg_price = sum(prices_list) / len(prices_list)
            result.append(PriceBar(
                timestamp=date,
                open=avg_price,
                high=avg_price,
                low=avg_price,
                close=avg_price,
                volume=0,
                symbol="BIST100_PROXY",
            ))
        return result


from typing import Any
