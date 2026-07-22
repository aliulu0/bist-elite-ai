from __future__ import annotations

from modules.momentum_engine.core.types import (
    IndicatorResult, Signal, SignalType, TrendDirection,
)


class SignalEngine:

    def generate_rsi_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals
        slope = result.slope or 0

        if v < 30:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator="RSI",
                confidence=0.7,
                strength=min(1.0, (30 - v) / 30),
                description=f"RSI oversold at {v:.1f}",
            ))
        elif v < 20:
            signals.append(Signal(
                signal_type=SignalType.STRONG_BUY,
                indicator="RSI",
                confidence=0.85,
                strength=min(1.0, (20 - v) / 20),
                description=f"RSI strongly oversold at {v:.1f}",
            ))
        elif v > 70:
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator="RSI",
                confidence=0.7,
                strength=min(1.0, (v - 70) / 30),
                description=f"RSI overbought at {v:.1f}",
            ))
        elif v > 80:
            signals.append(Signal(
                signal_type=SignalType.STRONG_SELL,
                indicator="RSI",
                confidence=0.85,
                strength=min(1.0, (v - 80) / 20),
                description=f"RSI strongly overbought at {v:.1f}",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator="RSI",
                confidence=0.5,
                strength=0.0,
                description=f"RSI neutral at {v:.1f}",
            ))
        return signals

    def generate_stoch_rsi_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals
        if v < 20:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator="StochRSI",
                confidence=0.7,
                strength=min(1.0, (20 - v) / 20),
                description=f"StochRSI oversold at {v:.1f}",
            ))
        elif v > 80:
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator="StochRSI",
                confidence=0.7,
                strength=min(1.0, (v - 80) / 20),
                description=f"StochRSI overbought at {v:.1f}",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator="StochRSI",
                confidence=0.5,
                strength=0.0,
                description=f"StochRSI neutral at {v:.1f}",
            ))
        return signals

    def generate_macd_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        prev = result.previous_value
        if v is None:
            return signals
        if prev is not None:
            if prev <= 0 < v:
                signals.append(Signal(
                    signal_type=SignalType.BUY,
                    indicator="MACD",
                    confidence=0.75,
                    strength=min(1.0, abs(v) * 10),
                    description="MACD bullish crossover",
                ))
            elif prev >= 0 > v:
                signals.append(Signal(
                    signal_type=SignalType.SELL,
                    indicator="MACD",
                    confidence=0.75,
                    strength=min(1.0, abs(v) * 10),
                    description="MACD bearish crossover",
                ))
        if not signals:
            if v > 0:
                signals.append(Signal(
                    signal_type=SignalType.BUY,
                    indicator="MACD",
                    confidence=0.5,
                    strength=min(1.0, abs(v) * 5),
                    description=f"MACD positive at {v:.4f}",
                ))
            elif v < 0:
                signals.append(Signal(
                    signal_type=SignalType.SELL,
                    indicator="MACD",
                    confidence=0.5,
                    strength=min(1.0, abs(v) * 5),
                    description=f"MACD negative at {v:.4f}",
                ))
            else:
                signals.append(Signal(
                    signal_type=SignalType.NEUTRAL,
                    indicator="MACD",
                    confidence=0.5,
                    strength=0.0,
                    description="MACD at zero line",
                ))
        return signals

    def generate_adx_signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals
        if v > 25:
            strength = min(1.0, (v - 25) / 25)
            signals.append(Signal(
                signal_type=SignalType.BUY if result.trend == TrendDirection.BULLISH else SignalType.SELL,
                indicator="ADX",
                confidence=0.6 + strength * 0.3,
                strength=strength,
                description=f"ADX strong trend at {v:.1f}",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.WAIT,
                indicator="ADX",
                confidence=0.6,
                strength=0.0,
                description=f"ADX weak trend at {v:.1f}",
            ))
        return signals

    def generate_generic_signals(
        self, result: IndicatorResult, indicator: str,
        overbought: float = 70, oversold: float = 30,
    ) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals
        if v < oversold:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator=indicator,
                confidence=0.65,
                strength=min(1.0, (oversold - v) / max(abs(oversold), 1)),
                description=f"{indicator} oversold at {v:.1f}",
            ))
        elif v > overbought:
            denom = max(abs(100 - overbought), 1)
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator=indicator,
                confidence=0.65,
                strength=min(1.0, (v - overbought) / denom),
                description=f"{indicator} overbought at {v:.1f}",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator=indicator,
                confidence=0.5,
                strength=0.0,
                description=f"{indicator} neutral at {v:.1f}",
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
