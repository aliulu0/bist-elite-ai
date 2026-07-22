from __future__ import annotations

import time

from modules.strategy_engine.core.types import (
    StrategyDefinition,
    StrategyResult,
    StrategyType,
    StrategyStatus,
    Timeframe,
    RuleGroup,
    RuleOperator,
    RuleCondition,
    ComparisonOp,
    StrategyRule,
    RuleType,
    RuleParameters,
)
from modules.strategy_engine.core.base import BaseStrategy
from modules.strategy_engine.executors.strategy_executor import StrategyExecutor
from modules.strategy_engine.signals.signal_generator import SignalGenerator
from modules.strategy_engine.cache.strategy_cache import StrategyCache
from modules.strategy_engine.registry.strategy_registry import get_registry
from modules.strategy_engine.validators.strategy_validator import StrategyValidator
from modules.strategy_engine.schemas.strategy_schemas import (
    StrategyDefinitionSchema,
    StrategyResultSchema,
    RuleEvaluationSchema,
    RankedStockSchema,
    ValidationResult,
)


class StrategyService:

    def __init__(self) -> None:
        self._registry = get_registry()
        self._executor = StrategyExecutor()
        self._signal_generator = SignalGenerator()
        self._cache = StrategyCache()
        self._history: list[dict] = []

    def list_strategies(self) -> list[StrategyDefinition]:
        return self._registry.list_definitions()

    def get_strategy(self, name: str) -> StrategyDefinition | None:
        return self._registry.get_definition(name)

    def list_templates(self) -> list[StrategyDefinition]:
        return self._registry.list_definitions()

    def run_strategy(
        self,
        strategy_name: str,
        symbols: list[str],
        metrics_map: dict[str, dict],
    ) -> tuple[list[StrategyResult], list[RankedStock], dict]:
        definition = self._registry.get_definition(strategy_name)
        if definition is None:
            raise ValueError(f"Strategy '{strategy_name}' not found")

        if definition.status != StrategyStatus.ACTIVE:
            raise ValueError(f"Strategy '{strategy_name}' is not active (status: {definition.status.value})")

        results: list[StrategyResult] = []
        for symbol in symbols:
            metrics = metrics_map.get(symbol, {})
            if not metrics:
                continue

            cache_key = StrategyCache.make_key(strategy_name, symbol)
            cached = self._cache.get(cache_key)
            if cached is not None:
                results.append(cached)
                continue

            result = self._executor.execute(definition, symbol, metrics)
            self._cache.set(cache_key, result, name=strategy_name)
            results.append(result)

            self._history.append({
                "strategy_name": strategy_name,
                "symbol": symbol,
                "signal": result.signal.value,
                "confidence": result.confidence,
                "timestamp": result.timestamp or time.strftime("%Y-%m-%d %H:%M:%S"),
            })

        rankings = self._signal_generator.rank_stocks(results)

        summary = self._signal_generator.aggregate_signals(results)

        max_results = definition.max_results
        if len(rankings) > max_results:
            rankings = rankings[:max_results]

        return results, rankings, summary

    def create_strategy(self, definition: StrategyDefinition) -> list[str]:
        errors = StrategyValidator.validate_definition(definition)
        if errors:
            return errors

        self._registry.register_definition(definition)
        return []

    def update_strategy(self, definition: StrategyDefinition) -> list[str]:
        errors = StrategyValidator.validate_definition(definition)
        if errors:
            return errors

        self._registry.register_definition(definition)
        return []

    def delete_strategy(self, name: str) -> bool:
        return self._registry.remove(name)

    def validate_strategy(self, definition: StrategyDefinition) -> ValidationResult:
        errors = StrategyValidator.validate_definition(definition)
        return ValidationResult(valid=len(errors) == 0, errors=errors)

    def get_history(
        self,
        strategy_name: str | None = None,
        limit: int = 50,
    ) -> list[dict]:
        entries = self._history
        if strategy_name:
            entries = [e for e in entries if e["strategy_name"] == strategy_name]
        return entries[-limit:]

    def clear_cache(self, strategy_name: str | None = None) -> int:
        if strategy_name:
            return self._cache.invalidate(strategy_name)
        self._cache.clear()
        return 0

    def cache_stats(self) -> dict:
        return self._cache.stats()

    def benchmark(
        self,
        strategy_name: str,
        sample_metrics: dict,
        iterations: int = 1000,
    ) -> dict:
        definition = self._registry.get_definition(strategy_name)
        if definition is None:
            raise ValueError(f"Strategy '{strategy_name}' not found")

        start = time.perf_counter()
        for _ in range(iterations):
            self._executor.execute(definition, "BENCHMARK", sample_metrics)
        elapsed = time.perf_counter() - start

        avg_ms = (elapsed / iterations) * 1000
        ops_per_sec = iterations / elapsed if elapsed > 0 else 0

        return {
            "strategy_name": strategy_name,
            "iterations": iterations,
            "total_seconds": round(elapsed, 4),
            "avg_ms": round(avg_ms, 4),
            "ops_per_second": round(ops_per_sec, 2),
        }

    def convert_to_schema(self, definition: StrategyDefinition) -> StrategyDefinitionSchema:
        return StrategyDefinitionSchema(
            name=definition.name,
            strategy_type=definition.strategy_type.value,
            description=definition.description,
            version=definition.version,
            min_confidence=definition.min_confidence,
            max_results=definition.max_results,
            timeframes=[tf.value for tf in definition.timeframes],
            parameters=definition.parameters,
            status=definition.status.value,
            tags=definition.tags,
            author=definition.author,
        )

    def convert_result_to_schema(self, result: StrategyResult) -> StrategyResultSchema:
        return StrategyResultSchema(
            strategy_name=result.strategy_name,
            symbol=result.symbol,
            signal=result.signal.value,
            strategy_score=result.strategy_score,
            opportunity_score=result.opportunity_score,
            confidence=result.confidence,
            risk=result.risk,
            expected_return=result.expected_return,
            holding_period=result.holding_period,
            triggered_rules=[
                RuleEvaluationSchema(
                    rule_name=e.rule_name,
                    passed=e.passed,
                    confidence=e.confidence,
                    weight=e.weight,
                    value=e.value,
                    expected=e.expected,
                    details=e.details,
                )
                for e in result.triggered_rules
            ],
            failed_rules=[
                RuleEvaluationSchema(
                    rule_name=e.rule_name,
                    passed=e.passed,
                    confidence=e.confidence,
                    weight=e.weight,
                    value=e.value,
                    expected=e.expected,
                    details=e.details,
                )
                for e in result.failed_rules
            ],
            warnings=result.warnings,
            explanations=result.explanations,
            timestamp=result.timestamp,
            timeframe=result.timeframe,
        )

    def convert_ranking_to_schema(self, ranking) -> RankedStockSchema:
        return RankedStockSchema(
            symbol=ranking.symbol,
            strategy_score=ranking.strategy_score,
            opportunity_score=ranking.opportunity_score,
            confidence=ranking.confidence,
            risk=ranking.risk,
            signal=ranking.signal.value,
            strategy_name=ranking.strategy_name,
        )

    def _definition_from_schema(self, schema: StrategyDefinitionSchema) -> StrategyDefinition:
        def convert_group(g) -> RuleGroup:
            rules = []
            for r in g.rules:
                conds = []
                for c in r.conditions:
                    conds.append(RuleCondition(
                        metric=c.metric,
                        operator=ComparisonOp(c.operator),
                        value=c.value,
                        value2=c.value2,
                        tolerance=c.tolerance,
                    ))
                params = r.parameters
                rules.append(StrategyRule(
                    name=r.name,
                    rule_type=RuleType(r.rule_type),
                    conditions=conds,
                    parameters=RuleParameters(
                        weight=params.weight,
                        priority=params.priority,
                        tolerance=params.tolerance,
                        confidence=params.confidence,
                    ),
                    enabled=r.enabled,
                    description=r.description,
                ))
            sub_groups = [convert_group(sg) for sg in g.groups]
            return RuleGroup(
                operator=RuleOperator(g.operator),
                rules=rules,
                groups=sub_groups,
                negate=g.negate,
            )

        rule_groups = [convert_group(g) for g in schema.rule_groups]
        timeframes = [Timeframe(tf) for tf in schema.timeframes]

        return StrategyDefinition(
            name=schema.name,
            strategy_type=StrategyType(schema.strategy_type),
            description=schema.description,
            version=schema.version,
            rule_groups=rule_groups,
            min_confidence=schema.min_confidence,
            max_results=schema.max_results,
            timeframes=timeframes,
            parameters=schema.parameters,
            status=StrategyStatus(schema.status),
            tags=schema.tags,
            author=schema.author,
        )
