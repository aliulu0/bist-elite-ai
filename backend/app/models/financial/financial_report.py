from sqlalchemy import Column, String, Float, Integer, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class FinancialReport(BaseModel):
    __tablename__ = "financial_reports"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    period: Mapped[str] = mapped_column(String(10), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[int] = mapped_column(Integer, nullable=False)
    revenue: Mapped[float] = mapped_column(Float, nullable=True)
    gross_profit: Mapped[float] = mapped_column(Float, nullable=True)
    ebitda: Mapped[float] = mapped_column(Float, nullable=True)
    operating_profit: Mapped[float] = mapped_column(Float, nullable=True)
    net_profit: Mapped[float] = mapped_column(Float, nullable=True)
    equity: Mapped[float] = mapped_column(Float, nullable=True)
    assets: Mapped[float] = mapped_column(Float, nullable=True)
    liabilities: Mapped[float] = mapped_column(Float, nullable=True)
    cash: Mapped[float] = mapped_column(Float, nullable=True)
    net_debt: Mapped[float] = mapped_column(Float, nullable=True)
    shares: Mapped[float] = mapped_column(Float, nullable=True)
    eps: Mapped[float] = mapped_column(Float, nullable=True)

    company = relationship("Company", back_populates="financial_reports")

    __table_args__ = (
        Index("idx_financial_report_company_period", "company_id", "period", unique=True),
        Index("idx_financial_report_company_year", "company_id", "year"),
        Index("idx_financial_report_company_quarter", "company_id", "quarter"),
        Index("idx_financial_report_year_quarter", "year", "quarter"),
    )
