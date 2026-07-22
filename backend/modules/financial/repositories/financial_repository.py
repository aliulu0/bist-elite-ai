from datetime import date
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import Session

from app.models.company.company import Company
from modules.financial.models.financial_statement import FinancialStatement
from modules.financial.models.financial_ratio import FinancialRatio
from modules.financial.models.financial_dividend import FinancialDividend
from modules.financial.models.financial_capital_event import FinancialCapitalEvent
from modules.financial.models.financial_quality_score import FinancialQualityScore
from modules.financial.models.financial_calculation_log import FinancialCalculationLog


class StatementRepository:

    def __init__(self, db: Session):
        self._db = db

    def get_company_by_stock_code(self, stock_code: str) -> Company | None:
        stmt = select(Company).where(Company.stock_code == stock_code.upper().strip())
        return self._db.execute(stmt).scalar_one_or_none()

    def get_statements(
        self,
        company_id: str,
        report_type: str | None = None,
        limit: int = 50,
    ) -> list[FinancialStatement]:
        stmt = (
            select(FinancialStatement)
            .where(FinancialStatement.company_id == company_id)
            .order_by(desc(FinancialStatement.year), desc(FinancialStatement.quarter))
        )
        if report_type:
            stmt = stmt.where(FinancialStatement.report_type == report_type)
        stmt = stmt.limit(limit)
        return list(self._db.execute(stmt).scalars().all())

    def get_latest_statement(
        self, company_id: str, report_type: str = "quarterly"
    ) -> FinancialStatement | None:
        stmt = (
            select(FinancialStatement)
            .where(
                and_(
                    FinancialStatement.company_id == company_id,
                    FinancialStatement.report_type == report_type,
                )
            )
            .order_by(desc(FinancialStatement.year), desc(FinancialStatement.quarter))
            .limit(1)
        )
        return self._db.execute(stmt).scalar_one_or_none()

    def get_statement_by_period(
        self, company_id: str, period: str, report_type: str = "quarterly"
    ) -> FinancialStatement | None:
        stmt = select(FinancialStatement).where(
            and_(
                FinancialStatement.company_id == company_id,
                FinancialStatement.period == period,
                FinancialStatement.report_type == report_type,
            )
        )
        return self._db.execute(stmt).scalar_one_or_none()

    def upsert_statement(self, company_id: str, data: dict) -> FinancialStatement:
        report_type = data.get("report_type", "quarterly")
        existing = self.get_statement_by_period(
            company_id, data["period"], report_type
        )
        if existing:
            for key, value in data.items():
                if key not in ("period", "report_type") and hasattr(existing, key):
                    setattr(existing, key, value)
            self._db.flush()
            return existing

        stmt = FinancialStatement(company_id=company_id, **data)
        self._db.add(stmt)
        self._db.flush()
        return stmt

    def bulk_upsert_statements(
        self, company_id: str, statements: list[dict]
    ) -> tuple[int, int]:
        added, updated = 0, 0
        _valid_cols = {c.name for c in FinancialStatement.__table__.columns}
        for data in statements:
            report_type = data.get("report_type", "quarterly")
            existing = self.get_statement_by_period(
                company_id, data["period"], report_type
            )
            if existing:
                for key, value in data.items():
                    if key not in ("period", "report_type") and hasattr(existing, key):
                        setattr(existing, key, value)
                updated += 1
            else:
                safe_data = {k: v for k, v in data.items() if k in _valid_cols}
                stmt = FinancialStatement(company_id=company_id, **safe_data)
                self._db.add(stmt)
                added += 1
        self._db.flush()
        return added, updated

    def get_all_periods(self, company_id: str) -> list[str]:
        stmt = (
            select(FinancialStatement.period)
            .where(FinancialStatement.company_id == company_id)
            .distinct()
            .order_by(desc(FinancialStatement.period))
        )
        return [row[0] for row in self._db.execute(stmt).all()]


class RatioRepository:

    def __init__(self, db: Session):
        self._db = db

    def get_ratios(
        self, company_id: str, report_type: str | None = None, limit: int = 50
    ) -> list[FinancialRatio]:
        stmt = (
            select(FinancialRatio)
            .where(FinancialRatio.company_id == company_id)
            .order_by(desc(FinancialRatio.year), desc(FinancialRatio.quarter))
        )
        if report_type:
            stmt = stmt.where(FinancialRatio.report_type == report_type)
        stmt = stmt.limit(limit)
        return list(self._db.execute(stmt).scalars().all())

    def get_latest_ratio(
        self, company_id: str, report_type: str = "quarterly"
    ) -> FinancialRatio | None:
        stmt = (
            select(FinancialRatio)
            .where(
                and_(
                    FinancialRatio.company_id == company_id,
                    FinancialRatio.report_type == report_type,
                )
            )
            .order_by(desc(FinancialRatio.year), desc(FinancialRatio.quarter))
            .limit(1)
        )
        return self._db.execute(stmt).scalar_one_or_none()

    def get_ratio_by_period(
        self, company_id: str, period: str, report_type: str = "quarterly"
    ) -> FinancialRatio | None:
        stmt = select(FinancialRatio).where(
            and_(
                FinancialRatio.company_id == company_id,
                FinancialRatio.period == period,
                FinancialRatio.report_type == report_type,
            )
        )
        return self._db.execute(stmt).scalar_one_or_none()

    def upsert_ratio(self, company_id: str, data: dict) -> FinancialRatio:
        report_type = data.get("report_type", "quarterly")
        existing = self.get_ratio_by_period(company_id, data["period"], report_type)
        if existing:
            for key, value in data.items():
                if key not in ("period", "report_type") and hasattr(existing, key):
                    setattr(existing, key, value)
            self._db.flush()
            return existing
        _valid_cols = {c.name for c in FinancialRatio.__table__.columns}
        safe_data = {k: v for k, v in data.items() if k in _valid_cols}
        ratio = FinancialRatio(company_id=company_id, **safe_data)
        self._db.add(ratio)
        self._db.flush()
        return ratio


