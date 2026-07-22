from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from modules.financial.services.financial_service import FinancialService
from modules.financial.schemas.financial import (
    FinancialLatestResponse,
    FinancialHistoryResponse,
    FinancialRatiosResponse,
    FinancialDividendsResponse,
    FinancialQualityResponse,
    GrowthResponse,
    FinancialUpdateRequest,
    FinancialUpdateResponse,
    FinancialBulkUpdateResponse,
)

router = APIRouter(prefix="/financial", tags=["financial"])


@router.get("/latest/{stock_code}", response_model=FinancialLatestResponse)
def get_financial_latest(
    stock_code: str,
    db: Session = Depends(get_db),
):
    service = FinancialService(db)
    try:
        result = service.get_latest(stock_code)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No financial data for {stock_code}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/history/{stock_code}", response_model=FinancialHistoryResponse)
def get_financial_history(
    stock_code: str,
    report_type: str | None = Query(default=None, description="Filter by report type"),
    limit: int = Query(default=50, ge=1, le=200, description="Max records"),
    db: Session = Depends(get_db),
):
    service = FinancialService(db)
    try:
        result = service.get_history(stock_code, report_type, limit)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No financial data for {stock_code}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/ratios/{stock_code}", response_model=FinancialRatiosResponse)
def get_financial_ratios(
    stock_code: str,
    report_type: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    service = FinancialService(db)
    try:
        result = service.get_ratios(stock_code, report_type, limit)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No ratio data for {stock_code}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/growth/{stock_code}", response_model=GrowthResponse)
def get_financial_growth(
    stock_code: str,
    db: Session = Depends(get_db),
):
    service = FinancialService(db)
    try:
        result = service.get_growth(stock_code)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No growth data for {stock_code}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/dividends/{stock_code}", response_model=FinancialDividendsResponse)
def get_financial_dividends(
    stock_code: str,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    service = FinancialService(db)
    try:
        result = service.get_dividends(stock_code, limit)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No dividend data for {stock_code}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/quality/{stock_code}", response_model=FinancialQualityResponse)
def get_financial_quality(
    stock_code: str,
    db: Session = Depends(get_db),
):
    service = FinancialService(db)
    try:
        result = service.get_quality(stock_code)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No quality data for {stock_code}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/update", response_model=FinancialUpdateResponse)
def update_financials(
    request: FinancialUpdateRequest,
    db: Session = Depends(get_db),
):
    service = FinancialService(db)
    try:
        return service.update_financials(request.stock_code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/update-all", response_model=FinancialBulkUpdateResponse)
def update_all_financials(db: Session = Depends(get_db)):
    service = FinancialService(db)
    return service.update_all()
