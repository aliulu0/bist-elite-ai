from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
import asyncio

from app.db.database import get_db
from modules.data_engine.services.update_service import UpdateService
from modules.data_engine.services.company_service import CompanyService
from modules.data_engine.services.news_service import NewsService
from modules.data_engine.utils.progress import progress_tracker

router = APIRouter(prefix="/data-engine", tags=["data-engine"])


@router.get("/status")
async def get_status(db: Session = Depends(get_db)):
    service = UpdateService(db)
    return service.get_progress()


@router.get("/last-update")
async def get_last_update(db: Session = Depends(get_db)):
    service = UpdateService(db)
    return service.get_last_update_info()


@router.post("/update/companies")
async def update_companies(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    service = UpdateService(db)
    result = await service.update_companies()
    return result


@router.post("/update/prices")
async def update_prices(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    service = UpdateService(db)
    result = await service.update_prices()
    return result


@router.post("/update/financials")
async def update_financials(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    service = UpdateService(db)
    result = await service.update_financials()
    return result


@router.post("/update/technicals")
async def update_technicals(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    service = UpdateService(db)
    result = await service.update_technicals()
    return result


@router.post("/update/all")
async def update_all(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    service = UpdateService(db)
    result = await service.update_all()
    return result


@router.get("/companies")
async def list_companies(db: Session = Depends(get_db)):
    service = CompanyService(db)
    companies = service.get_all()
    return {
        "count": len(companies),
        "companies": [
            {
                "id": c.id,
                "stock_code": c.stock_code,
                "company_name": c.company_name,
                "sector": c.sector,
                "market": c.market,
                "active": c.active,
            }
            for c in companies
        ],
    }


@router.get("/companies/{stock_code}")
async def get_company(stock_code: str, db: Session = Depends(get_db)):
    service = CompanyService(db)
    company = service.get_by_stock_code(stock_code.upper())
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return {
        "id": company.id,
        "stock_code": company.stock_code,
        "company_name": company.company_name,
        "sector": company.sector,
        "market": company.market,
    }


@router.get("/sectors")
async def list_sectors(db: Session = Depends(get_db)):
    from modules.data_engine.services.sector_service import SectorService
    service = SectorService(db)
    sectors = service.get_all_sectors()
    return {
        "count": len(sectors),
        "sectors": [
            {
                "sector": s.sector,
                "date": str(s.date),
                "strength_score": s.strength_score,
                "momentum": s.momentum,
            }
            for s in sectors
        ],
    }


@router.post("/news")
async def fetch_news(
    limit: int = 50,
    db: Session = Depends(get_db),
):
    service = NewsService(db)
    result = await service.fetch_latest_news(limit)
    return result


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "module": "data_engine",
    }
