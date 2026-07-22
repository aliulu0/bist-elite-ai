from sqlalchemy import String, Float, Date, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class FinancialDividend(BaseModel):
    __tablename__ = "financial_dividends"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    ex_date: Mapped[str] = mapped_column(Date, nullable=False)
    payment_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    gross_dividend: Mapped[float] = mapped_column(Float, nullable=False)
    net_dividend: Mapped[float | None] = mapped_column(Float, nullable=True)
    yield_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    payout_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    dividend_per_share: Mapped[float | None] = mapped_column(Float, nullable=True)
    period: Mapped[str | None] = mapped_column(String(10), nullable=True)
    year: Mapped[int | None] = mapped_column(nullable=True)

    company = relationship("Company")

    __table_args__ = (
        Index("idx_fin_div_company_exdate", "company_id", "ex_date", unique=True),
        Index("idx_fin_div_company_id", "company_id"),
        Index("idx_fin_div_ex_date", "ex_date"),
    )
