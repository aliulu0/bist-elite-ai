from __future__ import annotations

import time
from modules.scoring_engine.core.types import ScoreType, ScoreBreakdown
from modules.scoring_engine.calculators.base import BaseScoreCalculator


class TechnicalScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.TECHNICAL

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        rsi = metrics.get("rsi")
        macd = metrics.get("macd")
        macd_sig = metrics.get("macd_signal")
        adx = metrics.get("adx")
        parts = []
        if rsi is not None:
            if rsi < 30:
                parts.append(80.0)
            elif rsi < 45:
                parts.append(65.0)
            elif rsi < 55:
                parts.append(55.0)
            elif rsi < 70:
                parts.append(45.0)
            else:
                parts.append(25.0)
        if macd is not None and macd_sig is not None:
            diff = macd - macd_sig
            parts.append(min(100.0, max(0.0, 50.0 + diff * 20)))
        if adx is not None:
            parts.append(min(100.0, max(0.0, adx * 2)))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.75, evidence_count=len(parts), calc_time=elapsed)


class MomentumScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.MOMENTUM

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        mom = metrics.get("momentum")
        roc = metrics.get("roc")
        rsi = metrics.get("rsi")
        parts = []
        if mom is not None:
            parts.append(min(100.0, max(0.0, 50.0 + mom * 3)))
        if roc is not None:
            parts.append(min(100.0, max(0.0, 50.0 + roc * 5)))
        if rsi is not None:
            parts.append(min(100.0, max(0.0, rsi)))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.7, evidence_count=len(parts), calc_time=elapsed)


class TrendScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.TREND

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        sma50 = metrics.get("sma_50")
        sma200 = metrics.get("sma_200")
        price = metrics.get("close")
        adx = metrics.get("adx")
        parts = []
        if sma50 is not None and sma200 is not None:
            if sma50 > sma200:
                parts.append(75.0)
            else:
                parts.append(30.0)
        if price is not None and sma50 is not None:
            if price > sma50:
                parts.append(65.0)
            else:
                parts.append(35.0)
        if adx is not None:
            parts.append(min(100.0, adx * 2.5))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.75, evidence_count=len(parts), calc_time=elapsed)


class VolumeScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.VOLUME

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        vr = metrics.get("volume_ratio")
        obv = metrics.get("obv_trend")
        cmf = metrics.get("cmf")
        mfi = metrics.get("mfi")
        parts = []
        if vr is not None:
            parts.append(min(100.0, max(0.0, vr * 35)))
        if cmf is not None:
            parts.append(min(100.0, max(0.0, 50.0 + cmf * 200)))
        if mfi is not None:
            parts.append(min(100.0, max(0.0, mfi)))
        if obv is not None:
            if isinstance(obv, (int, float)):
                parts.append(min(100.0, max(0.0, 50.0 + obv * 30)))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.65, evidence_count=len(parts), calc_time=elapsed)


class SmartMoneyScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.SMART_MONEY

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        ob = metrics.get("order_block", 0)
        bg = metrics.get("breaker_block", 0)
        fvg = metrics.get("fair_value_gap", 0)
        bos = metrics.get("bos_bullish", 0)
        choc = metrics.get("choc_bullish", 0)
        disc = metrics.get("in_discount_zone", 0)
        signals = sum(1 for v in [ob, bg, fvg, bos, choc, disc] if v and v > 0)
        score = min(100.0, signals * 16.0 + 5.0)
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.7, evidence_count=signals, calc_time=elapsed)


class PatternScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.PATTERN

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        classical = metrics.get("classical_pattern_score", 0)
        candle_bull = metrics.get("candlestick_bullish_score", 0)
        candle_bear = metrics.get("candlestick_bearish_score", 0)
        parts = []
        if classical:
            parts.append(min(100.0, max(0.0, classical)))
        if candle_bull:
            parts.append(min(100.0, max(0.0, candle_bull * 100 if candle_bull <= 1 else candle_bull)))
        if candle_bear:
            parts.append(max(0.0, 100.0 - (candle_bear * 100 if candle_bear <= 1 else candle_bear)))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.65, evidence_count=len(parts), calc_time=elapsed)


class TimingScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.TIMING

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        rsi = metrics.get("rsi")
        stoch_k = metrics.get("stoch_k")
        bb_pos = metrics.get("bollinger_position")
        parts = []
        if rsi is not None:
            if rsi < 30:
                parts.append(85.0)
            elif rsi < 40:
                parts.append(70.0)
            elif rsi < 60:
                parts.append(50.0)
            elif rsi < 70:
                parts.append(35.0)
            else:
                parts.append(20.0)
        if stoch_k is not None:
            if stoch_k < 20:
                parts.append(80.0)
            elif stoch_k < 40:
                parts.append(65.0)
            elif stoch_k < 60:
                parts.append(50.0)
            elif stoch_k < 80:
                parts.append(35.0)
            else:
                parts.append(20.0)
        if bb_pos is not None:
            parts.append(min(100.0, max(0.0, (1.0 - bb_pos) * 100)))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.6, evidence_count=len(parts), calc_time=elapsed)


class SectorStrengthScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.SECTOR_STRENGTH

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        sector_mom = metrics.get("sector_momentum")
        sector_rel = metrics.get("sector_relative_strength")
        parts = []
        if sector_mom is not None:
            parts.append(min(100.0, max(0.0, 50.0 + sector_mom * 5)))
        if sector_rel is not None:
            parts.append(min(100.0, max(0.0, 50.0 + sector_rel * 50)))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.5, evidence_count=len(parts), calc_time=elapsed)


class ProbabilityScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.PROBABILITY

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        opp = metrics.get("opportunity_score")
        conf = metrics.get("opportunity_confidence")
        hist = metrics.get("historical_success_rate")
        parts = []
        if opp is not None:
            parts.append(min(100.0, max(0.0, opp)))
        if conf is not None:
            parts.append(min(100.0, max(0.0, conf * 100)))
        if hist is not None:
            parts.append(min(100.0, max(0.0, hist * 100)))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.6, evidence_count=len(parts), calc_time=elapsed)


class CompositeScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.COMPOSITE

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        sub_scores = kwargs.get("sub_scores", {})
        if sub_scores:
            vals = [v for v in sub_scores.values() if isinstance(v, (int, float))]
            score = sum(vals) / max(1, len(vals)) if vals else 50.0
        else:
            score = 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.8, evidence_count=len(sub_scores), calc_time=elapsed)
