from __future__ import annotations

import time as _time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from modules.monte_carlo_engine.benchmark.benchmark import MonteCarloBenchmark
from modules.monte_carlo_engine.cache.cache import MonteCarloCache
from modules.monte_carlo_engine.core.types import (
    BenchmarkResult,
    ConfidenceInterval,
    MarketScenario,
    MonteCarloRequest,
    MonteCarloResult,
    PortfolioMetrics,
    ProbabilityMetrics,
    ReportType,
    RiskMetrics,
    ScenarioResult,
    SimulationMethod,
    SimulationResult,
    ValidationTarget,
    _mean,
    _percentile,
    _stdev,
)
from modules.monte_carlo_engine.portfolio.analyzer import PortfolioAnalyzer
from modules.monte_carlo_engine.reports.generator import MonteCarloReportGenerator
from modules.monte_carlo_engine.risk_models.models import RiskModelEngine
from modules.monte_carlo_engine.scenario_generator.generator import ScenarioGenerator
from modules.monte_carlo_engine.simulation.engine import MonteCarloSimulator
from modules.monte_carlo_engine.statistics.metrics import MonteCarloStatistics
from modules.monte_carlo_engine.validators.validator import MonteCarloValidator
from modules.monte_carlo_engine.schemas.schemas import (
    BenchmarkResponse,
    CacheStatsResponse,
    ConfidenceIntervalSchema,
    HealthResponse,
    MonteCarloListItem,
    MonteCarloListResponse,
    MonteCarloResultResponse,
    PortfolioMetricsSchema,
    ProbabilityMetricsSchema,
    RiskMetricsSchema,
    ScenarioResultSchema,
)


