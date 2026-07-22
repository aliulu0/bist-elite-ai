from sqlalchemy import String, Float, Integer, Date, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class FinancialQualityScore(BaseModel):
    __tablename__ = "financial_quality_scores"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    period: Mapped[str] = mapped_column(String(10), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[int] = mapped_column(Integer, nullable=False)
    as_of_date: Mapped[str] = mapped_column(Date, nullable=False)

    piotroski_f_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    altman_z_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    beneish_m_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    financial_strength_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    profitability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    growth_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    dividend_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    company = relationship("Company")

    __table_args__ = (
        Index("idx_fin_quality_company_period", "company_id", "period", unique=True),
        Index("idx_fin_quality_piotroski", "piotroski_f_score"),
        Index("idx_fin_quality_altman", "altman_z_score"),
    )
