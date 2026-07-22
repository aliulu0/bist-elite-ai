from sqlalchemy import Column, String, Float, Integer, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class BacktestResult(BaseModel):
    __tablename__ = "backtest_results"

    backtest_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("backtests.id", ondelete="CASCADE"), nullable=False
    )
    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    total_return: Mapped[float | None] = mapped_column(Float, nullable=True)
    annual_return: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_drawdown: Mapped[float | None] = mapped_column(Float, nullable=True)
    sharpe_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    win_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_trades: Mapped[int | None] = mapped_column(Integer, nullable=True)

    backtest = relationship("Backtest", back_populates="results")
    company = relationship("Company", back_populates="backtest_results")

    __table_args__ = (
        Index("idx_backtest_result_backtest_id", "backtest_id"),
        Index("idx_backtest_result_company_id", "company_id"),
        Index("idx_backtest_result_backtest_company", "backtest_id", "company_id", unique=True),
    )
