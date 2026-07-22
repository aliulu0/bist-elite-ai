from typing import Optional, List
from sqlalchemy.orm import Session
import pandas as pd

from modules.data_engine.repositories.financial_repository import FinancialRepository
from modules.data_engine.repositories.company_repository import CompanyRepository
from modules.data_engine.providers.base.provider_registry import registry
from modules.data_engine.providers.models.enums import ProviderType
from modules.data_engine.providers.models.schemas import FinancialData
from modules.data_engine.validators.validation_service import ValidationService
from modules.data_engine.utils.logger import logger
from modules.data_engine.utils.cache import cache
from app.models.financial.financial_report import FinancialReport


class FinancialService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = FinancialRepository(db)
        self.company_repository = CompanyRepository(db)
        self.validator = ValidationService()

    def _get_manager(self):
        return registry.get_manager(ProviderType.FINANCIAL)

    def get_financials(self, company_id: str) -> List[FinancialReport]:
        return (
            self.db.query(FinancialReport)
            .filter(FinancialReport.company_id == company_id)
            .order_by(FinancialReport.year.desc(), FinancialReport.quarter.desc())
            .all()
        )

    async def update_financials_for_company(
        self, stock_code: str, company_id: str
    ) -> dict:
        try:
            cache_key = f"financial_update:{stock_code}"
            if cache.has(cache_key):
                return {"success": True, "message": "Already updated", "count": 0}

            manager = self._get_manager()
            result = await manager.execute(stock_code=stock_code)

            if not result["success"]:
                return {"success": False, "message": result.get("error", "All providers failed"), "count": 0}

            data = result["data"]
            if not data:
                return {"success": False, "message": "No financial data fetched"}

            if isinstance(data[0], FinancialData):
                df = pd.DataFrame([f.to_dict() for f in data])
            else:
                df = pd.DataFrame(data)

            validation = self.validator.validate_financials(df)
            if not validation.is_valid:
                return {"success": False, "errors": validation.errors}

            if validation.warnings:
                for w in validation.warnings:
                    logger.warning(f"Financial validation for {stock_code}: {w}")

            count = self.repository.upsert_from_dataframe(df, company_id)
            cache.set(cache_key, True, ttl=3600)
            return {
                "success": True,
                "message": f"Updated {count} financial records",
                "count": count,
                "provider": result.get("provider", "unknown"),
            }
        except Exception as e:
            logger.error(f"Financial update failed for {stock_code}: {str(e)}")
            return {"success": False, "message": str(e), "count": 0}

    async def update_all_financials(self, companies: list) -> dict:
        total_updated = 0
        errors = []
        for company in companies:
            result = await self.update_financials_for_company(
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
