from __future__ import annotations

from typing import Any, Dict, List

from modules.walk_forward_engine.core.types import (
    ReportType,
    WalkForwardResult,
    WindowResult,
    _mean,
    _stdev,
    classify_overfitting_severity,
)


class WalkForwardReportGenerator:
    """Generates walk-forward analysis reports."""

    def generate(
        self,
        result: WalkForwardResult,
        report_type: ReportType = ReportType.EXECUTIVE,
    ) -> Dict[str, str]:
        generators = {
            ReportType.EXECUTIVE: self._executive_summary,
            ReportType.OPTIMIZATION: self._optimization_history,
            ReportType.TRAINING: self._training_results,
            ReportType.VALIDATION: self._validation_results,
            ReportType.FAILURE_ANALYSIS: self._failure_analysis,
            ReportType.GENERALIZATION: self._generalization_report,
            ReportType.FULL: self._full_report,
        }
        gen = generators.get(report_type, self._executive_summary)
        return gen(result)

    def generate_all_sections(self, result: WalkForwardResult) -> Dict[str, str]:
        sections: Dict[str, str] = {}
        for rt in ReportType:
            if rt == ReportType.FULL:
                continue
            report = self.generate(result, rt)
            sections[rt.value] = report.get("content", "")
        return sections

    def _executive_summary(self, result: WalkForwardResult) -> Dict[str, str]:
        g = result.generalization
        lines = [
            f"=== Walk Forward Executive Summary: {result.request.symbol} ===",
            f"Period: {result.request.start_date} to {result.request.end_date}",
            f"Strategy: {result.request.strategy}",
            f"Window Mode: {result.request.window_mode.value}",
            f"Train/Test Split: {result.request.train_test_split.value}",
            "",
            "--- Results ---",
            f"Total Windows: {result.total_windows}",
            f"Successful: {result.successful_windows}",
            f"Failed: {result.failed_windows}",
            "",
            "--- Performance ---",
            f"Overall Train Return: {result.overall_train_return:.2f}%",
            f"Overall Test Return: {result.overall_test_return:.2f}%",
            f"Overall Train Sharpe: {result.overall_train_sharpe:.2f}",
            f"Overall Test Sharpe: {result.overall_test_sharpe:.2f}",
            "",
            "--- Generalization ---",
            f"Generalization Score: {g.generalization_score:.4f}",
            f"Overfitting Score: {g.overfitting_score:.4f}",
            f"Robustness Score: {g.robustness_score:.4f}",
            f"Consistency Score: {g.consistency_score:.4f}",
            f"Severity: {g.severity.value}",
            "",
            "--- Recommended Parameters ---",
        ]
        for k, v in result.recommended_parameters.items():
            lines.append(f"  {k}: {v}")
        lines.extend([
            "",
            f"Execution Time: {result.execution_time_ms:.1f}ms",
        ])
        return {"content": "\n".join(lines)}

    def _optimization_history(self, result: WalkForwardResult) -> Dict[str, str]:
        lines = [
            f"=== Optimization History: {result.request.symbol} ===",
            f"Total Windows: {result.total_windows}",
            "",
            f"{'#':>3} {'Train Ret':>10} {'Train SR':>10} {'Score':>10} {'Params':>30}",
            "-" * 65,
        ]
        for wr in result.window_results:
            opt = wr.optimization
            if opt:
                params_str = str(opt.parameters)[:28]
                lines.append(
                    f"{wr.window.index:3d} {opt.train_return:10.2f} "
                    f"{opt.train_sharpe:10.2f} {opt.score:10.4f} "
                    f"{params_str:>30}"
                )
        scores = [wr.optimization.score for wr in result.window_results if wr.optimization]
        if scores:
            lines.extend([
                "",
                f"Best Score: {max(scores):.4f}",
                f"Average Score: {_mean(scores):.4f}",
                f"Score Std Dev: {_stdev(scores):.4f}" if len(scores) > 1 else "",
            ])
        return {"content": "\n".join(lines)}

    def _training_results(self, result: WalkForwardResult) -> Dict[str, str]:
        lines = [
            f"=== Training Results: {result.request.symbol} ===",
            "",
            f"{'#':>3} {'Return':>10} {'Sharpe':>10} {'Drawdown':>10} {'WinRate':>10} {'Trades':>8}",
            "-" * 61,
        ]
        for wr in result.window_results:
            opt = wr.optimization
            if opt:
                lines.append(
                    f"{wr.window.index:3d} {opt.train_return:10.2f} "
                    f"{opt.train_sharpe:10.2f} {opt.train_drawdown:10.2f} "
                    f"{opt.train_win_rate:10.1f} {opt.train_trades:8d}"
                )
        train_returns = [wr.optimization.train_return for wr in result.window_results if wr.optimization]
        if train_returns:
            lines.extend([
                "",
                f"Avg Return: {_mean(train_returns):.2f}%",
                f"Avg Sharpe: {_mean([wr.optimization.train_sharpe for wr in result.window_results if wr.optimization]):.2f}",
            ])
        return {"content": "\n".join(lines)}

    def _validation_results(self, result: WalkForwardResult) -> Dict[str, str]:
        lines = [
            f"=== Validation Results: {result.request.symbol} ===",
            "",
            f"{'#':>3} {'OOS Ret':>10} {'OOS SR':>10} {'OOS DD':>10} {'OOS WR':>10} {'OOS Trades':>10}",
            "-" * 63,
        ]
        for wr in result.window_results:
            val = wr.validation
            if val:
                lines.append(
                    f"{wr.window.index:3d} {val.out_of_sample_return:10.2f} "
                    f"{val.out_of_sample_sharpe:10.2f} {val.out_of_sample_drawdown:10.2f} "
                    f"{val.out_of_sample_win_rate:10.1f} {val.out_of_sample_trades:10d}"
                )
        test_returns = [wr.validation.out_of_sample_return for wr in result.window_results if wr.validation]
        test_sharpes = [wr.validation.out_of_sample_sharpe for wr in result.window_results if wr.validation]
        if test_returns:
            lines.extend([
                "",
                f"Avg OOS Return: {_mean(test_returns):.2f}%",
                f"Avg OOS Sharpe: {_mean(test_sharpes):.2f}",
                f"Std OOS Sharpe: {_stdev(test_sharpes):.2f}" if len(test_sharpes) > 1 else "",
            ])
        return {"content": "\n".join(lines)}

    def _failure_analysis(self, result: WalkForwardResult) -> Dict[str, str]:
        failed = [wr for wr in result.window_results if not wr.success]
        lines = [
            f"=== Failure Analysis: {result.request.symbol} ===",
            f"Total Windows: {result.total_windows}",
            f"Failed Windows: {len(failed)}",
            f"Failure Rate: {len(failed) / result.total_windows * 100:.1f}%" if result.total_windows > 0 else "N/A",
            "",
        ]
        if failed:
            lines.append("Failed Windows:")
            for wr in failed:
                lines.append(
                    f"  Window #{wr.window.index}: {wr.window.train_start} to {wr.window.test_end}"
                    f" — {wr.error_message}"
                )
        else:
            lines.append("No failures detected.")
        negative = [wr for wr in result.window_results if wr.validation and wr.validation.out_of_sample_return < 0]
        if negative:
            lines.extend(["", "Negative OOS Returns:"])
            for wr in negative:
                lines.append(
                    f"  Window #{wr.window.index}: {wr.validation.out_of_sample_return:.2f}%"
                )
        return {"content": "\n".join(lines)}

    def _generalization_report(self, result: WalkForwardResult) -> Dict[str, str]:
        g = result.generalization
        lines = [
            f"=== Generalization Report: {result.request.symbol} ===",
            "",
            "--- Core Scores ---",
            f"Generalization:    {g.generalization_score:.4f}",
            f"Overfitting:       {g.overfitting_score:.4f}",
            f"Robustness:        {g.robustness_score:.4f}",
            f"Consistency:       {g.consistency_score:.4f}",
            "",
            "--- Overfitting Indicators ---",
            f"Parameter Sensitivity:   {g.parameter_sensitivity:.4f}",
            f"Performance Degradation: {g.performance_degradation:.4f}",
            f"Regime Dependency:       {g.regime_dependency:.4f}",
            f"Historical Drift:        {g.historical_drift:.4f}",
            "",
            f"Severity: {g.severity.value}",
            f"Recommendation: {g.recommendation}",
        ]
        if result.regime_performance:
            lines.extend(["", "--- Regime Performance ---"])
            for rp in result.regime_performance:
                lines.append(
                    f"  {rp.regime.value}: Ret={rp.avg_return:.2f}% "
                    f"SR={rp.avg_sharpe:.2f} DD={rp.avg_drawdown:.2f}% "
                    f"WR={rp.avg_win_rate:.1f}% Stability={rp.stability:.4f}"
                )
        return {"content": "\n".join(lines)}

    def _full_report(self, result: WalkForwardResult) -> Dict[str, str]:
        all_sections = self.generate_all_sections(result)
        combined = "\n\n".join(all_sections.values())
        all_sections["content"] = combined
        return all_sections
