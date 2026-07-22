from sqlalchemy import String, Float, Integer, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class FinancialRatio(BaseModel):
    __tablename__ = "fin_engine_ratios"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    period: Mapped[str] = mapped_column(String(10), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[int] = mapped_column(Integer, nullable=False)
    report_type: Mapped[str] = mapped_column(String(20), nullable=False, default="quarterly")

    pe_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    pb_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    ev_ebitda: Mapped[float | None] = mapped_column(Float, nullable=True)
    ev_sales: Mapped[float | None] = mapped_column(Float, nullable=True)
    peg_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_sales: Mapped[float | None] = mapped_column(Float, nullable=True)
    enterprise_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    gross_margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    operating_margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    ebitda_margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_margin: Mapped[float | None] = mapped_column(Float, nullable=True)
    fcf_margin: Mapped[float | None] = mapped_column(Float, nullable=True)

    roe: Mapped[float | None] = mapped_column(Float, nullable=True)
    roa: Mapped[float | None] = mapped_column(Float, nullable=True)
    roic: Mapped[float | None] = mapped_column(Float, nullable=True)
    roce: Mapped[float | None] = mapped_column(Float, nullable=True)
    gross_return: Mapped[float | None] = mapped_column(Float, nullable=True)

    debt_equity: Mapped[float | None] = mapped_column(Float, nullable=True)
    debt_assets: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_debt_ebitda: Mapped[float | None] = mapped_column(Float, nullable=True)
    interest_coverage: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    quick_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    cash_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)

    asset_turnover: Mapped[float | None] = mapped_column(Float, nullable=True)
    inventory_turnover: Mapped[float | None] = mapped_column(Float, nullable=True)
    receivable_turnover: Mapped[float | None] = mapped_column(Float, nullable=True)
    cash_conversion_cycle: Mapped[float | None] = mapped_column(Float, nullable=True)

    revenue_growth_q: Mapped[float | None] = mapped_column(Float, nullable=True)
    revenue_growth_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    revenue_cagr_3y: Mapped[float | None] = mapped_column(Float, nullable=True)
    revenue_cagr_5y: Mapped[float | None] = mapped_column(Float, nullable=True)
    profit_growth_q: Mapped[float | None] = mapped_column(Float, nullable=True)
    profit_growth_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    profit_cagr_3y: Mapped[float | None] = mapped_column(Float, nullable=True)
    profit_cagr_5y: Mapped[float | None] = mapped_column(Float, nullable=True)
    eps_growth_q: Mapped[float | None] = mapped_column(Float, nullable=True)
    eps_growth_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    eps_cagr_3y: Mapped[float | None] = mapped_column(Float, nullable=True)
    eps_cagr_5y: Mapped[float | None] = mapped_column(Float, nullable=True)
    book_value_growth_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    book_value_cagr_3y: Mapped[float | None] = mapped_column(Float, nullable=True)
    book_value_cagr_5y: Mapped[float | None] = mapped_column(Float, nullable=True)
    ebitda_growth_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    fcf_growth_y: Mapped[float | None] = mapped_column(Float, nullable=True)

    ttm_revenue: Mapped[float | None] = mapped_column(Float, nullable=True)
    ttm_net_profit: Mapped[float | None] = mapped_column(Float, nullable=True)
    ttm_eps: Mapped[float | None] = mapped_column(Float, nullable=True)
    ttm_ebitda: Mapped[float | None] = mapped_column(Float, nullable=True)
    ttm_fcf: Mapped[float | None] = mapped_column(Float, nullable=True)

    company = relationship("Company")

    __table_args__ = (
        Index(
            "idx_fin_ratio_engine_company_period",
            "company_id",
            "period",
            "report_type",
            unique=True,
        ),
        Index("idx_fin_ratio_engine_roe", "roe"),
        Index("idx_fin_ratio_engine_pe", "pe_ratio"),
    )
