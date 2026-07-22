from __future__ import annotations

from typing import Dict, List, Optional, Tuple

from modules.position_sizing_engine.core.types import (
    DEFAULT_ATR_STOP_MULTIPLIER,
    DEFAULT_MAX_POSITION_PCT,
    DEFAULT_MIN_POSITION_PCT,
    DEFAULT_VOLATILITY_STOP_MULTIPLIER,
    PositionGrade,
    PositionInput,
    PositionSizing,
    StopLoss,
    StopLossType,
    TakeProfit,
    _clamp,
    _mean,
    compute_position_grade,
)


class PositionCalculator:

    def calculate(
        self, input_data: PositionInput, profile_params: Dict[str, float]
    ) -> PositionSizing:
        raw_size = self._compute_raw_size(input_data, profile_params)
        adjusted = self._apply_risk_adjustment(
            raw_size, input_data.risk, input_data.volatility, input_data.beta
        )
        regime_adjusted = self._apply_regime_adjustment(adjusted, input_data.market_regime)
        final_size = self._apply_liquidity_adjustment(
            regime_adjusted, input_data.liquidity, input_data.avg_daily_volume
        )

        min_pct, max_pct = self._compute_min_max(raw_size, profile_params)
        final_size = _clamp(final_size, min_pct, max_pct)

        grade = self._compute_grade(
            input_data.elite_score, input_data.confidence, input_data.risk
        )

        stop_loss = self._compute_stop_loss(input_data, StopLossType.ATR_BASED)
        take_profit = self._compute_take_profit(input_data)

        explanation = self._generate_explanation(input_data, final_size, grade)

        return PositionSizing(
            symbol=input_data.symbol,
            recommended_pct=round(final_size, 2),
            min_pct=round(min_pct, 2),
            max_pct=round(max_pct, 2),
            portfolio_weight=round(final_size / 100.0, 4),
            cash_allocation_pct=round(100.0 - final_size, 2),
            position_grade=grade,
            stop_loss=stop_loss,
            take_profit=take_profit,
            explanation=explanation,
            metadata={
                "raw_size": round(raw_size, 2),
                "regime": input_data.market_regime,
                "elite_score": input_data.elite_score,
            },
        )

    def _compute_raw_size(
        self, input_data: PositionInput, params: Dict[str, float]
    ) -> float:
        max_pos = params.get("max_position", DEFAULT_MAX_POSITION_PCT)
        elite_weight = 0.5
        confidence_weight = 0.3
        risk_weight = 0.2

        elite_factor = (input_data.elite_score / 100.0) * elite_weight
        confidence_factor = (input_data.confidence / 100.0) * confidence_weight
        risk_factor = ((100.0 - input_data.risk) / 100.0) * risk_weight

        composite = elite_factor + confidence_factor + risk_factor
        raw = composite * max_pos
        return _clamp(raw, 0.0, max_pos)

    def _apply_risk_adjustment(
        self, size: float, risk: float, volatility: float, beta: float
    ) -> float:
        adjustment = 1.0

        if risk > 70:
            adjustment *= 0.7
        elif risk > 50:
            adjustment *= 0.85
        elif risk < 30:
            adjustment *= 1.1

        if volatility > 0.4:
            adjustment *= 0.8
        elif volatility > 0.3:
            adjustment *= 0.9

        if beta > 1.5:
            adjustment *= 0.85
        elif beta < 0.5:
            adjustment *= 1.05

        return size * adjustment

    def _apply_regime_adjustment(self, size: float, market_regime: str) -> float:
        regime = market_regime.lower() if market_regime else "sideways"
        adjustments = {
            "bull": 1.1,
            "bullish": 1.1,
            "bear": 0.8,
            "bearish": 0.8,
            "sideways": 1.0,
            "neutral": 1.0,
            "volatile": 0.85,
            "high_volatility": 0.85,
        }
        factor = adjustments.get(regime, 1.0)
        return size * factor

    def _apply_liquidity_adjustment(
        self, size: float, liquidity: float, volume: float
    ) -> float:
        adjustment = 1.0

        if liquidity < 20:
            adjustment *= 0.6
        elif liquidity < 40:
            adjustment *= 0.8
        elif liquidity > 80:
            adjustment *= 1.05

        if volume > 0:
            if volume < 100_000:
                adjustment *= 0.7
            elif volume < 500_000:
                adjustment *= 0.85

        return size * adjustment

    def _compute_min_max(
        self, raw_size: float, params: Dict[str, float]
    ) -> Tuple[float, float]:
        min_pct = params.get("min_position", DEFAULT_MIN_POSITION_PCT)
        max_pct = params.get("max_position", DEFAULT_MAX_POSITION_PCT)
        return min_pct, max_pct

    def _compute_stop_loss(
        self,
        input_data: PositionInput,
        stop_type: StopLossType = StopLossType.ATR_BASED,
        multiplier: float = DEFAULT_ATR_STOP_MULTIPLIER,
    ) -> StopLoss:
        price = input_data.price
        atr = input_data.atr
        volatility = input_data.volatility

        if stop_type == StopLossType.ATR_BASED and atr > 0 and price > 0:
            stop_loss_price = price - (atr * multiplier)
            stop_loss_pct = ((price - stop_loss_price) / price) * 100.0
            explanation = (
                f"ATR-based stop: price {price:.2f} - ({atr:.2f} x {multiplier}) = {stop_loss_price:.2f} "
                f"({stop_loss_pct:.1f}% risk)"
            )
        elif stop_type == StopLossType.VOLATILITY and volatility > 0 and price > 0:
            vol_mult = DEFAULT_VOLATILITY_STOP_MULTIPLIER
            stop_loss_price = price * (1.0 - volatility * vol_mult)
            stop_loss_pct = ((price - stop_loss_price) / price) * 100.0
            explanation = (
                f"Volatility-based stop: {stop_loss_price:.2f} "
                f"({stop_loss_pct:.1f}% from current price)"
            )
        elif price > 0:
            default_pct = 7.0
            stop_loss_price = price * (1.0 - default_pct / 100.0)
            stop_loss_pct = default_pct
            explanation = (
                f"Suggested stop at {stop_loss_price:.2f} ({default_pct:.1f}% risk)"
            )
        else:
            stop_loss_price = 0.0
            stop_loss_pct = 0.0
            explanation = "Unable to compute stop loss: missing price data"

        return StopLoss(
            symbol=input_data.symbol,
            stop_loss_price=round(stop_loss_price, 2),
            stop_loss_pct=round(stop_loss_pct, 2),
            stop_loss_type=stop_type,
            explanation=explanation,
        )

    def _compute_take_profit(self, input_data: PositionInput) -> TakeProfit:
        price = input_data.price
        risk_reward = 2.0

        if input_data.atr > 0 and price > 0:
            primary = price + (input_data.atr * 2.0)
            secondary = price + (input_data.atr * 3.5)
            explanation = (
                f"ATR-based targets: primary {primary:.2f}, secondary {secondary:.2f} "
                f"(R:R = {risk_reward:.1f})"
            )
        elif price > 0:
            primary = price * 1.15
            secondary = price * 1.25
            explanation = (
                f"Default targets: primary {primary:.2f}, secondary {secondary:.2f} "
                f"(+15% / +25%)"
            )
        else:
            primary = 0.0
            secondary = 0.0
            explanation = "Unable to compute take profit: missing price data"

        return TakeProfit(
            symbol=input_data.symbol,
            primary_target=round(primary, 2),
            secondary_target=round(secondary, 2),
            risk_reward_ratio=risk_reward,
            explanation=explanation,
        )

    def _compute_grade(
        self, elite_score: float, confidence: float, risk: float
    ) -> PositionGrade:
        score = (elite_score * 0.5) + (confidence * 0.3) + ((100.0 - risk) * 0.2)
        return compute_position_grade(score)

    def _generate_explanation(
        self,
        input_data: PositionInput,
        position_size: float,
        grade: PositionGrade,
    ) -> str:
        parts = [
            f"Position size {position_size:.1f}% for {input_data.symbol} (grade {grade.value})",
            f"Elite score: {input_data.elite_score:.0f}, Confidence: {input_data.confidence:.0f}, Risk: {input_data.risk:.0f}",
        ]
        if input_data.market_regime:
            parts.append(f"Market regime: {input_data.market_regime}")
        if input_data.sector:
            parts.append(f"Sector: {input_data.sector}")
        if input_data.liquidity < 30:
            parts.append("Warning: low liquidity may limit execution")
        if input_data.risk > 70:
            parts.append("Warning: high risk reduced allocation")
        if input_data.beta > 1.5:
            parts.append("Note: high beta relative to market")
        return "; ".join(parts)
