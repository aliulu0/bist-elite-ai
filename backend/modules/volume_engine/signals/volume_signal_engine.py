from __future__ import annotations

from modules.volume_engine.core.types import (
    IndicatorResult, Signal, SignalType, TrendDirection,
)


class VolumeSignalEngine:

    def generate_obv_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals
        if result.trend == TrendDirection.BULLISH:
            signals.append(Signal(
                signal_type=SignalType.BUY, indicator="OBV",
                confidence=0.7, strength=min(1.0, abs(result.slope or 0) * 100 + 0.3),
                description="OBV confirms bullish volume",
            ))
        elif result.trend == TrendDirection.BEARISH:
            signals.append(Signal(
                signal_type=SignalType.SELL, indicator="OBV",
                confidence=0.7, strength=min(1.0, abs(result.slope or 0) * 100 + 0.3),
                description="OBV confirms bearish volume",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL, indicator="OBV",
                confidence=0.5, strength=0.0, description="OBV neutral",
            ))
        return signals

    def generate_cmf_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals
        if v > 0.1:
            signals.append(Signal(
                signal_type=SignalType.BUY, indicator="CMF",
                confidence=min(0.85, 0.5 + v), strength=min(1.0, v * 5),
                description=f"CMF strong buying: {v:.3f}",
            ))
        elif v < -0.1:
            signals.append(Signal(
                signal_type=SignalType.SELL, indicator="CMF",
                confidence=min(0.85, 0.5 + abs(v)), strength=min(1.0, abs(v) * 5),
                description=f"CMF strong selling: {v:.3f}",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL, indicator="CMF",
                confidence=0.5, strength=0.0, description=f"CMF neutral: {v:.3f}",
            ))
        return signals

    def generate_mfi_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals
        if v > 80:
            signals.append(Signal(
                signal_type=SignalType.SELL, indicator="MFI",
                confidence=0.75, strength=min(1.0, (v - 80) / 20),
                description=f"MFI overbought: {v:.1f}",
            ))
        elif v < 20:
            signals.append(Signal(
                signal_type=SignalType.BUY, indicator="MFI",
                confidence=0.75, strength=min(1.0, (20 - v) / 20),
                description=f"MFI oversold: {v:.1f}",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL, indicator="MFI",
                confidence=0.5, strength=0.0, description=f"MFI neutral: {v:.1f}",
            ))
        return signals

    def generate_vwap_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals
        if result.trend == TrendDirection.BULLISH:
            signals.append(Signal(
                signal_type=SignalType.BUY, indicator="VWAP",
                confidence=0.65, strength=min(1.0, abs(result.slope or 0) * 50 + 0.3),
                description="VWAP above - institutional buying",
            ))
        elif result.trend == TrendDirection.BEARISH:
            signals.append(Signal(
                signal_type=SignalType.SELL, indicator="VWAP",
                confidence=0.65, strength=min(1.0, abs(result.slope or 0) * 50 + 0.3),
                description="VWAP below - institutional selling",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL, indicator="VWAP",
                confidence=0.5, strength=0.0, description="VWAP neutral",
            ))
        return signals

    def generate_rvol_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals
        if v > 2.0:
            signals.append(Signal(
                signal_type=SignalType.STRONG_BUY if result.trend == TrendDirection.BULLISH else SignalType.BUY,
                indicator="RVOL", confidence=0.8, strength=min(1.0, (v - 1) / 3),
                description=f"High relative volume: {v:.2f}x",
            ))
        elif v > 1.5:
            signals.append(Signal(
                signal_type=SignalType.BUY, indicator="RVOL",
                confidence=0.65, strength=min(1.0, (v - 1) / 2),
                description=f"Above average volume: {v:.2f}x",
            ))
        elif v < 0.5:
            signals.append(Signal(
                signal_type=SignalType.WAIT, indicator="RVOL",
                confidence=0.5, strength=min(1.0, (1 - v)),
                description=f"Low volume: {v:.2f}x",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL, indicator="RVOL",
                confidence=0.5, strength=0.0, description=f"Normal volume: {v:.2f}x",
            ))
        return signals

    def generate_generic_volume_signals(
        self, result: IndicatorResult, indicator: str,
        buy_threshold: float = 0.0, sell_threshold: float = 0.0,
    ) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals
        if buy_threshold != 0 and sell_threshold != 0:
            if v > buy_threshold:
                signals.append(Signal(
                    signal_type=SignalType.BUY, indicator=indicator,
                    confidence=0.7, strength=min(1.0, abs(v) * 2),
                    description=f"{indicator} bullish: {v:.4f}",
                ))
            elif v < sell_threshold:
                signals.append(Signal(
                    signal_type=SignalType.SELL, indicator=indicator,
                    confidence=0.7, strength=min(1.0, abs(v) * 2),
                    description=f"{indicator} bearish: {v:.4f}",
                ))
            else:
                signals.append(Signal(
                    signal_type=SignalType.NEUTRAL, indicator=indicator,
                    confidence=0.5, strength=0.0, description=f"{indicator} neutral: {v:.4f}",
                ))
        else:
            if result.trend == TrendDirection.BULLISH:
                signals.append(Signal(
                    signal_type=SignalType.BUY, indicator=indicator,
                    confidence=0.65, strength=min(1.0, abs(result.slope or 0) * 50 + 0.3),
                    description=f"{indicator} bullish trend",
                ))
            elif result.trend == TrendDirection.BEARISH:
                signals.append(Signal(
                    signal_type=SignalType.SELL, indicator=indicator,
                    confidence=0.65, strength=min(1.0, abs(result.slope or 0) * 50 + 0.3),
                    description=f"{indicator} bearish trend",
                ))
            else:
                signals.append(Signal(
                    signal_type=SignalType.NEUTRAL, indicator=indicator,
                    confidence=0.5, strength=0.0, description=f"{indicator} neutral",
                ))
        return signals

    def aggregate_signals(self, signals: list[Signal]) -> Signal:
        if not signals:
            return Signal(
                signal_type=SignalType.WAIT, indicator="aggregate",
                confidence=0.0, strength=0.0, description="No signals",
            )
        score = 0.0
        total_weight = 0.0
        for s in signals:
            weight = s.confidence
            if s.signal_type == SignalType.STRONG_BUY:
                score += 2 * weight
            elif s.signal_type == SignalType.BUY:
                score += 1 * weight
            elif s.signal_type == SignalType.SELL:
                score -= 1 * weight
            elif s.signal_type == SignalType.STRONG_SELL:
                score -= 2 * weight
            total_weight += weight

        avg_score = score / total_weight if total_weight > 0 else 0.0

        if avg_score > 1.0:
            sig_type = SignalType.STRONG_BUY
        elif avg_score > 0.3:
            sig_type = SignalType.BUY
        elif avg_score < -1.0:
            sig_type = SignalType.STRONG_SELL
        elif avg_score < -0.3:
            sig_type = SignalType.SELL
        elif abs(avg_score) < 0.1:
            sig_type = SignalType.NEUTRAL
        else:
            sig_type = SignalType.WAIT

        return Signal(
            signal_type=sig_type, indicator="aggregate",
            confidence=total_weight / len(signals) if signals else 0,
            strength=min(1.0, abs(avg_score) / 2),
            description=f"Aggregated signal from {len(signals)} indicators",
        )
