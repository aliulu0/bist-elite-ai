from __future__ import annotations

from pydantic import BaseModel, Field


class RuleConditionSchema(BaseModel):
    metric: str
    operator: str = "gt"
    value: float
    value2: float | None = None
    timeframe: str = "1d"
    tolerance: float = 0.0


class RuleParametersSchema(BaseModel):
    weight: float = 1.0
    priority: int = 0
    tolerance: float = 0.0
    confidence: float = 1.0
    timeframe: str = "1d"


class StrategyRuleSchema(BaseModel):
    name: str
    rule_type: str = "custom"
    conditions: list[RuleConditionSchema] = []
    parameters: RuleParametersSchema = RuleParametersSchema()
    enabled: bool = True
    description: str = ""


class RuleGroupSchema(BaseModel):
    operator: str = "and"
    rules: list[StrategyRuleSchema] = []
    groups: list[RuleGroupSchema] = []
    negate: bool = False


class StrategyDefinitionSchema(BaseModel):
    name: str
    strategy_type: str = "custom"
    description: str = ""
    version: str = "1.0.0"
    rule_groups: list[RuleGroupSchema] = []
    min_confidence: float = 0.5
    max_results: int = 50
    timeframes: list[str] = ["1d"]
    parameters: dict = {}
    status: str = "active"
    tags: list[str] = []
    author: str = ""


class RuleEvaluationSchema(BaseModel):
    rule_name: str
    passed: bool
    confidence: float
    weight: float
    value: float | None = None
    expected: float | None = None
    details: str = ""


class StrategyResultSchema(BaseModel):
    strategy_name: str
    symbol: str
    signal: str
    strategy_score: float
    opportunity_score: float
    confidence: float
    risk: float
    expected_return: float = 0.0
    holding_period: str = ""
    triggered_rules: list[RuleEvaluationSchema] = []
    failed_rules: list[RuleEvaluationSchema] = []
    warnings: list[str] = []
    explanations: list[str] = []
    timestamp: str = ""
    timeframe: str = "1d"


class RankedStockSchema(BaseModel):
    symbol: str
    strategy_score: float
    opportunity_score: float
    confidence: float
    risk: float
    signal: str
    strategy_name: str


class RunStrategyRequest(BaseModel):
    strategy_name: str
    symbols: list[str] = Field(..., min_length=1)
    metrics_map: dict[str, dict] = Field(default_factory=dict)


class RunStrategyResponse(BaseModel):
    strategy_name: str
    results: list[StrategyResultSchema]
    rankings: list[RankedStockSchema]
    summary: dict


class CreateStrategyRequest(BaseModel):
    definition: StrategyDefinitionSchema


class UpdateStrategyRequest(BaseModel):
    definition: StrategyDefinitionSchema


class StrategyListResponse(BaseModel):
    strategies: list[StrategyDefinitionSchema]
    count: int


class StrategyTemplatesResponse(BaseModel):
    templates: list[StrategyDefinitionSchema]
    count: int


class StrategyHistoryEntry(BaseModel):
    strategy_name: str
    symbol: str
    signal: str
    confidence: float
    timestamp: str


class StrategyHistoryResponse(BaseModel):
    entries: list[StrategyHistoryEntry]
    count: int


class ValidationRequest(BaseModel):
    definition: StrategyDefinitionSchema


class ValidationResult(BaseModel):
    valid: bool
    errors: list[str] = []


class BenchmarkRequest(BaseModel):
    strategy_name: str
    iterations: int = 1000


class BenchmarkResponse(BaseModel):
    strategy_name: str
    iterations: int
    total_seconds: float
    avg_ms: float
    ops_per_second: float
