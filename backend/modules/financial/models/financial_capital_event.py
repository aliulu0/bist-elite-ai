from sqlalchemy import String, Float, Date, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class FinancialCapitalEvent(BaseModel):
    __tablename__ = "financial_capital_events"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(30), nullable=False)
    event_date: Mapped[str] = mapped_column(Date, nullable=False)
    ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_adjustment: Mapped[float | None] = mapped_column(Float, nullable=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    company = relationship("Company")

    __table_args__ = (
        Index("idx_fin_cap_company_type_date", "company_id", "event_type", "event_date"),
        Index("idx_fin_cap_event_date", "event_date"),
    )
