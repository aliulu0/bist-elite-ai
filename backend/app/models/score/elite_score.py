from sqlalchemy import Column, String, Float, Date, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class EliteScore(BaseModel):
    __tablename__ = "elite_scores"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    analysis_date: Mapped[str] = mapped_column(Date, nullable=False)

    weekly_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    one_month_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    three_month_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    five_month_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    one_year_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    technical_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    fundamental_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    smart_money_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    story_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    explosion_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    elite_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    company = relationship("Company", back_populates="elite_scores")

    __table_args__ = (
        Index("idx_elite_score_company_date", "company_id", "analysis_date", unique=True),
        Index("idx_elite_score_elite", "elite_score"),
        Index("idx_elite_score_analysis_date", "analysis_date"),
        Index("idx_elite_score_company_id", "company_id"),
    )
