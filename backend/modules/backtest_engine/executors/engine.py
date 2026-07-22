from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from modules.backtest_engine.core.types import (
    BacktestRequest,
    BacktestResult,
    BenchmarkType,
    EquityPoint,
    MarketPeriod,
    PerformanceMetrics,
    PriceBar,
    Signal,
    SignalAction,
    Trade,
    TradeExitReason,
    classify_market_period,
    classify_trade_quality,
)
from modules.backtest_engine.datasets.manager import DatasetManager
from modules.backtest_engine.executors.trade_simulator import TradeSimulator
from modules.backtest_engine.executors.portfolio_simulator import PortfolioSimulator
from modules.backtest_engine.executors.benchmark_comparator import BenchmarkComparator
from modules.backtest_engine.statistics.performance import PerformanceCalculator


class BacktestEngine:
    """Main orchestrator for running backtests."""

    def __init__(self) -> None:
        self.dataset_manager = DatasetManager()
        self.performance_calc = PerformanceCalculator()
        self.benchmark_comparator = BenchmarkComparator()

    def run(self, request: BacktestRequest) -> BacktestResult:
        start = time.perf_counter()

        price_data = self.dataset_manager.get_data(request.symbol)
        signals = self._generate_signals(request, price_data)

        sim = PortfolioSimulator(
            initial_capital=request.initial_capital,
            max_positions=request.max_positions,
            position_size_pct=request.position_size_pct,
            commission_pct=request.commission_pct,
            slippage_pct=request.slippage_pct,
            stop_loss_pct=request.stop_loss_pct,
            take_profit_pct=request.take_profit_pct,
        )

        trades, equity_curve = sim.run(signals, {request.symbol: price_data})

        metrics = self.performance_calc.calculate(trades, equity_curve)
        trade_analysis = self.performance_calc.analyze_trades(trades)
        portfolio_analysis = sim.get_analysis()

        benchmark_metrics = self._compute_benchmark(request, price_data)
        market_period = self.dataset_manager.detect_market_period(request.symbol)

        execution_ms = (time.perf_counter() - start) * 1000

        return BacktestResult(
            request=request,
            trades=trades,
            equity_curve=equity_curve,
            metrics=metrics,
            trade_analysis=trade_analysis,
            portfolio_analysis=portfolio_analysis,
            benchmark_metrics=benchmark_metrics,
            market_period=market_period,
            execution_time_ms=round(execution_ms, 2),
        )

    def run_multiple(
        self,
        requests: List[BacktestRequest],
    ) -> List[BacktestResult]:
        results: List[BacktestResult] = []
        for req in requests:
            results.append(self.run(req))
        return results

    def compare(
        self,
        results: List[BacktestResult],
    ) -> Dict[str, Any]:
        if not results:
            return {}
        metrics_map = {r.request.symbol: r.metrics for r in results}
        best = max(results, key=lambda r: r.metrics.sharpe_ratio)
        worst = min(results, key=lambda r: r.metrics.sharpe_ratio)
        return {
            "count": len(results),
            "best_performer": best.request.symbol,
            "worst_performer": worst.request.symbol,
            "metrics": {sym: m.__dict__ for sym, m in metrics_map.items()},
            "avg_return": round(sum(m.total_return for m in metrics_map.values()) / len(metrics_map), 4),
            "avg_sharpe": round(sum(m.sharpe_ratio for m in metrics_map.values()) / len(metrics_map), 4),
        }

    def _generate_signals(
        self,
        request: BacktestRequest,
        prices: List[PriceBar],
    ) -> List[Signal]:
        signals: List[Signal] = []
        lookback = 20
        for i in range(lookback, len(prices) - 1):
            window = prices[i - lookback:i + 1]
            sma = sum(b.close for b in window) / len(window)
            momentum = (prices[i].close - prices[i - lookback].close) / prices[i - lookback].close * 100
            rsi = self._compute_rsi(prices, i, 14)

            score = 50.0
            reasons: List[str] = []

            if prices[i].close > sma:
                score += 10
                reasons.append("above_sma")
            if momentum > 5:
                score += 10
                reasons.append("positive_momentum")
            if rsi < 30:
                score += 15
                reasons.append("oversold")
            elif rsi > 70:
                score -= 15
                reasons.append("overbought")
            if prices[i].volume > sum(b.volume for b in window) / len(window) * 1.5:
                score += 5
                reasons.append("volume_surge")

            params = request.parameters
            threshold = params.get("buy_threshold", 65)
            sell_threshold = params.get("sell_threshold", 40)

            if score >= threshold:
                signals.append(Signal(
                    timestamp=prices[i].timestamp,
                    symbol=request.symbol,
                    action=SignalAction.BUY,
                    score=score,
                    confidence=min(score, 100),
                    reason=",".join(reasons),
                ))
            elif score <= sell_threshold and i > lookback + 5:
                signals.append(Signal(
                    timestamp=prices[i].timestamp,
                    symbol=request.symbol,
                    action=SignalAction.SELL,
                    score=score,
                    confidence=min(100 - score, 100),
                    reason=",".join(reasons),
                ))
        return signals

    def _compute_rsi(self, prices: List[PriceBar], idx: int, period: int = 14) -> float:
        if idx < period + 1:
            return 50.0
        gains: List[float] = []
        losses: List[float] = []
        for i in range(idx - period + 1, idx + 1):
            change = prices[i].close - prices[i - 1].close
            if change > 0:
                gains.append(change)
                losses.append(0.0)
            else:
                gains.append(0.0)
                losses.append(abs(change))
        avg_gain = sum(gains) / period if gains else 0.0
        avg_loss = sum(losses) / period if losses else 0.0001
        rs = avg_gain / avg_loss if avg_loss > 0 else 100.0
        return 100.0 - (100.0 / (1.0 + rs))

    def _compute_benchmark(
        self,
        request: BacktestRequest,
        prices: List[PriceBar],
    ) -> PerformanceMetrics:
        return self.benchmark_comparator.compute_buy_and_hold(prices, request.initial_capital)
