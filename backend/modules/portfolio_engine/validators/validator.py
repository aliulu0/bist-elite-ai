from __future__ import annotations

from typing import List, Optional

from modules.portfolio_engine.core.types import (
    PortfolioRequest,
    PortfolioProposal,
    PortfolioQuality,
)


class RequestValidator:
    def validate(self, request: PortfolioRequest) -> List[str]:
        errors: List[str] = []

        if not request.candidates:
            errors.append("Candidates list is empty")

        if request.portfolio_size <= 0:
            errors.append(f"Portfolio size must be positive, got {request.portfolio_size}")

        if request.max_per_sector <= 0:
            errors.append(f"Max per sector must be positive, got {request.max_per_sector}")

        if not request.reference_date:
            errors.append("Reference date is required")

        if request.min_elite_score < 0 or request.min_elite_score > 100:
            errors.append(f"Min elite score must be in [0, 100], got {request.min_elite_score}")

        if request.min_confidence < 0 or request.min_confidence > 100:
            errors.append(f"Min confidence must be in [0, 100], got {request.min_confidence}")

        if request.max_risk < 0 or request.max_risk > 100:
            errors.append(f"Max risk must be in [0, 100], got {request.max_risk}")

        return errors

    def is_valid(self, request: PortfolioRequest) -> bool:
        return len(self.validate(request)) == 0


class ResultValidator:
    def validate_proposal(self, proposal: PortfolioProposal) -> List[str]:
        errors: List[str] = []

        if len(proposal.selected) > proposal.size:
            errors.append(
                f"Selected count ({len(proposal.selected)}) exceeds "
                f"portfolio size ({proposal.size})"
            )

        for candidate in proposal.selected:
            self._validate_score_range(candidate.elite_score, "elite_score", candidate.symbol, errors)
            self._validate_score_range(candidate.decision_score, "decision_score", candidate.symbol, errors)
            self._validate_score_range(candidate.confidence, "confidence", candidate.symbol, errors)
            self._validate_score_range(candidate.risk, "risk", candidate.symbol, errors)
            self._validate_score_range(candidate.liquidity, "liquidity", candidate.symbol, errors)
            self._validate_score_range(candidate.composite_score, "composite_score", candidate.symbol, errors)

        if not proposal.portfolio_id:
            errors.append("Portfolio ID is missing")

        if not proposal.reference_date:
            errors.append("Reference date is missing")

        return errors

    def validate_quality(self, quality: PortfolioQuality) -> bool:
        checks = [
            0.0 <= quality.avg_elite_score <= 100.0,
            0.0 <= quality.avg_confidence <= 100.0,
            0.0 <= quality.avg_risk <= 100.0,
            0.0 <= quality.avg_liquidity <= 100.0,
            0.0 <= quality.avg_composite_score <= 100.0,
            0.0 <= quality.diversification_score <= 100.0,
            0.0 <= quality.concentration_risk <= 100.0,
        ]
        return all(checks)

    def _validate_score_range(
        self,
        value: float,
        field_name: str,
        symbol: str,
        errors: List[str],
    ) -> None:
        if value < 0.0 or value > 100.0:
            errors.append(f"{symbol}.{field_name} = {value} is outside [0, 100]")
