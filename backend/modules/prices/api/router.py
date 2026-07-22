from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from modules.prices.services.price_service import PriceService
from modules.prices.schemas.price import (
    PriceHistoryResponse,
    PriceLatestResponse,
    PriceWeeklyResponse,
    PriceMonthlyResponse,
    PriceResponse,
    PriceDateRequest,
    PriceUpdateRequest,
    PriceUpdateResponse,
    PriceBulkUpdateResponse,
)

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("/history/{stock_code}", response_model=PriceHistoryResponse)
def get_price_history(
    stock_code: str,
    start_date: date | None = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end_date: date | None = Query(default=None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(default=500, ge=1, le=5000, description="Max records to return"),
    db: Session = Depends(get_db),
):
    service = PriceService(db)
    try:
        result = service.get_price_history(stock_code, start_date, end_date, limit)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No price data found for {stock_code}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/latest/{stock_code}", response_model=PriceLatestResponse)
def get_latest_price(
    stock_code: str,
    db: Session = Depends(get_db),
):
    service = PriceService(db)
    try:
        result = service.get_latest_price(stock_code)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No price data found for {stock_code}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/weekly/{stock_code}", response_model=PriceWeeklyResponse)
def get_weekly_prices(
    stock_code: str,
    limit: int = Query(default=52, ge=1, le=200, description="Max weeks"),
    db: Session = Depends(get_db),
):
    service = PriceService(db)
    try:
        result = service.get_weekly_prices(stock_code, limit)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No price data found for {stock_code}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/monthly/{stock_code}", response_model=PriceMonthlyResponse)
def get_monthly_prices(
    stock_code: str,
    limit: int = Query(default=24, ge=1, le=120, description="Max months"),
    db: Session = Depends(get_db),
):
    service = PriceService(db)
    try:
        result = service.get_monthly_prices(stock_code, limit)
        if result is None:
            raise HTTPException(status_code=404, detail=f"No price data found for {stock_code}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/date", response_model=list[PriceResponse])
def get_prices_for_date(
    target_date: date = Query(..., description="Target date (YYYY-MM-DD)"),
    stock_codes: list[str] | None = Query(default=None, description="Filter by stock codes"),
    db: Session = Depends(get_db),
):
    service = PriceService(db)
    return service.get_prices_for_date(target_date, stock_codes)


@router.post("/update", response_model=PriceUpdateResponse)
def update_prices(
    request: PriceUpdateRequest,
    db: Session = Depends(get_db),
):
    service = PriceService(db)
    try:
        return service.update_prices(
            request.stock_code,
            request.start_date,
            request.end_date,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/update-all", response_model=PriceBulkUpdateResponse)
def update_all_prices(db: Session = Depends(get_db)):
    service = PriceService(db)
    return service.update_all_prices()
