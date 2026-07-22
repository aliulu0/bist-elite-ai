from sqlalchemy import Column, String, Float, Text, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class AIAnalysis(BaseModel):
    __tablename__ = "ai_analysis"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    analysis_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    sentiment: Mapped[str | None] = mapped_column(String(20), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="tr", nullable=False)

    company = relationship("Company", back_populates="ai_analyses")

    __table_args__ = (
        Index("idx_ai_analysis_company_id", "company_id"),
        Index("idx_ai_analysis_type", "analysis_type"),
        Index("idx_ai_analysis_company_type", "company_id", "analysis_type"),
        Index("idx_ai_analysis_created_at", "created_at"),
    )
