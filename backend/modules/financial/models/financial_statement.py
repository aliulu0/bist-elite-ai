from sqlalchemy import String, Float, Integer, Boolean, Date, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class FinancialStatement(BaseModel):
    __tablename__ = "financial_statements"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    period: Mapped[str] = mapped_column(String(10), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[int] = mapped_column(Integer, nullable=False)
    report_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="quarterly"
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="TRY")
    is_restated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    filing_date: Mapped[str | None] = mapped_column(Date, nullable=True)

    revenue: Mapped[float | None] = mapped_column(Float, nullable=True)
    cost_of_sales: Mapped[float | None] = mapped_column(Float, nullable=True)
    gross_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    operating_expenses: Mapped[float | None] = mapped_column(Float, nullable=True)
    operating_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    ebit: Mapped[float | None] = mapped_column(Float, nullable=True)
    ebitda: Mapped[float | None] = mapped_column(Float, nullable=True)
    pretax_income: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    eps: Mapped[float | None] = mapped_column(Float, nullable=True)
    diluted_eps: Mapped[float | None] = mapped_column(Float, nullable=True)
    shares_outstanding: Mapped[float | None] = mapped_column(Float, nullable=True)

    cash: Mapped[float | None] = mapped_column(Float, nullable=True)
    cash_equivalents: Mapped[float | None] = mapped_column(Float, nullable=True)
    receivables: Mapped[float | None] = mapped_column(Float, nullable=True)
    inventories: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_assets: Mapped[float | None] = mapped_column(Float, nullable=True)
    fixed_assets: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_assets: Mapped[float | None] = mapped_column(Float, nullable=True)
    short_term_debt: Mapped[float | None] = mapped_column(Float, nullable=True)
    long_term_debt: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_debt: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_liabilities: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_liabilities: Mapped[float | None] = mapped_column(Float, nullable=True)
    equity: Mapped[float | None] = mapped_column(Float, nullable=True)
    book_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_debt: Mapped[float | None] = mapped_column(Float, nullable=True)
    working_capital: Mapped[float | None] = mapped_column(Float, nullable=True)

    operating_cash_flow: Mapped[float | None] = mapped_column(Float, nullable=True)
    investing_cash_flow: Mapped[float | None] = mapped_column(Float, nullable=True)
    financing_cash_flow: Mapped[float | None] = mapped_column(Float, nullable=True)
    capital_expenditure: Mapped[float | None] = mapped_column(Float, nullable=True)
    free_cash_flow: Mapped[float | None] = mapped_column(Float, nullable=True)
    dividend_paid: Mapped[float | None] = mapped_column(Float, nullable=True)
    share_buyback: Mapped[float | None] = mapped_column(Float, nullable=True)

    company = relationship("Company")

    __table_args__ = (
        Index(
            "idx_fin_stmt_company_period_type",
            "company_id",
            "period",
            "report_type",
            unique=True,
        ),
        Index("idx_fin_stmt_company_year", "company_id", "year"),
        Index("idx_fin_stmt_period", "period"),
        Index("idx_fin_stmt_report_type", "report_type"),
    )
