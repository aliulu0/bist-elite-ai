from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyDefinition,
    StrategyResult,
    StrategyRule,
    RuleGroup,
    RuleOperator,
    RuleEvaluation,
    GroupEvaluation,
    SignalType,
)
from modules.strategy_engine.rules.rule_engine import RuleEngine


class StrategyExecutor:

    def __init__(self) -> None:
        self._rule_engine = RuleEngine()

    def execute(
        self,
        definition: StrategyDefinition,
        symbol: str,
        metrics: dict,
        **kwargs,
    ) -> StrategyResult:
        group_evals: list[GroupEvaluation] = []
        for group in definition.rule_groups:
            group_evals.append(self._rule_engine.evaluate_group(group, metrics))

        triggered: list[RuleEvaluation] = []
        failed: list[RuleEvaluation] = []
        for ge in group_evals:
            t, f = self._rule_engine.collect_rule_evals(ge)
            triggered.extend(t)
            failed.extend(f)

        all_passed = all(ge.result for ge in group_evals) if group_evals else False
        strategy_score = self._rule_engine.calculate_weighted_score(triggered, failed)
        confidence = self._calculate_confidence(triggered, failed, definition)
        risk = self._calculate_risk(failed, definition)
        signal = self._determine_signal(strategy_score, confidence, definition)

        opportunity_score = self._calculate_opportunity_score(
            strategy_score, confidence, risk,
        )

        explanations = self._build_explanations(
            definition, triggered, failed, all_passed,
        )

        warnings = self._build_warnings(failed, definition)

        return StrategyResult(
            strategy_name=definition.name,
            symbol=symbol,
            signal=signal,
            strategy_score=strategy_score,
            opportunity_score=opportunity_score,
            confidence=confidence,
            risk=risk,
            triggered_rules=triggered,
            failed_rules=failed,
            warnings=warnings,
            explanations=explanations,
            timeframe=definition.timeframes[0].value if definition.timeframes else "1d",
        )

    def execute_batch(
        self,
        definition: StrategyDefinition,
        symbols: list[str],
        metrics_map: dict[str, dict],
    ) -> list[StrategyResult]:
        results = []
        for symbol in symbols:
            metrics = metrics_map.get(symbol, {})
            if metrics:
                results.append(self.execute(definition, symbol, metrics))
        return results

    def _calculate_confidence(
        self,
        triggered: list[RuleEvaluation],
        failed: list[RuleEvaluation],
        definition: StrategyDefinition,
    ) -> float:
        total = triggered + failed
        if not total:
            return 0.0

        total_weight = sum(e.weight for e in total)
        if total_weight == 0:
            return 0.0

        weighted_conf = sum(
            e.confidence * e.weight for e in triggered
        )
        return min(1.0, weighted_conf / total_weight)

    def _calculate_risk(
        self,
        failed: list[RuleEvaluation],
        definition: StrategyDefinition,
    ) -> float:
        if not failed:
            return 0.1

        risk_score = min(1.0, len(failed) / max(1, len(failed) + 5))
        high_priority = sum(
            1 for e in failed
            if e.rule_name in ("max_drawdown", "volatility", "value_at_risk")
        )
        risk_score += high_priority * 0.1
        return min(1.0, risk_score)

    def _determine_signal(
        self,
        strategy_score: float,
        confidence: float,
        definition: StrategyDefinition,
    ) -> SignalType:
        combined = strategy_score * 0.6 + confidence * 0.4
        min_conf = definition.min_confidence

        if confidence < min_conf:
            return SignalType.WAIT

        if combined >= 0.8:
            return SignalType.STRONG_BUY
        elif combined >= 0.5:
            return SignalType.BUY
        elif combined >= 0.3:
            return SignalType.NEUTRAL
        elif combined >= 0.1:
            return SignalType.SELL
        else:
            return SignalType.STRONG_SELL

    def _calculate_opportunity_score(
        self,
        strategy_score: float,
        confidence: float,
        risk: float,
    ) -> float:
        return max(0.0, min(1.0, strategy_score * confidence * (1.0 - risk * 0.5)))

    def _build_explanations(
        self,
        definition: StrategyDefinition,
        triggered: list[RuleEvaluation],
        failed: list[RuleEvaluation],
        all_passed: bool,
    ) -> list[str]:
        explanations = []

        if all_passed:
            explanations.append(
                f"Strategy '{definition.name}' triggered: all rule groups passed."
            )
        else:
            explanations.append(
                f"Strategy '{definition.name}' did not fully trigger: some rule groups failed."
            )

        for e in triggered:
            explanations.append(
                f"Rule '{e.rule_name}' PASSED (confidence={e.confidence:.2f}): {e.details}"
            )

        for e in failed:
            explanations.append(
                f"Rule '{e.rule_name}' FAILED: {e.details}"
            )

        if not failed:
            explanations.append("No rules failed - clean signal.")
        else:
            missing = [e.rule_name for e in failed]
            explanations.append(f"Missing confirmations: {', '.join(missing)}")

        return explanations

    def _build_warnings(
        self,
        failed: list[RuleEvaluation],
        definition: StrategyDefinition,
    ) -> list[str]:
        warnings = []
        critical_rules = {
            "max_drawdown", "volatility", "value_at_risk",
            "sharpe_ratio", "sortino_ratio",
        }
        for e in failed:
            if e.rule_name in critical_rules:
                warnings.append(
                    f"Risk rule '{e.rule_name}' failed - exercise caution"
                )

        if len(failed) > len(definition.rule_groups) * 2:
            warnings.append("Many rules failed - strategy may not be suitable")

        return warnings
