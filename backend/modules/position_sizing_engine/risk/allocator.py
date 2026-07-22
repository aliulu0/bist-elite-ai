from __future__ import annotations

from typing import Dict, List, Optional

from modules.position_sizing_engine.core.types import (
    DEFAULT_CASH_RESERVE,
    DEFAULT_MAX_CORRELATION,
    DEFAULT_MAX_SECTOR_EXPOSURE,
    PositionSizing,
    PositionSizingRequest,
    PortfolioExposure,
    _clamp,
    _mean,
)


class RiskAllocator:

    def allocate(
        self, positions: List[PositionSizing], request: PositionSizingRequest
    ) -> List[PositionSizing]:
        if not positions:
            return positions

        adjusted = list(positions)
        adjusted = self._apply_sector_limits(adjusted, request)
        adjusted = self._apply_correlation_limits(adjusted, request)
        adjusted = self._apply_concentration_limits(adjusted)
        adjusted = self._normalize_weights(adjusted)

        regime = ""
        if request.metadata:
            regime = request.metadata.get("market_regime", "")
        if not regime:
            for pos in request.positions:
                if pos.market_regime:
                    regime = pos.market_regime
                    break

        if regime.lower() in ("bear", "bearish"):
            adjusted = self._apply_bear_market_reduction(adjusted, regime)

        return adjusted

    def _apply_sector_limits(
        self, positions: List[PositionSizing], request: PositionSizingRequest
    ) -> List[PositionSizing]:
        sector_map: Dict[str, float] = {}
        sector_limits = request.sector_limits or {}
        max_sector = request.max_sector_exposure

        sector_input_map: Dict[str, str] = {}
        for pos_input in request.positions:
            sector_input_map[pos_input.symbol] = pos_input.sector

        result: List[PositionSizing] = []
        for pos in positions:
            sector = sector_input_map.get(pos.symbol, "unknown")
            limit = sector_limits.get(sector, max_sector)
            current_sector_exposure = sector_map.get(sector, 0.0)

            if not self._check_sector_exposure(
                pos.symbol, sector, current_sector_exposure, limit
            ):
                reduction = max(0.0, limit - current_sector_exposure)
                pos = PositionSizing(
                    symbol=pos.symbol,
                    recommended_pct=round(reduction, 2),
                    min_pct=pos.min_pct,
                    max_pct=pos.max_pct,
                    portfolio_weight=round(reduction / 100.0, 4),
                    cash_allocation_pct=pos.cash_allocation_pct,
                    position_grade=pos.position_grade,
                    stop_loss=pos.stop_loss,
                    take_profit=pos.take_profit,
                    explanation=pos.explanation + f" [reduced for sector limit: {sector}]",
                    metadata=pos.metadata,
                )

            sector_map[sector] = current_sector_exposure + pos.recommended_pct
            result.append(pos)

        return result

    def _apply_correlation_limits(
        self, positions: List[PositionSizing], request: PositionSizingRequest
    ) -> List[PositionSizing]:
        max_corr = request.max_correlation
        result: List[PositionSizing] = []

        for pos in positions:
            pos_input = None
            for inp in request.positions:
                if inp.symbol == pos.symbol:
                    pos_input = inp
                    break

            if pos_input and not self._check_correlation(
                pos.symbol, pos_input.correlation, result
            ):
                adjusted_pct = self._reduce_for_correlation(pos, result)
                pos = PositionSizing(
                    symbol=pos.symbol,
                    recommended_pct=round(adjusted_pct, 2),
                    min_pct=pos.min_pct,
                    max_pct=pos.max_pct,
                    portfolio_weight=round(adjusted_pct / 100.0, 4),
                    cash_allocation_pct=pos.cash_allocation_pct,
                    position_grade=pos.position_grade,
                    stop_loss=pos.stop_loss,
                    take_profit=pos.take_profit,
                    explanation=pos.explanation + " [reduced for correlation]",
                    metadata=pos.metadata,
                )

            result.append(pos)

        return result

    def _apply_concentration_limits(self, positions: List[PositionSizing]) -> List[PositionSizing]:
        if not positions:
            return positions

        concentration = self._compute_concentration_risk(positions)
        if concentration <= 0.25:
            return positions

        reduction_factor = 1.0 - ((concentration - 0.25) * 0.5)
        reduction_factor = _clamp(reduction_factor, 0.5, 1.0)

        result: List[PositionSizing] = []
        for pos in positions:
            adjusted_pct = pos.recommended_pct * reduction_factor
            result.append(PositionSizing(
                symbol=pos.symbol,
                recommended_pct=round(adjusted_pct, 2),
                min_pct=pos.min_pct,
                max_pct=pos.max_pct,
                portfolio_weight=round(adjusted_pct / 100.0, 4),
                cash_allocation_pct=pos.cash_allocation_pct,
                position_grade=pos.position_grade,
                stop_loss=pos.stop_loss,
                take_profit=pos.take_profit,
                explanation=pos.explanation + " [adjusted for concentration risk]",
                metadata=pos.metadata,
            ))

        return result

    def _normalize_weights(self, positions: List[PositionSizing]) -> List[PositionSizing]:
        total = sum(p.recommended_pct for p in positions)
        if total <= 0:
            return positions

        result: List[PositionSizing] = []
        for pos in positions:
            normalized = (pos.recommended_pct / total) * 100.0 if total > 0 else pos.recommended_pct
            result.append(PositionSizing(
                symbol=pos.symbol,
                recommended_pct=round(normalized, 2),
                min_pct=pos.min_pct,
                max_pct=pos.max_pct,
                portfolio_weight=round(normalized / 100.0, 4),
                cash_allocation_pct=pos.cash_allocation_pct,
                position_grade=pos.position_grade,
                stop_loss=pos.stop_loss,
                take_profit=pos.take_profit,
                explanation=pos.explanation,
                metadata=pos.metadata,
            ))

        return result

    def _check_sector_exposure(
        self, symbol: str, sector: str, current_exposure: float, max_exposure: float
    ) -> bool:
        return current_exposure < max_exposure

    def _check_correlation(
        self, symbol: str, correlation: float, existing_positions: List[PositionSizing]
    ) -> bool:
        if not existing_positions:
            return True
        max_corr = DEFAULT_MAX_CORRELATION
        return abs(correlation) < max_corr

    def _reduce_for_correlation(
        self, position: PositionSizing, existing_positions: List[PositionSizing]
    ) -> float:
        if not existing_positions:
            return position.recommended_pct
        reduction = 0.8
        return position.recommended_pct * reduction

    def compute_portfolio_exposure(
        self, positions: List[PositionSizing], request: PositionSizingRequest
    ) -> PortfolioExposure:
        return self._compute_portfolio_exposure(positions, request)

    def _compute_portfolio_exposure(
        self, positions: List[PositionSizing], request: PositionSizingRequest
    ) -> PortfolioExposure:
        sector_map: Dict[str, str] = {}
        for pos_input in request.positions:
            sector_map[pos_input.symbol] = pos_input.sector

        sector_exposure: Dict[str, float] = {}
        total_exposure = 0.0
        total_risk = 0.0

        for pos in positions:
            sector = sector_map.get(pos.symbol, "unknown")
            sector_exposure[sector] = sector_exposure.get(sector, 0.0) + pos.recommended_pct
            total_exposure += pos.recommended_pct
            if pos.stop_loss:
                total_risk += pos.stop_loss.stop_loss_pct * (pos.recommended_pct / 100.0)

        cash_ratio = self._compute_cash_ratio(positions, request.total_capital)
        concentration = self._compute_concentration_risk(positions)

        return PortfolioExposure(
            sector_exposure=sector_exposure,
            market_exposure=round(total_exposure, 2),
            total_risk_exposure=round(total_risk, 2),
            cash_ratio=round(cash_ratio, 2),
            concentration_risk=round(concentration, 4),
            sector_count=len(sector_exposure),
        )

    def _compute_concentration_risk(self, positions: List[PositionSizing]) -> float:
        if not positions:
            return 0.0
        total = sum(p.recommended_pct for p in positions)
        if total <= 0:
            return 0.0
        hhi = sum((p.recommended_pct / total) ** 2 for p in positions)
        return round(hhi, 4)

    def _compute_cash_ratio(
        self, positions: List[PositionSizing], total_capital: float
    ) -> float:
        if total_capital <= 0:
            return DEFAULT_CASH_RESERVE
        invested = sum(p.recommended_pct for p in positions)
        cash_pct = max(0.0, 100.0 - invested)
        return round(cash_pct, 2)

    def _apply_bear_market_reduction(
        self, positions: List[PositionSizing], regime: str
    ) -> List[PositionSizing]:
        reduction_factor = 0.85
        result: List[PositionSizing] = []
        for pos in positions:
            adjusted_pct = pos.recommended_pct * reduction_factor
            result.append(PositionSizing(
                symbol=pos.symbol,
                recommended_pct=round(adjusted_pct, 2),
                min_pct=pos.min_pct,
                max_pct=pos.max_pct,
                portfolio_weight=round(adjusted_pct / 100.0, 4),
                cash_allocation_pct=pos.cash_allocation_pct,
                position_grade=pos.position_grade,
                stop_loss=pos.stop_loss,
                take_profit=pos.take_profit,
                explanation=pos.explanation + " [bear market reduction applied]",
                metadata=pos.metadata,
            ))
        return result

    def _apply_high_volatility_cash(
        self, positions: List[PositionSizing], volatility: float, cash_reserve: float
    ) -> List[PositionSizing]:
        if volatility < 0.3:
            return positions

        scale = 1.0 - ((volatility - 0.3) * 0.5)
        scale = _clamp(scale, 0.5, 1.0)

        result: List[PositionSizing] = []
        for pos in positions:
            adjusted_pct = pos.recommended_pct * scale
            result.append(PositionSizing(
                symbol=pos.symbol,
                recommended_pct=round(adjusted_pct, 2),
                min_pct=pos.min_pct,
                max_pct=pos.max_pct,
                portfolio_weight=round(adjusted_pct / 100.0, 4),
                cash_allocation_pct=pos.cash_allocation_pct,
                position_grade=pos.position_grade,
                stop_loss=pos.stop_loss,
                take_profit=pos.take_profit,
                explanation=pos.explanation + " [high volatility cash reserve applied]",
                metadata=pos.metadata,
            ))
        return result
