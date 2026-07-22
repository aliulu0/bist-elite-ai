from sqlalchemy import String, Float, Integer, DateTime, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from app.db.base_model import BaseModel


class FinancialCalculationLog(BaseModel):
    __tablename__ = "financial_calculation_logs"

    company_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True
    )
    update_type: Mapped[str] = mapped_column(String(20), nullable=False)
    stock_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    records_processed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ratios_calculated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    scores_calculated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    execution_time_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="running")
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    warnings: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    __table_args__ = (
        Index("idx_fin_calc_log_company", "company_id"),
        Index("idx_fin_calc_log_status", "status"),
        Index("idx_fin_calc_log_start", "start_time"),
    )
