from sqlalchemy import Column, String, Float, Integer, Date, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_model import BaseModel


class MarketSummary(BaseModel):
    __tablename__ = "market_summary"

    date: Mapped[str] = mapped_column(Date, nullable=False, unique=True)
    bist_100: Mapped[float] = mapped_column(Float, nullable=False)
    bist_100_change: Mapped[float] = mapped_column(Float, nullable=False)
    bist_100_change_percent: Mapped[float] = mapped_column(Float, nullable=False)
    xu100_futures: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_volume: Mapped[float] = mapped_column(Float, nullable=False)
    total_turnover: Mapped[float] = mapped_column(Float, nullable=False)
    advancing: Mapped[int] = mapped_column(Integer, nullable=False)
    declining: Mapped[int] = mapped_column(Integer, nullable=False)
    unchanged: Mapped[int] = mapped_column(Integer, nullable=False)
    new_highs: Mapped[int] = mapped_column(Integer, nullable=False)
    new_lows: Mapped[int] = mapped_column(Integer, nullable=False)
    foreign_net_buy: Mapped[float | None] = mapped_column(Float, nullable=True)
    tefas_net: Mapped[float | None] = mapped_column(Float, nullable=True)
    usd_try: Mapped[float | None] = mapped_column(Float, nullable=True)
    eur_try: Mapped[float | None] = mapped_column(Float, nullable=True)
    gold_price: Mapped[float | None] = mapped_column(Float, nullable=True)

    __table_args__ = (
        Index("idx_market_summary_date", "date"),
    )
