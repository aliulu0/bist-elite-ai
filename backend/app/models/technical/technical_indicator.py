from sqlalchemy import Column, String, Float, Date, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class TechnicalIndicator(BaseModel):
    __tablename__ = "technical_indicators"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[str] = mapped_column(Date, nullable=False)

    sma_9: Mapped[float | None] = mapped_column(Float, nullable=True)
    sma_20: Mapped[float | None] = mapped_column(Float, nullable=True)
    sma_50: Mapped[float | None] = mapped_column(Float, nullable=True)
    sma_100: Mapped[float | None] = mapped_column(Float, nullable=True)
    sma_200: Mapped[float | None] = mapped_column(Float, nullable=True)

    ema_9: Mapped[float | None] = mapped_column(Float, nullable=True)
    ema_20: Mapped[float | None] = mapped_column(Float, nullable=True)
    ema_50: Mapped[float | None] = mapped_column(Float, nullable=True)
    ema_100: Mapped[float | None] = mapped_column(Float, nullable=True)
    ema_200: Mapped[float | None] = mapped_column(Float, nullable=True)

    rsi: Mapped[float | None] = mapped_column(Float, nullable=True)
    stochastic_rsi: Mapped[float | None] = mapped_column(Float, nullable=True)
    macd: Mapped[float | None] = mapped_column(Float, nullable=True)
    macd_signal: Mapped[float | None] = mapped_column(Float, nullable=True)
    adx: Mapped[float | None] = mapped_column(Float, nullable=True)
    atr: Mapped[float | None] = mapped_column(Float, nullable=True)

    obv: Mapped[float | None] = mapped_column(Float, nullable=True)
    cmf: Mapped[float | None] = mapped_column(Float, nullable=True)
    vwap: Mapped[float | None] = mapped_column(Float, nullable=True)
    mfi: Mapped[float | None] = mapped_column(Float, nullable=True)

    ichimoku: Mapped[float | None] = mapped_column(Float, nullable=True)
    supertrend: Mapped[float | None] = mapped_column(Float, nullable=True)

    bollinger_upper: Mapped[float | None] = mapped_column(Float, nullable=True)
    bollinger_middle: Mapped[float | None] = mapped_column(Float, nullable=True)
    bollinger_lower: Mapped[float | None] = mapped_column(Float, nullable=True)

    donchian_upper: Mapped[float | None] = mapped_column(Float, nullable=True)
    donchian_lower: Mapped[float | None] = mapped_column(Float, nullable=True)

    company = relationship("Company", back_populates="technical_indicators")

    __table_args__ = (
        Index("idx_tech_indicator_company_date", "company_id", "date", unique=True),
        Index("idx_tech_indicator_date", "date"),
        Index("idx_tech_indicator_company_id", "company_id"),
        Index("idx_tech_indicator_rsi", "rsi"),
    )