class DividendRepository:

    def __init__(self, db: Session):
        self._db = db

    def get_dividends(
        self, company_id: str, limit: int = 50
    ) -> list[FinancialDividend]:
        stmt = (
            select(FinancialDividend)
            .where(FinancialDividend.company_id == company_id)
            .order_by(desc(FinancialDividend.ex_date))
            .limit(limit)
        )
        return list(self._db.execute(stmt).scalars().all())

    def upsert_dividend(self, company_id: str, data: dict) -> FinancialDividend:
        stmt = select(FinancialDividend).where(
            and_(
                FinancialDividend.company_id == company_id,
                FinancialDividend.ex_date == data["ex_date"],
            )
        )
        existing = self._db.execute(stmt).scalar_one_or_none()
        if existing:
            for key, value in data.items():
                if key != "ex_date" and hasattr(existing, key):
                    setattr(existing, key, value)
            self._db.flush()
            return existing
        div = FinancialDividend(company_id=company_id, **data)
        self._db.add(div)
        self._db.flush()
        return div


class CapitalEventRepository:

    def __init__(self, db: Session):
        self._db = db

    def get_events(self, company_id: str, limit: int = 50) -> list[FinancialCapitalEvent]:
        stmt = (
            select(FinancialCapitalEvent)
            .where(FinancialCapitalEvent.company_id == company_id)
            .order_by(desc(FinancialCapitalEvent.event_date))
            .limit(limit)
        )
        return list(self._db.execute(stmt).scalars().all())

    def upsert_event(self, company_id: str, data: dict) -> FinancialCapitalEvent:
        stmt = select(FinancialCapitalEvent).where(
            and_(
                FinancialCapitalEvent.company_id == company_id,
                FinancialCapitalEvent.event_type == data["event_type"],
                FinancialCapitalEvent.event_date == data["event_date"],
            )
        )
        existing = self._db.execute(stmt).scalar_one_or_none()
        if existing:
            for key, value in data.items():
                if key not in ("event_type", "event_date") and hasattr(existing, key):
                    setattr(existing, key, value)
            self._db.flush()
            return existing
        ev = FinancialCapitalEvent(company_id=company_id, **data)
        self._db.add(ev)
        self._db.flush()
        return ev


class QualityScoreRepository:

    def __init__(self, db: Session):
        self._db = db

    def get_latest_score(
        self, company_id: str, report_type: str = "quarterly"
    ) -> FinancialQualityScore | None:
        stmt = (
            select(FinancialQualityScore)
            .where(FinancialQualityScore.company_id == company_id)
            .order_by(desc(FinancialQualityScore.year), desc(FinancialQualityScore.quarter))
            .limit(1)
        )
        return self._db.execute(stmt).scalar_one_or_none()

    def get_score_by_period(
        self, company_id: str, period: str
    ) -> FinancialQualityScore | None:
        stmt = select(FinancialQualityScore).where(
            and_(
                FinancialQualityScore.company_id == company_id,
                FinancialQualityScore.period == period,
            )
        )
        return self._db.execute(stmt).scalar_one_or_none()

    def upsert_score(self, company_id: str, data: dict) -> FinancialQualityScore:
        existing = self.get_score_by_period(company_id, data["period"])
        if existing:
            for key, value in data.items():
                if key != "period" and hasattr(existing, key):
                    setattr(existing, key, value)
            self._db.flush()
            return existing
        score = FinancialQualityScore(company_id=company_id, **data)
        self._db.add(score)
        self._db.flush()
        return score


class CalculationLogRepository:

    def __init__(self, db: Session):
        self._db = db

    def create_log(self, data: dict) -> FinancialCalculationLog:
        log = FinancialCalculationLog(**data)
        self._db.add(log)
        self._db.flush()
        return log

    def update_log(self, log_id: str, data: dict) -> FinancialCalculationLog | None:
        log = self._db.get(FinancialCalculationLog, log_id)
        if log:
            for key, value in data.items():
                if hasattr(log, key):
                    setattr(log, key, value)
            self._db.flush()
        return log

    def get_logs(self, limit: int = 50) -> list[FinancialCalculationLog]:
        stmt = (
            select(FinancialCalculationLog)
            .order_by(desc(FinancialCalculationLog.start_time))
            .limit(limit)
        )
        return list(self._db.execute(stmt).scalars().all())


class FinancialCompanyRepository:

    def __init__(self, db: Session):
        self._db = db

    def get_all_active_companies(self) -> list[Company]:
        stmt = select(Company).where(Company.active == True).order_by(Company.stock_code)
        return list(self._db.execute(stmt).scalars().all())

    def get_company_by_stock_code(self, stock_code: str) -> Company | None:
        stmt = select(Company).where(Company.stock_code == stock_code.upper().strip())
        return self._db.execute(stmt).scalar_one_or_none()

    def commit(self) -> None:
        self._db.commit()

    def rollback(self) -> None:
        self._db.rollback()
