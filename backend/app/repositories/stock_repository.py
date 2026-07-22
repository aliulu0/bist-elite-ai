from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.models.stock import Stock


class StockRepository(BaseRepository[Stock]):
    def __init__(self, db: Session):
        super().__init__(Stock, db)

    def get_by_symbol(self, symbol: str) -> Optional[Stock]:
        return self.db.query(Stock).filter(Stock.symbol == symbol).first()

    def get_by_sector(self, sector: str) -> List[Stock]:
        return self.db.query(Stock).filter(Stock.sector == sector).all()

    def get_active_stocks(self) -> List[Stock]:
        return self.db.query(Stock).filter(Stock.is_active == True).all()

    def search(self, query: str) -> List[Stock]:
        return self.db.query(Stock).filter(
            (Stock.symbol.ilike(f"%{query}%")) | (Stock.name.ilike(f"%{query}%"))
        ).all()
