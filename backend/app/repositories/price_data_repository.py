from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.models.price_data import PriceData


class PriceDataRepository(BaseRepository[PriceData]):
    def __init__(self, db: Session):
        super().__init__(PriceData, db)

    def get_by_stock_and_date(
        self, stock_id: str, target_date: date
    ) -> Optional[PriceData]:
        return (
            self.db.query(PriceData)
            .filter(PriceData.stock_id == stock_id, PriceData.date == target_date)
            .first()
        )

    def get_date_range(
        self, stock_id: str, start_date: date, end_date: date
    ) -> List[PriceData]:
        return (
            self.db.query(PriceData)
            .filter(
                PriceData.stock_id == stock_id,
                PriceData.date >= start_date,
                PriceData.date <= end_date,
            )
            .order_by(PriceData.date.asc())
            .all()
        )

    def get_latest(self, stock_id: str, limit: int = 1) -> List[PriceData]:
        return (
            self.db.query(PriceData)
            .filter(PriceData.stock_id == stock_id)
            .order_by(PriceData.date.desc())
            .limit(limit)
            .all()
        )
