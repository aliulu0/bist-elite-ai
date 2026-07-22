from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.stock_repository import StockRepository
from app.schemas.responses import StockCreate, StockUpdate, StockResponse


class StockService:
    def __init__(self, db: Session):
        self.repository = StockRepository(db)

    def get_stock(self, id: str) -> Optional[StockResponse]:
        stock = self.repository.get_by_id(id)
        if stock:
            return StockResponse.model_validate(stock)
        return None

    def get_stock_by_symbol(self, symbol: str) -> Optional[StockResponse]:
        stock = self.repository.get_by_symbol(symbol)
        if stock:
            return StockResponse.model_validate(stock)
        return None

    def get_all_stocks(
        self, skip: int = 0, limit: int = 100
    ) -> List[StockResponse]:
        stocks = self.repository.get_all(skip=skip, limit=limit)
        return [StockResponse.model_validate(s) for s in stocks]

    def search_stocks(self, query: str) -> List[StockResponse]:
        stocks = self.repository.search(query)
        return [StockResponse.model_validate(s) for s in stocks]

    def create_stock(self, data: StockCreate) -> StockResponse:
        stock = self.repository.create(data.model_dump())
        return StockResponse.model_validate(stock)

    def update_stock(self, id: str, data: StockUpdate) -> Optional[StockResponse]:
        update_data = data.model_dump(exclude_unset=True)
        stock = self.repository.update(id, update_data)
        if stock:
            return StockResponse.model_validate(stock)
        return None

    def delete_stock(self, id: str) -> bool:
        return self.repository.delete(id)
