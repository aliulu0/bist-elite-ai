from __future__ import annotations

from modules.trend_engine.core.types import (
    IndicatorResult, Signal, SignalType, TrendDirection,
)


class TrendSignalEngine:

    def generate_trend_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals

        if result.trend == TrendDirection.BULLISH:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator=result.indicator,
                confidence=0.7,
                strength=min(1.0, abs(result.slope or 0) * 50 + 0.3),
                description=f"{result.indicator} bullish trend",
            ))
        elif result.trend == TrendDirection.BEARISH:
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator=result.indicator,
                confidence=0.7,
                strength=min(1.0, abs(result.slope or 0) * 50 + 0.3),
                description=f"{result.indicator} bearish trend",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator=result.indicator,
                confidence=0.5,
                strength=0.0,
                description=f"{result.indicator} neutral trend",
            ))
        return signals

    def generate_supertrend_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals

        prev = result.previous_value
        if prev is not None:
            if prev < 0 and v > 0:
                signals.append(Signal(
                    signal_type=SignalType.BUY,
                    indicator="SuperTrend",
                    confidence=0.8,
                    strength=min(1.0, abs(v) * 2),
                    description="SuperTrend bullish flip",
                ))
            elif prev > 0 and v < 0:
                signals.append(Signal(
                    signal_type=SignalType.SELL,
                    indicator="SuperTrend",
                    confidence=0.8,
                    strength=min(1.0, abs(v) * 2),
                    description="SuperTrend bearish flip",
                ))
        if not signals:
            if v > 0:
                signals.append(Signal(
                    signal_type=SignalType.BUY,
                    indicator="SuperTrend",
                    confidence=0.6,
                    strength=min(1.0, abs(v) * 2),
                    description=f"SuperTrend bullish: {v:.2f}",
                ))
            elif v < 0:
                signals.append(Signal(
                    signal_type=SignalType.SELL,
                    indicator="SuperTrend",
                    confidence=0.6,
                    strength=min(1.0, abs(v) * 2),
                    description=f"SuperTrend bearish: {v:.2f}",
                ))
            else:
                signals.append(Signal(
                    signal_type=SignalType.NEUTRAL,
                    indicator="SuperTrend",
                    confidence=0.5,
                    strength=0.0,
                    description="SuperTrend at zero",
                ))
        return signals

    def generate_ichimoku_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals

        if result.trend == TrendDirection.BULLISH:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator="Ichimoku",
                confidence=0.75,
                strength=min(1.0, abs(result.slope or 0) * 100 + 0.4),
                description="Ichimoku bullish cloud",
            ))
        elif result.trend == TrendDirection.BEARISH:
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator="Ichimoku",
                confidence=0.75,
                strength=min(1.0, abs(result.slope or 0) * 100 + 0.4),
                description="Ichimoku bearish cloud",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator="Ichimoku",
                confidence=0.5,
                strength=0.0,
                description="Ichimoku neutral",
            ))
        return signals

    def generate_bollinger_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals

        if v > 2.0:
            signals.append(Signal(
                signal_type=SignalType.STRONG_SELL,
                indicator="Bollinger",
                confidence=0.8,
                strength=min(1.0, (v - 2.0)),
                description=f"Bollinger: price above upper band ({v:.2f}σ)",
            ))
        elif v > 1.0:
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator="Bollinger",
                confidence=0.65,
                strength=min(1.0, v - 1.0),
                description=f"Bollinger: near upper band ({v:.2f}σ)",
            ))
        elif v < -2.0:
            signals.append(Signal(
                signal_type=SignalType.STRONG_BUY,
                indicator="Bollinger",
                confidence=0.8,
                strength=min(1.0, abs(v) - 2.0),
                description=f"Bollinger: price below lower band ({v:.2f}σ)",
            ))
        elif v < -1.0:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator="Bollinger",
                confidence=0.65,
                strength=min(1.0, abs(v) - 1.0),
                description=f"Bollinger: near lower band ({v:.2f}σ)",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator="Bollinger",
                confidence=0.5,
                strength=0.0,
                description=f"Bollinger: within bands ({v:.2f}σ)",
            ))
        return signals

    def generate_donchian_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals

        if result.trend == TrendDirection.BULLISH:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator="Donchian",
                confidence=0.7,
                strength=min(1.0, abs(result.slope or 0) * 50 + 0.3),
                description="Donchian channel expanding bullish",
            ))
        elif result.trend == TrendDirection.BEARISH:
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator="Donchian",
                confidence=0.7,
                strength=min(1.0, abs(result.slope or 0) * 50 + 0.3),
                description="Donchian channel expanding bearish",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator="Donchian",
                confidence=0.5,
                strength=0.0,
                description="Donchian channel neutral",
            ))
        return signals

    def generate_keltner_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals

        if v > 1.5:
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator="Keltner",
                confidence=0.7,
                strength=min(1.0, (v - 1.0) / 2),
                description=f"Keltner: above upper band ({v:.2f})",
            ))
        elif v < -1.5:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator="Keltner",
                confidence=0.7,
                strength=min(1.0, (abs(v) - 1.0) / 2),
                description=f"Keltner: below lower band ({v:.2f})",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator="Keltner",
                confidence=0.5,
                strength=0.0,
                description=f"Keltner: within bands ({v:.2f})",
            ))
        return signals

    def generate_ma_envelope_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals

        if v > 1.0:
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator="MAEnvelope",
                confidence=0.65,
                strength=min(1.0, v - 1.0),
                description=f"MAEnvelope: above upper envelope ({v:.2f})",
            ))
        elif v < -1.0:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator="MAEnvelope",
                confidence=0.65,
                strength=min(1.0, abs(v) - 1.0),
                description=f"MAEnvelope: below lower envelope ({v:.2f})",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator="MAEnvelope",
                confidence=0.5,
                strength=0.0,
                description=f"MAEnvelope: within envelopes ({v:.2f})",
            ))
        return signals

    def generate_linear_reg_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals

        if result.trend == TrendDirection.BULLISH:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator="LinReg",
                confidence=0.7,
                strength=min(1.0, abs(result.slope or 0) * 100 + 0.3),
                description="Linear regression uptrend",
            ))
        elif result.trend == TrendDirection.BEARISH:
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator="LinReg",
                confidence=0.7,
                strength=min(1.0, abs(result.slope or 0) * 100 + 0.3),
                description="Linear regression downtrend",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator="LinReg",
                confidence=0.5,
                strength=0.0,
                description="Linear regression neutral",
            ))
        return signals

    def aggregate_signals(self, signals: list[Signal]) -> Signal:
        if not signals:
            return Signal(
                signal_type=SignalType.WAIT,
                indicator="aggregate",
                confidence=0.0,
                strength=0.0,
                description="No signals",
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

        if total_weight == 0:
            avg_score = 0.0
        else:
            avg_score = score / total_weight

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
            signal_type=sig_type,
            indicator="aggregate",
            confidence=total_weight / len(signals) if signals else 0,
            strength=min(1.0, abs(avg_score) / 2),
            description=f"Aggregated signal from {len(signals)} indicators",
        )
