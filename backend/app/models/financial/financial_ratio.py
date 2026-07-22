from sqlalchemy import Column, String, Float, Integer, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class FinancialRatio(BaseModel):
    __tablename__ = "financial_ratios"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    period: Mapped[str] = mapped_column(String(10), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[int] = mapped_column(Integer, nullable=False)

    pd_dd: Mapped[float | None] = mapped_column(Float, nullable=True)
    fk: Mapped[float | None] = mapped_column(Float, nullable=True)
    fd_favok: Mapped[float | None] = mapped_column(Float, nullable=True)
    peg: Mapped[float | None] = mapped_column(Float, nullable=True)
    ev_sales: Mapped[float | None] = mapped_column(Float, nullable=True)
    roe: Mapped[float | None] = mapped_column(Float, nullable=True)
    roa: Mapped[float | None] = mapped_column(Float, nullable=True)
    roic: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_debt_ebitda: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    quick_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    piotroski: Mapped[float | None] = mapped_column(Float, nullable=True)
    altman: Mapped[float | None] = mapped_column(Float, nullable=True)
    beneish: Mapped[float | None] = mapped_column(Float, nullable=True)
    revenue_growth: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_profit_growth: Mapped[float | None] = mapped_column(Float, nullable=True)
    ebitda_growth: Mapped[float | None] = mapped_column(Float, nullable=True)
    fcf_growth: Mapped[float | None] = mapped_column(Float, nullable=True)

    company = relationship("Company", back_populates="financial_ratios")

    __table_args__ = (
        Index("idx_financial_ratio_company_period", "company_id", "period", unique=True),
        Index("idx_financial_ratio_company_year", "company_id", "year"),
        Index("idx_financial_ratio_roe", "roe"),
        Index("idx_financial_ratio_fk", "fk"),
    )
