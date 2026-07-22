from typing import Optional
from sqlalchemy.orm import Session
import pandas as pd

from modules.data_engine.providers.base.provider_registry import registry
from modules.data_engine.providers.models.enums import ProviderType
from modules.data_engine.utils.logger import logger


class NewsService:
    def __init__(self, db: Session):
        self.db = db

    def _get_manager(self):
        return registry.get_manager(ProviderType.NEWS)

    async def fetch_latest_news(self, limit: int = 50) -> dict:
        try:
            manager = self._get_manager()
            result = await manager.execute(limit=limit)

            if not result["success"]:
                return {"success": False, "message": result.get("error", "All providers failed")}

            data = result["data"]
            if not data:
                return {"success": False, "message": "No news fetched"}

            return {
                "success": True,
                "count": len(data),
                "news": [n.to_dict() for n in data] if hasattr(data[0], "to_dict") else data,
                "provider": result.get("provider", "unknown"),
            }
        except Exception as e:
            logger.error(f"News fetch failed: {str(e)}")
            return {"success": False, "message": str(e)}
