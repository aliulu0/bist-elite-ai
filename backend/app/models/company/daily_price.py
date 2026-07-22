from sqlalchemy import String, Float, Integer, Date, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class DailyPrice(BaseModel):
    __tablename__ = "daily_prices"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[str] = mapped_column(Date, nullable=False)
    open: Mapped[float] = mapped_column(Float, nullable=False)
    high: Mapped[float] = mapped_column(Float, nullable=False)
    low: Mapped[float] = mapped_column(Float, nullable=False)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    adjusted_close: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    turnover: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    vwap: Mapped[float | None] = mapped_column(Float, nullable=True)
    trade_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    stock_code: Mapped[str | None] = mapped_column(String(10), nullable=True)

    company = relationship("Company", back_populates="daily_prices")

    __table_args__ = (
        Index("idx_daily_price_company_date", "company_id", "date", unique=True),
        Index("idx_daily_price_date", "date"),
        Index("idx_daily_price_company_id", "company_id"),
        Index("idx_daily_price_volume", "volume"),
    )
