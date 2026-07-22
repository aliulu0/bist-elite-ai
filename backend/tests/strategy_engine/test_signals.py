import pytest
from modules.strategy_engine.signals.signal_generator import SignalGenerator
from modules.strategy_engine.core.types import (
    StrategyResult,
    SignalType,
    RuleEvaluation,
)


class TestSignalGenerator:
    def setup_method(self):
        self.gen = SignalGenerator()

    def _make_result(
        self,
        signal: SignalType = SignalType.BUY,
        confidence: float = 0.7,
        score: float = 0.6,
        opp: float = 0.5,
        risk: float = 0.3,
        symbol: str = "THYAO",
    ) -> StrategyResult:
        return StrategyResult(
            strategy_name="Test",
            symbol=symbol,
            signal=signal,
            strategy_score=score,
            opportunity_score=opp,
            confidence=confidence,
            risk=risk,
        )

    def test_generate_signal(self):
        result = self._make_result()
        sig = self.gen.generate_signal(result)
        assert sig["symbol"] == "THYAO"
        assert sig["signal"] == "BUY"
        assert sig["confidence"] == 0.7

    def test_generate_batch_signals(self):
        results = [self._make_result(symbol=f"S{i}") for i in range(5)]
        signals = self.gen.generate_batch_signals(results)
        assert len(signals) == 5

    def test_rank_stocks_by_opportunity(self):
        results = [
            self._make_result(symbol="A", opp=0.3),
            self._make_result(symbol="B", opp=0.8),
            self._make_result(symbol="C", opp=0.5),
        ]
        ranked = self.gen.rank_stocks(results, sort_by="opportunity_score")
        assert ranked[0].symbol == "B"
        assert ranked[-1].symbol == "A"

    def test_rank_stocks_by_risk(self):
        results = [
            self._make_result(symbol="A", risk=0.8),
            self._make_result(symbol="B", risk=0.2),
            self._make_result(symbol="C", risk=0.5),
        ]
        ranked = self.gen.rank_stocks(results, sort_by="risk")
        assert ranked[0].symbol == "B"
        assert ranked[-1].symbol == "A"

    def test_filter_by_signal(self):
        results = [
            self._make_result(signal=SignalType.BUY),
            self._make_result(signal=SignalType.SELL),
            self._make_result(signal=SignalType.BUY),
        ]
        filtered = self.gen.filter_by_signal(results, [SignalType.BUY])
        assert len(filtered) == 2

    def test_filter_by_min_confidence(self):
        results = [
            self._make_result(confidence=0.3),
            self._make_result(confidence=0.8),
            self._make_result(confidence=0.9),
        ]
        filtered = self.gen.filter_by_min_confidence(results, 0.5)
        assert len(filtered) == 2

    def test_filter_by_max_risk(self):
        results = [
            self._make_result(risk=0.1),
            self._make_result(risk=0.5),
            self._make_result(risk=0.9),
        ]
        filtered = self.gen.filter_by_max_risk(results, 0.5)
        assert len(filtered) == 2

    def test_aggregate_signals(self):
        results = [
            self._make_result(signal=SignalType.BUY, confidence=0.7, opp=0.6),
            self._make_result(signal=SignalType.SELL, confidence=0.5, opp=0.3),
        ]
        agg = self.gen.aggregate_signals(results)
        assert agg["total"] == 2
        assert agg["buy"] == 1
        assert agg["sell"] == 1
        assert agg["avg_confidence"] > 0

    def test_aggregate_empty(self):
        agg = self.gen.aggregate_signals([])
        assert agg["total"] == 0

    def test_ranked_stock_has_fields(self):
        results = [self._make_result()]
        ranked = self.gen.rank_stocks(results)
        assert len(ranked) == 1
        assert ranked[0].strategy_name == "Test"
        assert ranked[0].symbol == "THYAO"
