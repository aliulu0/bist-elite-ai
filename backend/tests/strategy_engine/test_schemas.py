import pytest
from modules.strategy_engine.schemas.strategy_schemas import (
    RuleConditionSchema,
    RuleParametersSchema,
    StrategyRuleSchema,
    RuleGroupSchema,
    StrategyDefinitionSchema,
    RuleEvaluationSchema,
    StrategyResultSchema,
    RankedStockSchema,
    RunStrategyRequest,
    RunStrategyResponse,
    CreateStrategyRequest,
    UpdateStrategyRequest,
    StrategyListResponse,
    StrategyTemplatesResponse,
    ValidationRequest,
    ValidationResult,
    BenchmarkRequest,
    BenchmarkResponse,
    StrategyHistoryEntry,
    StrategyHistoryResponse,
)


class TestSchemas:
    def test_rule_condition(self):
        schema = RuleConditionSchema(metric="pe_ratio", operator="lt", value=15.0)
        assert schema.metric == "pe_ratio"
        assert schema.value == 15.0

    def test_rule_parameters(self):
        schema = RuleParametersSchema(weight=2.0, priority=3, confidence=0.9)
        assert schema.weight == 2.0

    def test_strategy_rule(self):
        schema = StrategyRuleSchema(name="test", rule_type="financial")
        assert schema.name == "test"
        assert schema.enabled is True

    def test_rule_group(self):
        schema = RuleGroupSchema(operator="and", rules=[
            StrategyRuleSchema(name="r1"),
        ])
        assert schema.operator == "and"
        assert len(schema.rules) == 1

    def test_strategy_definition(self):
        schema = StrategyDefinitionSchema(
            name="Test",
            strategy_type="value",
            timeframes=["1d"],
        )
        assert schema.name == "Test"

    def test_rule_evaluation(self):
        schema = RuleEvaluationSchema(
            rule_name="test", passed=True, confidence=0.8, weight=1.0,
        )
        assert schema.passed is True

    def test_strategy_result(self):
        schema = StrategyResultSchema(
            strategy_name="Test",
            symbol="THYAO",
            signal="BUY",
            strategy_score=0.7,
            opportunity_score=0.6,
            confidence=0.8,
            risk=0.3,
        )
        assert schema.signal == "BUY"

    def test_ranked_stock(self):
        schema = RankedStockSchema(
            symbol="THYAO",
            strategy_score=0.7,
            opportunity_score=0.6,
            confidence=0.8,
            risk=0.3,
            signal="BUY",
            strategy_name="Test",
        )
        assert schema.symbol == "THYAO"

    def test_run_request(self):
        req = RunStrategyRequest(
            strategy_name="value",
            symbols=["THYAO", "GARAN"],
        )
        assert len(req.symbols) == 2

    def test_run_response(self):
        resp = RunStrategyResponse(
            strategy_name="Test",
            results=[],
            rankings=[],
            summary={},
        )
        assert resp.strategy_name == "Test"

    def test_create_request(self):
        req = CreateStrategyRequest(
            definition=StrategyDefinitionSchema(name="New"),
        )
        assert req.definition.name == "New"

    def test_update_request(self):
        req = UpdateStrategyRequest(
            definition=StrategyDefinitionSchema(name="Updated"),
        )
        assert req.definition.name == "Updated"

    def test_list_response(self):
        resp = StrategyListResponse(strategies=[], count=0)
        assert resp.count == 0

    def test_templates_response(self):
        resp = StrategyTemplatesResponse(templates=[], count=0)
        assert resp.count == 0

    def test_validation_request(self):
        req = ValidationRequest(
            definition=StrategyDefinitionSchema(name="Test"),
        )
        assert req.definition.name == "Test"

    def test_validation_result(self):
        result = ValidationResult(valid=True, errors=[])
        assert result.valid is True

    def test_benchmark_request(self):
        req = BenchmarkRequest(strategy_name="Test", iterations=500)
        assert req.iterations == 500

    def test_benchmark_response(self):
        resp = BenchmarkResponse(
            strategy_name="Test",
            iterations=1000,
            total_seconds=1.0,
            avg_ms=1.0,
            ops_per_second=1000.0,
        )
        assert resp.ops_per_second == 1000.0

    def test_history_entry(self):
        entry = StrategyHistoryEntry(
            strategy_name="Test",
            symbol="THYAO",
            signal="BUY",
            confidence=0.8,
            timestamp="2024-01-01 12:00:00",
        )
        assert entry.signal == "BUY"

    def test_history_response(self):
        resp = StrategyHistoryResponse(entries=[], count=0)
        assert resp.count == 0
