from typing import Optional, List
from sqlalchemy.orm import Session

from modules.data_engine.repositories.company_repository import CompanyRepository
from modules.data_engine.providers.base.provider_registry import registry
from modules.data_engine.providers.models.enums import ProviderType
from modules.data_engine.providers.models.schemas import CompanyData
from modules.data_engine.validators.validation_service import ValidationService
from modules.data_engine.utils.logger import logger
from modules.data_engine.utils.cache import cached
from app.models.company.company import Company
import pandas as pd


class CompanyService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = CompanyRepository(db)
        self.validator = ValidationService()

    def _get_manager(self):
        return registry.get_manager(ProviderType.PRICE)

    def get_all(self) -> List[Company]:
        return self.repository.get_all_active()

    def get_by_stock_code(self, stock_code: str) -> Optional[Company]:
        return self.repository.get_by_stock_code(stock_code)

    def get_by_id(self, company_id: str) -> Optional[Company]:
        return self.db.query(Company).filter(Company.id == company_id).first()

    async def sync_companies(self) -> dict:
        try:
            manager = self._get_manager()
            result = await manager.execute(mode="companies")

            if not result["success"]:
                return {"success": False, "message": result.get("error", "All providers failed")}

            data = result["data"]
            if not data:
                return {"success": False, "message": "No company data fetched"}

            if isinstance(data[0], CompanyData):
                df = pd.DataFrame([c.to_dict() for c in data])
            else:
                df = pd.DataFrame(data)

            validation = self.validator.validate_companies(df)
            if not validation.is_valid:
                return {"success": False, "errors": validation.errors}

            if validation.warnings:
                for w in validation.warnings:
                    logger.warning(f"Company validation: {w}")

            count = self.repository.upsert_from_dataframe(df)
            return {
                "success": True,
                "message": f"Synced {count} companies",
                "count": count,
                "provider": result.get("provider", "unknown"),
            }
        except Exception as e:
            logger.error(f"Company sync failed: {str(e)}")
            return {"success": False, "message": str(e)}

    def get_stock_code_map(self) -> dict[str, str]:
        companies = self.repository.get_all_active()
        return {c.stock_code: c.id for c in companies}
