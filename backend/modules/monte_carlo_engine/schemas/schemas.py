from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class MonteCarloRunRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    strategy: str = Field(default="default")
    start_date: str = Field(default="2020-01-01")
    end_date: str = Field(default="2025-12-31")
    simulation_method: str = Field(default="geometric_brownian_motion")
    num_simulations: int = Field(default=10000, ge=100, le=1000000)
    num_days: int = Field(default=252, ge=1, le=2520)
    initial_capital: float = Field(default=100000.0, gt=0)
    annual_return: float = Field(default=0.12, ge=-1.0, le=5.0)
    annual_volatility: float = Field(default=0.20, ge=0.0, le=5.0)
    risk_free_rate: float = Field(default=0.05, ge=-0.1, le=0.5)
    confidence_levels: List[float] = Field(default=[0.90, 0.95, 0.99])
    scenarios: List[str] = Field(default_factory=list)
    parameters: Dict[str, Any] = Field(default_factory=dict)
    seed: Optional[int] = None
    validation_target: str = Field(default="strategy")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SimulationResultSchema(BaseModel):
    simulation_id: int = 0
    terminal_value: float = 0.0
    total_return: float = 0.0
    max_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    volatility: float = 0.0


class RiskMetricsSchema(BaseModel):
    value_at_risk: float = 0.0
    conditional_var: float = 0.0
    max_drawdown: float = 0.0
    expected_drawdown: float = 0.0
    tail_risk: float = 0.0
    probability_of_loss: float = 0.0
    probability_of_outperformance: float = 0.0
    probability_of_capital_preservation: float = 0.0
    risk_of_ruin: float = 0.0
    ulcer_index: float = 0.0
    var_90: float = 0.0
    var_95: float = 0.0
    var_99: float = 0.0
    cvar_95: float = 0.0
    cvar_99: float = 0.0


class ProbabilityMetricsSchema(BaseModel):
    prob_loss_1pct: float = 0.0
    prob_loss_5pct: float = 0.0
    prob_loss_10pct: float = 0.0
    prob_loss_20pct: float = 0.0
    prob_gain_5pct: float = 0.0
    prob_gain_10pct: float = 0.0
    prob_gain_20pct: float = 0.0
    prob_gain_50pct: float = 0.0
    prob_double: float = 0.0
    prob_halve: float = 0.0
    expected_return: float = 0.0
    median_return: float = 0.0
    return_std: float = 0.0
    skewness: float = 0.0
    kurtosis: float = 0.0


class PortfolioMetricsSchema(BaseModel):
    portfolio_return: float = 0.0
    portfolio_volatility: float = 0.0
    diversification_benefit: float = 0.0
    correlation_impact: float = 0.0
    sector_concentration: float = 0.0
    liquidity_stress: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    num_positions: int = 0
    max_weight: float = 0.0


class ScenarioResultSchema(BaseModel):
    scenario: str
    label: str = ""
    simulated_return: float = 0.0
    simulated_volatility: float = 0.0
    simulated_var: float = 0.0
    simulated_cvar: float = 0.0
    simulated_max_drawdown: float = 0.0
    probability: float = 0.0
    impact_score: float = 0.0


class ConfidenceIntervalSchema(BaseModel):
    lower: float = 0.0
    upper: float = 0.0
    confidence_level: float = 0.95
    mean: float = 0.0
    std: float = 0.0


class MonteCarloResultResponse(BaseModel):
    symbol: str
    strategy: str
    simulation_method: str
    num_simulations: int
    num_days: int
    mean_return: float = 0.0
    median_return: float = 0.0
    std_return: float = 0.0
    worst_case_return: float = 0.0
    best_case_return: float = 0.0
    expected_case_return: float = 0.0
    risk_metrics: RiskMetricsSchema
    probability_metrics: ProbabilityMetricsSchema
    portfolio_metrics: PortfolioMetricsSchema
    scenario_results: List[ScenarioResultSchema] = Field(default_factory=list)
    confidence_intervals: List[ConfidenceIntervalSchema] = Field(default_factory=list)
    execution_time_ms: float = 0.0
    generated_at: str = ""


class MonteCarloListItem(BaseModel):
    symbol: str
    strategy: str
    simulation_method: str
    num_simulations: int
    mean_return: float
    var_95: float
    max_drawdown: float


class MonteCarloListResponse(BaseModel):
    items: List[MonteCarloListItem] = Field(default_factory=list)
    total: int = 0
    generated_at: str = ""


class MonteCarloReportRequest(BaseModel):
    symbol: str = Field(..., min_length=1)
    report_type: str = Field(default="executive")


class MonteCarloReportResponse(BaseModel):
    symbol: str
    report_type: str
    content: str
    generated_at: str
    sections: Dict[str, str] = Field(default_factory=dict)


class BenchmarkResponse(BaseModel):
    operation: str
    iterations: int
    avg_time_ms: float
    min_time_ms: float
    max_time_ms: float
    success: bool


class CacheStatsResponse(BaseModel):
    size: int
    max_size: int
    hits: int
    misses: int
    hit_rate: float
    ttl_seconds: int


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    cache_stats: Optional[CacheStatsResponse] = None


class SummaryResponse(BaseModel):
    total_simulations: int = 0
    avg_return: float = 0.0
    avg_var_95: float = 0.0
    avg_max_drawdown: float = 0.0
    best_symbol: str = ""
    worst_symbol: str = ""
    strategies_used: List[str] = Field(default_factory=list)
