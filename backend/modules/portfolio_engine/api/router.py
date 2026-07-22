from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from modules.portfolio_engine.core.types import (
    InvestmentHorizon,
    PortfolioRequest,
    RejectionReason,
    ReportType,
    SortField,
    StockCandidate,
)
from modules.portfolio_engine.schemas.schemas import (
    CacheStatsSchema,
    PortfolioCurrentResponse,
    PortfolioListResponse,
    PortfolioProposalSchema,
    PortfolioQualitySchema,
    PortfolioReportResponse,
    PortfolioRequestSchema,
    PortfolioResultSchema,
    SelectionResultSchema,
    StockCandidateSchema,
)
from modules.portfolio_engine.services.service import PortfolioService

router = APIRouter(prefix="/portfolio", tags=["Portfolio Construction Engine"])

_service: Optional[PortfolioService] = None


def _get_service() -> PortfolioService:
    global _service
    if _service is None:
        _service = PortfolioService()
    return _service


def _convert_request(schema: PortfolioRequestSchema) -> PortfolioRequest:
    horizon = InvestmentHorizon(schema.horizon)
    sort_by = SortField(schema.sort_by)
    candidates = [
        StockCandidate(
            symbol=c.symbol,
            sector=c.sector,
            elite_score=c.elite_score,
            decision_score=c.decision_score,
            confidence=c.confidence,
            risk=c.risk,
            liquidity=c.liquidity,
            metadata=c.metadata,
        )
        for c in schema.candidates
    ]
    return PortfolioRequest(
        reference_date=schema.reference_date,
        horizon=horizon,
        portfolio_size=schema.portfolio_size,
        max_per_sector=schema.max_per_sector,
        min_elite_score=schema.min_elite_score,
        min_confidence=schema.min_confidence,
        min_liquidity=schema.min_liquidity,
        max_risk=schema.max_risk,
        min_decision_score=schema.min_decision_score,
        candidates=candidates,
        sector_data=schema.sector_data,
        sort_by=sort_by,
        diversification_preset=schema.diversification_preset,
        seed=schema.seed,
        metadata=schema.metadata,
    )


def _convert_proposal(proposal: Any) -> PortfolioProposalSchema:
    selected = [
        StockCandidateSchema(
            symbol=s.symbol,
            sector=s.sector,
            elite_score=s.elite_score,
            decision_score=s.decision_score,
            confidence=s.confidence,
            risk=s.risk,
            liquidity=s.liquidity,
            composite_score=s.composite_score,
            rank=s.rank,
            metadata=s.metadata,
        )
        for s in proposal.selected
    ]
    rejected = [
        SelectionResultSchema(
            symbol=r.symbol,
            selected=r.selected,
            reason=r.reason,
            rejection_reason=r.rejection_reason.value if r.rejection_reason else None,
            rank=r.rank,
            composite_score=r.composite_score,
        )
        for r in proposal.rejected
    ]
    qm = proposal.quality_metrics
    quality = None
    if qm:
        quality = PortfolioQualitySchema(
            avg_elite_score=qm.avg_elite_score,
            avg_confidence=qm.avg_confidence,
            avg_risk=qm.avg_risk,
            avg_liquidity=qm.avg_liquidity,
            avg_composite_score=qm.avg_composite_score,
            sector_distribution=qm.sector_distribution,
            liquidity_distribution=qm.liquidity_distribution,
            risk_distribution=qm.risk_distribution,
            diversification_score=qm.diversification_score,
            concentration_risk=qm.concentration_risk,
        )
    return PortfolioProposalSchema(
        portfolio_id=proposal.portfolio_id,
        reference_date=proposal.reference_date,
        horizon=proposal.horizon.value,
        size=proposal.size,
        selected=selected,
        rejected=rejected,
        quality_metrics=quality,
    )


@router.post("/generate", response_model=PortfolioResultSchema)
def generate_portfolio(request: PortfolioRequestSchema) -> PortfolioResultSchema:
    svc = _get_service()
    try:
        req = _convert_request(request)
        result = svc.generate(req)
        proposal_schema = _convert_proposal(result.proposal)
        return PortfolioResultSchema(
            request=request,
            proposal=proposal_schema,
            execution_time_ms=result.execution_time_ms,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portfolio generation failed: {e}")


@router.get("/list", response_model=PortfolioListResponse)
def get_portfolio_list() -> PortfolioListResponse:
    svc = _get_service()
    history = svc.get_history()
    return PortfolioListResponse(
        portfolios=history,
        count=len(history),
    )


@router.get("/current", response_model=PortfolioCurrentResponse)
def get_current_portfolio() -> PortfolioCurrentResponse:
    svc = _get_service()
    current = svc.get_current()
    if current is None:
        raise HTTPException(status_code=404, detail="No portfolio generated yet")
    proposal_schema = _convert_proposal(current.proposal)
    return PortfolioCurrentResponse(
        proposal=proposal_schema,
        execution_time_ms=current.execution_time_ms,
    )


@router.get("/report/{report_type}", response_model=PortfolioReportResponse)
def get_report(report_type: str) -> PortfolioReportResponse:
    svc = _get_service()
    try:
        rt = ReportType(report_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid report type: {report_type}")
    data = svc.generate_report(rt)
    current = svc.get_current()
    portfolio_id = current.proposal.portfolio_id if current else ""
    return PortfolioReportResponse(
        report_type=report_type,
        portfolio_id=portfolio_id,
        data=data,
    )


@router.get("/cache/stats", response_model=CacheStatsSchema)
def get_cache_stats() -> CacheStatsSchema:
    svc = _get_service()
    stats = svc.get_cache_stats()
    return CacheStatsSchema(**stats)


@router.post("/cache/clear")
def clear_cache() -> Dict[str, str]:
    svc = _get_service()
    svc.clear_cache()
    return {"status": "cleared"}
