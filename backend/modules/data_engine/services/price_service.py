from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import date
import pandas as pd

from modules.data_engine.repositories.price_repository import PriceRepository
from modules.data_engine.repositories.company_repository import CompanyRepository
from modules.data_engine.providers.base.provider_registry import registry
from modules.data_engine.providers.models.enums import ProviderType
from modules.data_engine.providers.models.schemas import PriceData
from modules.data_engine.validators.validation_service import ValidationService
from modules.data_engine.utils.logger import logger
from modules.data_engine.utils.cache import cache
from app.models.company.daily_price import DailyPrice


class PriceService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = PriceRepository(db)
        self.company_repository = CompanyRepository(db)
        self.validator = ValidationService()

    def _get_manager(self):
        return registry.get_manager(ProviderType.PRICE)

    def get_latest_prices(self, company_id: str, limit: int = 30) -> List[DailyPrice]:
        return (
            self.db.query(DailyPrice)
            .filter(DailyPrice.company_id == company_id)
            .order_by(DailyPrice.date.desc())
            .limit(limit)
            .all()
        )

    async def update_prices_for_company(
        self, stock_code: str, company_id: str
    ) -> dict:
        try:
            cache_key = f"price_update:{stock_code}"
            if cache.has(cache_key):
                return {"success": True, "message": "Already updated", "count": 0}

            manager = self._get_manager()
            result = await manager.execute(stock_code=stock_code)

            if not result["success"]:
                return {"success": False, "message": result.get("error", "All providers failed"), "count": 0}

            data = result["data"]
            if not data:
                return {"success": False, "message": "No price data fetched"}

            if isinstance(data[0], PriceData):
                df = pd.DataFrame([p.to_dict() for p in data])
            else:
                df = pd.DataFrame(data)

            validation = self.validator.validate_prices(df)
            if not validation.is_valid:
                return {"success": False, "errors": validation.errors}

            if validation.warnings:
                for w in validation.warnings:
                    logger.warning(f"Price validation for {stock_code}: {w}")

            count = self.repository.bulk_insert(
                validation.cleaned_data if hasattr(validation, 'cleaned_data') else df,
                company_id,
            )
            cache.set(cache_key, True, ttl=3600)
            return {
                "success": True,
                "message": f"Updated {count} prices",
                "count": count,
                "provider": result.get("provider", "unknown"),
            }
        except Exception as e:
            logger.error(f"Price update failed for {stock_code}: {str(e)}")
            return {"success": False, "message": str(e), "count": 0}

    async def update_all_prices(self, companies: list) -> dict:
        total_updated = 0
        errors = []
        for company in companies:
            result = await self.update_prices_for_company(
                company.stock_code, company.id
            )
            if result["success"]:
                total_updated += result.get("count", 0)
            else:
                errors.append(f"{company.stock_code}: {result['message']}")
        return {
            "success": len(errors) == 0,
            "total_updated": total_updated,
            "errors": errors,
        }
