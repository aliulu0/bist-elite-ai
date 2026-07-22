from sqlalchemy import String, Float, Date, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class PriceStatistics(BaseModel):
    __tablename__ = "price_statistics"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    as_of_date: Mapped[str] = mapped_column(Date, nullable=False)

    avg_volume_5: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_volume_10: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_volume_20: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_volume_50: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_volume_100: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_volume_200: Mapped[float | None] = mapped_column(Float, nullable=True)

    gap_up: Mapped[bool] = mapped_column(default=False, nullable=False)
    gap_down: Mapped[bool] = mapped_column(default=False, nullable=False)

    week_52_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    week_52_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    all_time_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    all_time_low: Mapped[float | None] = mapped_column(Float, nullable=True)

    daily_return: Mapped[float | None] = mapped_column(Float, nullable=True)
    weekly_return: Mapped[float | None] = mapped_column(Float, nullable=True)
    monthly_return: Mapped[float | None] = mapped_column(Float, nullable=True)
    yearly_return: Mapped[float | None] = mapped_column(Float, nullable=True)
    log_return: Mapped[float | None] = mapped_column(Float, nullable=True)

    historical_volatility: Mapped[float | None] = mapped_column(Float, nullable=True)
    atr_data: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_daily_range: Mapped[float | None] = mapped_column(Float, nullable=True)

    relative_volume: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    turnover_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    liquidity_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    higher_high: Mapped[bool | None] = mapped_column(nullable=True)
    lower_low: Mapped[bool | None] = mapped_column(nullable=True)
    higher_low: Mapped[bool | None] = mapped_column(nullable=True)
    lower_high: Mapped[bool | None] = mapped_column(nullable=True)
    trend_direction: Mapped[str | None] = mapped_column(String(20), nullable=True)

    company = relationship("Company")

    __table_args__ = (
        Index("idx_price_stats_company_date", "company_id", "as_of_date", unique=True),
        Index("idx_price_stats_as_of_date", "as_of_date"),
        Index("idx_price_stats_company_id", "company_id"),
        Index("idx_price_stats_trend", "trend_direction"),
    )