class MonteCarloService:
    """Orchestrates all Monte Carlo simulation operations."""

    def __init__(self) -> None:
        self.simulator = MonteCarloSimulator()
        self.risk_engine = RiskModelEngine()
        self.scenario_gen = ScenarioGenerator()
        self.portfolio_analyzer = PortfolioAnalyzer()
        self.statistics = MonteCarloStatistics()
        self.report_gen = MonteCarloReportGenerator()
        self.validator = MonteCarloValidator()
        self.cache = MonteCarloCache()
        self.benchmark = MonteCarloBenchmark()
        self._results: List[MonteCarloResult] = []

    def run_simulation(self, request: MonteCarloRequest) -> MonteCarloResult:
        cache_key = f"{request.symbol}:{request.simulation_method.value}:{request.num_simulations}:{request.num_days}:{request.seed}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            if not any(
                r.request.symbol == request.symbol
                for r in self._results
            ):
                self._results.append(cached)
            return cached

        start = _time.perf_counter()
        result = self._execute_simulation(request)
        result.execution_time_ms = (_time.perf_counter() - start) * 1000
        self.cache.set(cache_key, result)
        self._results.append(result)
        return result

    def get_result(self, symbol: str) -> Optional[MonteCarloResult]:
        for r in reversed(self._results):
            if r.request.symbol == symbol:
                return r
        return None

    def list_results(self) -> List[MonteCarloResult]:
        return list(self._results)

    def generate_report(
        self,
        symbol: str,
        report_type: str = "executive",
    ) -> Dict[str, Any]:
        result = self.get_result(symbol)
        if not result:
            return {"error": f"No Monte Carlo simulation found for {symbol}"}
        rt = ReportType(report_type) if report_type in [e.value for e in ReportType] else ReportType.EXECUTIVE
        report = self.report_gen.generate(result, rt)
        return {
            "symbol": symbol,
            "report_type": report_type,
            "content": report.get("content", ""),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "sections": {k: v for k, v in report.items() if k != "content"},
        }

    def get_scenarios(self) -> List[Dict[str, Any]]:
        scenarios = self.scenario_gen.get_available_scenarios()
        return [
            {"scenario": s.value, "label": s.value.replace("_", " ").title()}
            for s in scenarios
        ]

    def summary(self) -> Dict[str, Any]:
        if not self._results:
            return {
                "total_simulations": 0,
                "avg_return": 0.0,
                "avg_var_95": 0.0,
                "avg_max_drawdown": 0.0,
                "best_symbol": "",
                "worst_symbol": "",
                "strategies_used": [],
            }
        returns = [r.mean_return for r in self._results]
        vars = [r.risk_metrics.var_95 for r in self._results]
        dds = [r.risk_metrics.max_drawdown for r in self._results]
        best = max(self._results, key=lambda r: r.mean_return)
        worst = min(self._results, key=lambda r: r.mean_return)
        strategies = list(set(r.request.strategy for r in self._results))
        return {
            "total_simulations": len(self._results),
            "avg_return": round(_mean(returns), 4),
            "avg_var_95": round(_mean(vars), 4),
            "avg_max_drawdown": round(_mean(dds), 4),
            "best_symbol": best.request.symbol,
            "worst_symbol": worst.request.symbol,
            "strategies_used": strategies,
        }

    def clear_cache(self) -> int:
        return self.cache.clear()

    def cache_stats(self) -> Dict[str, Any]:
        return self.cache.stats()

    def run_engine_benchmark(self, iterations: int = 10) -> BenchmarkResponse:
        def _run():
            req = MonteCarloRequest(
                symbol="TUPRS",
                strategy="benchmark",
                num_simulations=1000,
                num_days=60,
            )
            self._execute_simulation(req)

        result = self.benchmark.run("monte_carlo_execution", _run, iterations=iterations, warmup=2)
        return BenchmarkResponse(
            operation=result.operation,
            iterations=result.iterations,
            avg_time_ms=result.avg_time_ms,
            min_time_ms=result.min_time_ms,
            max_time_ms=result.max_time_ms,
            success=result.success,
        )

    def health_check(self) -> HealthResponse:
        return HealthResponse(
            status="healthy",
            version="1.0.0",
            cache_stats=CacheStatsResponse(**self.cache.stats()),
        )

    def result_to_response(self, result: MonteCarloResult) -> MonteCarloResultResponse:
        return MonteCarloResultResponse(
            symbol=result.request.symbol,
            strategy=result.request.strategy,
            simulation_method=result.request.simulation_method.value,
            num_simulations=result.request.num_simulations,
            num_days=result.request.num_days,
            mean_return=result.mean_return,
            median_return=result.median_return,
            std_return=result.std_return,
            worst_case_return=result.worst_case_return,
            best_case_return=result.best_case_return,
            expected_case_return=result.expected_case_return,
            risk_metrics=RiskMetricsSchema(**result.risk_metrics.__dict__),
            probability_metrics=ProbabilityMetricsSchema(**result.probability_metrics.__dict__),
            portfolio_metrics=PortfolioMetricsSchema(**result.portfolio_metrics.__dict__),
            scenario_results=[
                ScenarioResultSchema(
                    scenario=sc.scenario.value,
                    label=sc.label,
                    simulated_return=sc.simulated_return,
                    simulated_volatility=sc.simulated_volatility,
                    simulated_var=sc.simulated_var,
                    simulated_cvar=sc.simulated_cvar,
                    simulated_max_drawdown=sc.simulated_max_drawdown,
                    probability=sc.probability,
                    impact_score=sc.impact_score,
                )
                for sc in result.scenario_results
            ],
            confidence_intervals=[
                ConfidenceIntervalSchema(**ci.__dict__)
                for ci in result.confidence_intervals
            ],
            execution_time_ms=result.execution_time_ms,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    def _execute_simulation(self, request: MonteCarloRequest) -> MonteCarloResult:
        simulations = self.simulator.simulate_from_request(request)

        terminal_values = [s.terminal_value for s in simulations]
        total_returns = [s.total_return for s in simulations]

        risk_metrics = self.risk_engine.calculate_risk_metrics(
            simulations, request.initial_capital, request.risk_free_rate
        )
        confidence_intervals = self.risk_engine.calculate_confidence_intervals(
            simulations, request.confidence_levels
        )
        probability_metrics = self.statistics.calculate_probability_metrics(
            simulations, request.initial_capital
        )
        portfolio_metrics = self.portfolio_analyzer.analyze(
            simulations, risk_free_rate=request.risk_free_rate
        )

        scenarios = request.scenarios or list(MarketScenario)
        scenario_results = self.scenario_gen.evaluate_scenarios(simulations, scenarios)

        from modules.monte_carlo_engine.core.types import _percentile

        return MonteCarloResult(
            request=request,
            simulations=[SimulationResult(
                simulation_id=s.simulation_id,
                terminal_value=s.terminal_value,
                total_return=s.total_return,
                max_drawdown=s.max_drawdown,
                sharpe_ratio=s.sharpe_ratio,
                volatility=s.volatility,
            ) for s in simulations],
            risk_metrics=risk_metrics,
            probability_metrics=probability_metrics,
            portfolio_metrics=portfolio_metrics,
            scenario_results=scenario_results,
            confidence_intervals=confidence_intervals,
            terminal_values=terminal_values,
            mean_return=round(_mean(total_returns), 4),
            median_return=round(_percentile(total_returns, 0.5), 4),
            std_return=round(_stdev(total_returns), 4),
            worst_case_return=round(min(total_returns), 4) if total_returns else 0.0,
            best_case_return=round(max(total_returns), 4) if total_returns else 0.0,
            expected_case_return=round(_mean(total_returns), 4),
        )

    def _parse_simulation_method(self, value: str) -> SimulationMethod:
        try:
            return SimulationMethod(value)
        except ValueError:
            return SimulationMethod.GEOMETRIC_BROWNIAN_MOTION

    def _parse_validation_target(self, value: str) -> ValidationTarget:
        try:
            return ValidationTarget(value)
        except ValueError:
            return ValidationTarget.STRATEGY

    def _parse_scenarios(self, scenario_values: List[str]) -> List[MarketScenario]:
        scenarios: List[MarketScenario] = []
        for sv in scenario_values:
            try:
                scenarios.append(MarketScenario(sv))
            except ValueError:
                pass
        return scenarios
