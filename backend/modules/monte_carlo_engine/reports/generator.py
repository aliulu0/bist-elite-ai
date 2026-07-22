from __future__ import annotations

from typing import Any, Dict, List

from modules.monte_carlo_engine.core.types import (
    MonteCarloResult,
    ReportType,
    _mean,
    _median,
    _stdev,
)


class MonteCarloReportGenerator:
    """Generates Monte Carlo simulation reports."""

    def generate(
        self,
        result: MonteCarloResult,
        report_type: ReportType = ReportType.EXECUTIVE,
    ) -> Dict[str, str]:
        generators = {
            ReportType.EXECUTIVE: self._executive_summary,
            ReportType.SIMULATION_SUMMARY: self._simulation_summary,
            ReportType.WORST_CASE: self._worst_case,
            ReportType.BEST_CASE: self._best_case,
            ReportType.EXPECTED_CASE: self._expected_case,
            ReportType.TAIL_RISK: self._tail_risk,
            ReportType.CAPITAL_PRESERVATION: self._capital_preservation,
            ReportType.FULL: self._full_report,
        }
        gen = generators.get(report_type, self._executive_summary)
        return gen(result)

    def generate_all_sections(self, result: MonteCarloResult) -> Dict[str, str]:
        sections: Dict[str, str] = {}
        for rt in ReportType:
            if rt == ReportType.FULL:
                continue
            report = self.generate(result, rt)
            sections[rt.value] = report.get("content", "")
        return sections

    def _executive_summary(self, result: MonteCarloResult) -> Dict[str, str]:
        rm = result.risk_metrics
        pm = result.probability_metrics
        lines = [
            f"=== Monte Carlo Executive Summary: {result.request.symbol} ===",
            f"Method: {result.request.simulation_method.value}",
            f"Simulations: {result.request.num_simulations:,}",
            f"Horizon: {result.request.num_days} days",
            "",
            "--- Simulation Results ---",
            f"Mean Return: {result.mean_return:.2f}%",
            f"Median Return: {result.median_return:.2f}%",
            f"Std Dev: {result.std_return:.2f}%",
            "",
            "--- Risk Metrics ---",
            f"Value at Risk (95%): {rm.var_95:,.2f}",
            f"CVaR (95%): {rm.cvar_95:,.2f}",
            f"Max Drawdown: {rm.max_drawdown:.2f}%",
            f"Expected Drawdown: {rm.expected_drawdown:.2f}%",
            "",
            "--- Probability ---",
            f"Prob of Loss: {pm.prob_loss_5pct:.1f}%",
            f"Prob of Gain >10%: {pm.prob_gain_10pct:.1f}%",
            f"Prob of Doubling: {pm.prob_double:.1f}%",
            f"Capital Preservation: {rm.probability_of_capital_preservation:.1f}%",
            "",
            f"Execution Time: {result.execution_time_ms:.1f}ms",
        ]
        return {"content": "\n".join(lines)}

    def _simulation_summary(self, result: MonteCarloResult) -> Dict[str, str]:
        rm = result.risk_metrics
        lines = [
            f"=== Simulation Summary: {result.request.symbol} ===",
            f"Method: {result.request.simulation_method.value}",
            f"Simulations: {result.request.num_simulations:,}",
            f"Initial Capital: {result.request.initial_capital:,.2f}",
            "",
            f"{'Metric':<30} {'Value':>15}",
            "-" * 46,
            f"{'Mean Return':<30} {result.mean_return:>14.2f}%",
            f"{'Median Return':<30} {result.median_return:>14.2f}%",
            f"{'Std Dev':<30} {result.std_return:>14.2f}%",
            f"{'Worst Case':<30} {result.worst_case_return:>14.2f}%",
            f"{'Best Case':<30} {result.best_case_return:>14.2f}%",
            f"{'Expected Case':<30} {result.expected_case_return:>14.2f}%",
            f"{'VaR 90%':<30} {rm.var_90:>15,.2f}",
            f"{'VaR 95%':<30} {rm.var_95:>15,.2f}",
            f"{'VaR 99%':<30} {rm.var_99:>15,.2f}",
            f"{'CVaR 95%':<30} {rm.cvar_95:>15,.2f}",
            f"{'CVaR 99%':<30} {rm.cvar_99:>15,.2f}",
        ]
        return {"content": "\n".join(lines)}

    def _worst_case(self, result: MonteCarloResult) -> Dict[str, str]:
        worst_sims = sorted(result.simulations, key=lambda s: s.total_return)[:10]
        lines = [
            f"=== Worst Case Analysis: {result.request.symbol} ===",
            "",
            f"{'#':>3} {'Return':>10} {'MaxDD':>10} {'Sharpe':>10} {'Terminal':>15}",
            "-" * 50,
        ]
        for i, sim in enumerate(worst_sims, 1):
            lines.append(
                f"{i:3d} {sim.total_return:10.2f}% {sim.max_drawdown:10.2f}% "
                f"{sim.sharpe_ratio:10.2f} {sim.terminal_value:15,.2f}"
            )
        lines.extend([
            "",
            f"Worst Return: {result.worst_case_return:.2f}%",
            f"Expected Drawdown: {result.risk_metrics.expected_drawdown:.2f}%",
            f"Tail Risk: {result.risk_metrics.tail_risk:.2f}%",
        ])
        return {"content": "\n".join(lines)}

    def _best_case(self, result: MonteCarloResult) -> Dict[str, str]:
        best_sims = sorted(result.simulations, key=lambda s: s.total_return, reverse=True)[:10]
        lines = [
            f"=== Best Case Analysis: {result.request.symbol} ===",
            "",
            f"{'#':>3} {'Return':>10} {'MaxDD':>10} {'Sharpe':>10} {'Terminal':>15}",
            "-" * 50,
        ]
        for i, sim in enumerate(best_sims, 1):
            lines.append(
                f"{i:3d} {sim.total_return:10.2f}% {sim.max_drawdown:10.2f}% "
                f"{sim.sharpe_ratio:10.2f} {sim.terminal_value:15,.2f}"
            )
        lines.extend([
            "",
            f"Best Return: {result.best_case_return:.2f}%",
            f"Prob of Gain >20%: {result.probability_metrics.prob_gain_20pct:.1f}%",
            f"Prob of Doubling: {result.probability_metrics.prob_double:.1f}%",
        ])
        return {"content": "\n".join(lines)}

    def _expected_case(self, result: MonteCarloResult) -> Dict[str, str]:
        pm = result.probability_metrics
        lines = [
            f"=== Expected Case Analysis: {result.request.symbol} ===",
            "",
            f"Expected Return: {result.expected_case_return:.2f}%",
            f"Mean Return: {pm.expected_return:.2f}%",
            f"Median Return: {pm.median_return:.2f}%",
            f"Return Std Dev: {pm.return_std:.2f}%",
            f"Skewness: {pm.skewness:.4f}",
            f"Kurtosis: {pm.kurtosis:.4f}",
            "",
            "--- Confidence Intervals ---",
        ]
        for ci in result.confidence_intervals:
            lines.append(
                f"  {ci.confidence_level*100:.0f}% CI: [{ci.lower:,.2f}, {ci.upper:,.2f}]"
            )
        return {"content": "\n".join(lines)}

    def _tail_risk(self, result: MonteCarloResult) -> Dict[str, str]:
        rm = result.risk_metrics
        pm = result.probability_metrics
        lines = [
            f"=== Tail Risk Report: {result.request.symbol} ===",
            "",
            "--- Value at Risk ---",
            f"VaR (90%):  {rm.var_90:,.2f}",
            f"VaR (95%):  {rm.var_95:,.2f}",
            f"VaR (99%):  {rm.var_99:,.2f}",
            "",
            "--- Conditional VaR ---",
            f"CVaR (95%): {rm.cvar_95:,.2f}",
            f"CVaR (99%): {rm.cvar_99:,.2f}",
            "",
            "--- Tail Probabilities ---",
            f"Prob Loss > 1%:  {pm.prob_loss_1pct:.1f}%",
            f"Prob Loss > 5%:  {pm.prob_loss_5pct:.1f}%",
            f"Prob Loss > 10%: {pm.prob_loss_10pct:.1f}%",
            f"Prob Loss > 20%: {pm.prob_loss_20pct:.1f}%",
            "",
            f"Tail Risk: {rm.tail_risk:.2f}%",
            f"Risk of Ruin: {rm.risk_of_ruin:.4f}%",
            f"Ulcer Index: {rm.ulcer_index:.2f}",
        ]
        return {"content": "\n".join(lines)}

    def _capital_preservation(self, result: MonteCarloResult) -> Dict[str, str]:
        rm = result.risk_metrics
        pm = result.probability_metrics
        initial = result.request.initial_capital
        terminal = result.terminal_values
        above_initial = sum(1 for v in terminal if v >= initial) if terminal else 0
        pct = above_initial / len(terminal) * 100 if terminal else 0
        lines = [
            f"=== Capital Preservation Report: {result.request.symbol} ===",
            f"Initial Capital: {initial:,.2f}",
            "",
            "--- Preservation Statistics ---",
            f"Probability of Preservation: {rm.probability_of_capital_preservation:.1f}%",
            f"Probability of Loss: {rm.probability_of_loss:.1f}%",
            f"Probability of Halving: {pm.prob_halve:.1f}%",
            f"Probability of Doubling: {pm.prob_double:.1f}%",
            "",
            "--- Risk Metrics ---",
            f"VaR (95%): {rm.var_95:,.2f}",
            f"CVaR (95%): {rm.cvar_95:,.2f}",
            f"Max Drawdown: {rm.max_drawdown:.2f}%",
            f"Expected Drawdown: {rm.expected_drawdown:.2f}%",
            f"Risk of Ruin: {rm.risk_of_ruin:.4f}%",
            "",
            "--- Threshold Probabilities ---",
            f"Prob Return > 5%:  {pm.prob_gain_5pct:.1f}%",
            f"Prob Return > 10%: {pm.prob_gain_10pct:.1f}%",
            f"Prob Return > 20%: {pm.prob_gain_20pct:.1f}%",
            f"Prob Return > 50%: {pm.prob_gain_50pct:.1f}%",
        ]
        return {"content": "\n".join(lines)}

    def _full_report(self, result: MonteCarloResult) -> Dict[str, str]:
        all_sections = self.generate_all_sections(result)
        combined = "\n\n".join(all_sections.values())
        all_sections["content"] = combined
        return all_sections
