from sqlalchemy import String, Float, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_model import BaseModel


class Stock(BaseModel):
    __tablename__ = "stocks"

    stock_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sector: Mapped[str | None] = mapped_column(String(100), nullable=True)
    market: Mapped[str] = mapped_column(String(50), nullable=False, default="BIST")
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("idx_stock_code", "stock_code"),
    )
