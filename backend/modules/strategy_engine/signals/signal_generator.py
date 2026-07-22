from __future__ import annotations

from modules.strategy_engine.core.types import (
    SignalType,
    StrategyResult,
    RankedStock,
)


class SignalGenerator:

    def generate_signal(self, result: StrategyResult) -> dict:
        return {
            "symbol": result.symbol,
            "signal": result.signal.value,
            "confidence": result.confidence,
            "strategy_score": result.strategy_score,
            "opportunity_score": result.opportunity_score,
            "risk": result.risk,
            "strategy": result.strategy_name,
            "triggered_count": len(result.triggered_rules),
            "failed_count": len(result.failed_rules),
        }

    def generate_batch_signals(
        self,
        results: list[StrategyResult],
    ) -> list[dict]:
        return [self.generate_signal(r) for r in results]

    def rank_stocks(
        self,
        results: list[StrategyResult],
        sort_by: str = "opportunity_score",
    ) -> list[RankedStock]:
        ranked = []
        for r in results:
            ranked.append(RankedStock(
                symbol=r.symbol,
                strategy_score=r.strategy_score,
                opportunity_score=r.opportunity_score,
                confidence=r.confidence,
                risk=r.risk,
                signal=r.signal,
                strategy_name=r.strategy_name,
            ))

        reverse = sort_by != "risk"
        ranked.sort(
            key=lambda x: getattr(x, sort_by, 0),
            reverse=reverse,
        )
        return ranked

    def filter_by_signal(
        self,
        results: list[StrategyResult],
        signals: list[SignalType],
    ) -> list[StrategyResult]:
        return [r for r in results if r.signal in signals]

    def filter_by_min_confidence(
        self,
        results: list[StrategyResult],
        min_confidence: float = 0.5,
    ) -> list[StrategyResult]:
        return [r for r in results if r.confidence >= min_confidence]

    def filter_by_max_risk(
        self,
        results: list[StrategyResult],
        max_risk: float = 0.5,
    ) -> list[StrategyResult]:
        return [r for r in results if r.risk <= max_risk]

    def aggregate_signals(
        self,
        results: list[StrategyResult],
    ) -> dict:
        if not results:
            return {
                "total": 0,
                "strong_buy": 0,
                "buy": 0,
                "neutral": 0,
                "sell": 0,
                "strong_sell": 0,
                "wait": 0,
                "avg_confidence": 0.0,
                "avg_opportunity": 0.0,
            }

        counts = {s: 0 for s in SignalType}
        for r in results:
            counts[r.signal] = counts.get(r.signal, 0) + 1

        avg_conf = sum(r.confidence for r in results) / len(results)
        avg_opp = sum(r.opportunity_score for r in results) / len(results)

        return {
            "total": len(results),
            "strong_buy": counts.get(SignalType.STRONG_BUY, 0),
            "buy": counts.get(SignalType.BUY, 0),
            "neutral": counts.get(SignalType.NEUTRAL, 0),
            "sell": counts.get(SignalType.SELL, 0),
            "strong_sell": counts.get(SignalType.STRONG_SELL, 0),
            "wait": counts.get(SignalType.WAIT, 0),
            "avg_confidence": avg_conf,
            "avg_opportunity": avg_opp,
        }
