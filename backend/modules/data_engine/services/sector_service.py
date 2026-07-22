from typing import Optional
from sqlalchemy.orm import Session
from datetime import date
import pandas as pd

from modules.data_engine.repositories.sector_repository import SectorRepository
from modules.data_engine.providers.base.provider_registry import registry
from modules.data_engine.providers.models.enums import ProviderType
from modules.data_engine.providers.models.schemas import SectorData
from modules.data_engine.utils.logger import logger
from app.models.analysis.sector_strength import SectorStrength


class SectorService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = SectorRepository(db)

    def _get_manager(self):
        return registry.get_manager(ProviderType.SECTOR)

    def get_all_sectors(self, target_date: Optional[date] = None) -> list:
        query = self.db.query(SectorStrength)
        if target_date:
            query = query.filter(SectorStrength.date == target_date)
        return query.order_by(SectorStrength.strength_score.desc()).all()

    async def update_sector_strength(self) -> dict:
        try:
            manager = self._get_manager()
            result = await manager.execute()

            if not result["success"]:
                return {"success": False, "message": result.get("error", "All providers failed"), "count": 0}

            data = result["data"]
            if not data:
                return {"success": False, "message": "No sector data fetched", "count": 0}

            if isinstance(data[0], SectorData):
                df = pd.DataFrame([s.to_dict() for s in data])
            else:
                df = pd.DataFrame(data)

            count = self.repository.upsert_from_dataframe(df)
            return {
                "success": True,
                "message": f"Updated {count} sectors",
                "count": count,
                "provider": result.get("provider", "unknown"),
            }
        except Exception as e:
            logger.error(f"Sector update failed: {str(e)}")
            return {"success": False, "message": str(e), "count": 0}
