from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.database import get_db
from app.services.stock_service import StockService
from app.schemas.responses import (
    StockResponse,
    StockCreate,
    StockUpdate,
    ApiResponse,
    PaginatedResponse,
)

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/", response_model=PaginatedResponse)
def list_stocks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    service = StockService(db)
    stocks = service.get_all_stocks(skip=skip, limit=limit)
    return PaginatedResponse(
        items=[s.model_dump() for s in stocks],
        total=service.repository.count(),
        skip=skip,
        limit=limit,
    )


@router.get("/search", response_model=List[StockResponse])
def search_stocks(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    service = StockService(db)
    return service.search_stocks(q)


@router.get("/{stock_id}", response_model=StockResponse)
def get_stock(stock_id: str, db: Session = Depends(get_db)):
    service = StockService(db)
    stock = service.get_stock(stock_id)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock


@router.post("/", response_model=StockResponse, status_code=201)
def create_stock(data: StockCreate, db: Session = Depends(get_db)):
    service = StockService(db)
    return service.create_stock(data)


@router.put("/{stock_id}", response_model=StockResponse)
def update_stock(
    stock_id: str, data: StockUpdate, db: Session = Depends(get_db)
):
    service = StockService(db)
    stock = service.update_stock(stock_id, data)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock


@router.delete("/{stock_id}", response_model=ApiResponse)
def delete_stock(stock_id: str, db: Session = Depends(get_db)):
    service = StockService(db)
    deleted = service.delete_stock(stock_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Stock not found")
    return ApiResponse(message="Stock deleted successfully")
