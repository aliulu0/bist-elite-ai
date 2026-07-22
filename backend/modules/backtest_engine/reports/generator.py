from __future__ import annotations

from typing import Any, Dict, List

from modules.backtest_engine.core.types import (
    BacktestResult,
    EquityPoint,
    PerformanceMetrics,
    ReportType,
    Trade,
    classify_sharpe,
    classify_trade_quality,
)


class ReportGenerator:
    """Generates various backtest report formats."""

    def generate(
        self,
        result: BacktestResult,
        report_type: ReportType = ReportType.EXECUTIVE,
    ) -> Dict[str, str]:
        generators = {
            ReportType.EXECUTIVE: self._executive_summary,
            ReportType.TRADE_LIST: self._trade_list,
            ReportType.PERFORMANCE: self._performance_report,
            ReportType.RISK: self._risk_report,
            ReportType.BENCHMARK: self._benchmark_report,
            ReportType.FULL: self._full_report,
        }
        gen = generators.get(report_type, self._executive_summary)
        return gen(result)

    def generate_all_sections(self, result: BacktestResult) -> Dict[str, str]:
        sections: Dict[str, str] = {}
        for rt in ReportType:
            if rt == ReportType.FULL:
                continue
            report = self.generate(result, rt)
            sections[rt.value] = report.get("content", "")
        return sections

    def _executive_summary(self, result: BacktestResult) -> Dict[str, str]:
        m = result.metrics
        lines = [
            f"=== Executive Summary: {result.request.symbol} ===",
            f"Period: {result.request.start_date} to {result.request.end_date}",
            f"Strategy: {result.request.strategy}",
            f"Market Period: {result.market_period.value}",
            "",
            f"Total Return: {m.total_return:.2f}%",
            f"Annualized Return: {m.annualized_return:.2f}%",
            f"Max Drawdown: {m.max_drawdown:.2f}%",
            f"Sharpe Ratio: {m.sharpe_ratio:.2f} ({classify_sharpe(m.sharpe_ratio)})",
            f"Sortino Ratio: {m.sortino_ratio:.2f}",
            f"Calmar Ratio: {m.calmar_ratio:.2f}",
            "",
            f"Total Trades: {m.total_trades}",
            f"Win Rate: {m.win_rate:.1f}%",
            f"Profit Factor: {m.profit_factor:.2f}",
            f"Expectancy: {m.expectancy:.2f}%",
            f"Avg Holding: {m.avg_holding_days:.0f} days",
            "",
            f"Execution Time: {result.execution_time_ms:.1f}ms",
        ]
        return {"content": "\n".join(lines)}

    def _trade_list(self, result: BacktestResult) -> Dict[str, str]:
        lines = [
            f"=== Trade List: {result.request.symbol} ===",
            f"{'#':>3} {'Entry':>12} {'Exit':>12} {'Entry$':>10} {'Exit$':>10} {'P&L%':>8} {'Days':>5} {'Quality':>10} {'Reason':>15}",
            "-" * 95,
        ]
        for i, t in enumerate(result.trades, 1):
            quality = classify_trade_quality(t)
            lines.append(
                f"{i:3d} {t.entry_date:>12} {t.exit_date:>12} "
                f"{t.entry_price:10.2f} {t.exit_price:10.2f} "
                f"{t.pnl_pct:8.2f} {t.holding_days:5d} "
                f"{quality:>10} {t.exit_reason.value:>15}"
            )
        return {"content": "\n".join(lines)}

    def _performance_report(self, result: BacktestResult) -> Dict[str, str]:
        m = result.metrics
        ta = result.trade_analysis
        lines = [
            f"=== Performance Report: {result.request.symbol} ===",
            "",
            "--- Returns ---",
            f"Total Return:       {m.total_return:>10.2f}%",
            f"Annualized Return:  {m.annualized_return:>10.2f}%",
            "",
            "--- Risk ---",
            f"Max Drawdown:       {m.max_drawdown:>10.2f}%",
            f"Sharpe Ratio:       {m.sharpe_ratio:>10.2f}",
            f"Sortino Ratio:      {m.sortino_ratio:>10.2f}",
            f"Calmar Ratio:       {m.calmar_ratio:>10.2f}",
            f"Ulcer Index:        {m.ulcer_index:>10.2f}",
            "",
            "--- Trade Statistics ---",
            f"Total Trades:       {m.total_trades:>10d}",
            f"Winning Trades:     {m.winning_trades:>10d}",
            f"Losing Trades:      {m.losing_trades:>10d}",
            f"Win Rate:           {m.win_rate:>10.1f}%",
            f"Profit Factor:      {m.profit_factor:>10.2f}",
            f"Average Gain:       {m.average_gain:>10.2f}%",
            f"Average Loss:       {m.average_loss:>10.2f}%",
            f"Expectancy:         {m.expectancy:>10.2f}%",
            f"Recovery Factor:    {m.recovery_factor:>10.2f}",
            "",
            "--- Consecutive ---",
            f"Max Consec Wins:    {m.max_consecutive_wins:>10d}",
            f"Max Consec Losses:  {m.max_consecutive_losses:>10d}",
            "",
            "--- Signal Analysis ---",
            f"Signals Generated:  {ta.total_signals:>10d}",
            f"Signals Executed:   {ta.signals_executed:>10d}",
            f"False Positives:    {ta.false_positives:>10d}",
            f"Signal Accuracy:    {ta.signal_accuracy:>10.1f}%",
            f"Avg Opportunity:    {ta.avg_opportunity_score:>10.2f}",
        ]
        return {"content": "\n".join(lines)}

    def _risk_report(self, result: BacktestResult) -> Dict[str, str]:
        m = result.metrics
        lines = [
            f"=== Risk Report: {result.request.symbol} ===",
            "",
            f"Max Drawdown:     {m.max_drawdown:.2f}%",
            f"Ulcer Index:      {m.ulcer_index:.2f}",
            f"Sortino Ratio:    {m.sortino_ratio:.2f}",
            f"Sharpe Ratio:     {m.sharpe_ratio:.2f}",
            "",
            "--- Drawdown Analysis ---",
        ]
        dd_events = self._analyze_drawdowns(result.equity_curve)
        for dd in dd_events:
            lines.append(f"  {dd['start']} to {dd['end']}: {dd['depth']:.2f}% ({dd['days']} days)")
        if not dd_events:
            lines.append("  No significant drawdowns detected")
        lines.extend([
            "",
            "--- Exit Reasons ---",
        ])
        exit_reasons: Dict[str, int] = {}
        for t in result.trades:
            reason = t.exit_reason.value
            exit_reasons[reason] = exit_reasons.get(reason, 0) + 1
        for reason, count in sorted(exit_reasons.items(), key=lambda x: -x[1]):
            lines.append(f"  {reason}: {count} ({count / m.total_trades * 100:.1f}%)")
        return {"content": "\n".join(lines)}

    def _benchmark_report(self, result: BacktestResult) -> Dict[str, str]:
        m = result.metrics
        bm = result.benchmark_metrics
        lines = [
            f"=== Benchmark Comparison: {result.request.symbol} ===",
            f"Benchmark: {result.request.benchmark.value}",
            "",
            f"{'Metric':<25} {'Strategy':>12} {'Benchmark':>12} {'Diff':>12}",
            "-" * 61,
        ]
        if bm:
            rows = [
                ("Total Return", m.total_return, bm.total_return),
                ("Annualized Return", m.annualized_return, bm.annualized_return),
                ("Max Drawdown", m.max_drawdown, bm.max_drawdown),
                ("Sharpe Ratio", m.sharpe_ratio, bm.sharpe_ratio),
                ("Sortino Ratio", m.sortino_ratio, bm.sortino_ratio),
                ("Win Rate", m.win_rate, bm.win_rate),
            ]
            for name, strat_val, bench_val in rows:
                diff = strat_val - bench_val
                lines.append(f"{name:<25} {strat_val:>12.2f} {bench_val:>12.2f} {diff:>+12.2f}")
        else:
            lines.append("No benchmark data available")
        return {"content": "\n".join(lines)}

    def _full_report(self, result: BacktestResult) -> Dict[str, str]:
        all_sections = self.generate_all_sections(result)
        combined = "\n\n".join(all_sections.values())
        all_sections["content"] = combined
        return all_sections

    def _analyze_drawdowns(self, curve: List[EquityPoint]) -> List[Dict[str, Any]]:
        if len(curve) < 2:
            return []
        events: List[Dict[str, Any]] = []
        peak = curve[0].equity
        peak_idx = 0
        in_dd = False
        dd_start = 0
        dd_depth = 0.0

        for i, pt in enumerate(curve):
            if pt.equity >= peak:
                if in_dd and dd_depth > 1.0:
                    events.append({
                        "start": curve[dd_start].timestamp,
                        "end": pt.timestamp,
                        "depth": round(dd_depth, 2),
                        "days": i - dd_start,
                    })
                peak = pt.equity
                peak_idx = i
                in_dd = False
                dd_depth = 0.0
            else:
                dd = (peak - pt.equity) / peak * 100
                if dd > dd_depth:
                    dd_depth = dd
                if not in_dd:
                    in_dd = True
                    dd_start = peak_idx

        return events[:10]
