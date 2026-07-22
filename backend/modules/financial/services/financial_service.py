import time
import logging
from datetime import date

from sqlalchemy.orm import Session

from modules.financial.repositories.financial_repository import (
    StatementRepository,
    RatioRepository,
    DividendRepository,
    CapitalEventRepository,
    QualityScoreRepository,
    CalculationLogRepository,
    FinancialCompanyRepository,
)
from modules.financial.services.calculation_service import CalculationService
from modules.financial.validators.financial_validator import FinancialValidator
from modules.financial.providers.financial_provider import MockFinancialProvider
from modules.financial.schemas.financial import (
    StatementResponse,
    RatioResponse,
    DividendResponse,
    QualityScoreResponse,
    FinancialLatestResponse,
    FinancialHistoryResponse,
    FinancialRatiosResponse,
    FinancialDividendsResponse,
    FinancialQualityResponse,
    FinancialUpdateResponse,
    FinancialBulkUpdateResponse,
    GrowthResponse,
)

logger = logging.getLogger(__name__)


class FinancialService:

    def __init__(self, db: Session):
        self._db = db
        self._stmt_repo = StatementRepository(db)
        self._ratio_repo = RatioRepository(db)
        self._div_repo = DividendRepository(db)
        self._cap_repo = CapitalEventRepository(db)
        self._score_repo = QualityScoreRepository(db)
        self._log_repo = CalculationLogRepository(db)
        self._company_repo = FinancialCompanyRepository(db)
        self._calc = CalculationService()
        self._provider = MockFinancialProvider()
        self._validator = FinancialValidator()

    def _stmt_to_dict(self, stmt) -> dict:
        d = {}
        for col in stmt.__table__.columns:
            val = getattr(stmt, col.name)
            if col.name in ("id", "company_id", "created_at", "updated_at"):
                continue
            d[col.name] = val
        return d

    def get_latest(self, stock_code: str) -> FinancialLatestResponse | None:
        company = self._company_repo.get_company_by_stock_code(stock_code)
        if not company:
            return None

        stmt = self._stmt_repo.get_latest_statement(company.id)
        ratio = self._ratio_repo.get_latest_ratio(company.id)
        score = self._score_repo.get_latest_score(company.id)

        return FinancialLatestResponse(
            stock_code=stock_code,
            statement=StatementResponse.model_validate(stmt) if stmt else None,
            ratios=RatioResponse.model_validate(ratio) if ratio else None,
            quality_scores=QualityScoreResponse.model_validate(score) if score else None,
        )

    def get_history(
        self, stock_code: str, report_type: str | None = None, limit: int = 50
    ) -> FinancialHistoryResponse | None:
        company = self._company_repo.get_company_by_stock_code(stock_code)
        if not company:
            return None

        stmts = self._stmt_repo.get_statements(company.id, report_type, limit)
        return FinancialHistoryResponse(
            stock_code=stock_code,
            total_records=len(stmts),
            statements=[StatementResponse.model_validate(s) for s in stmts],
        )

    def get_ratios(
        self, stock_code: str, report_type: str | None = None, limit: int = 50
    ) -> FinancialRatiosResponse | None:
        company = self._company_repo.get_company_by_stock_code(stock_code)
        if not company:
            return None

        ratios = self._ratio_repo.get_ratios(company.id, report_type, limit)
        return FinancialRatiosResponse(
            stock_code=stock_code,
            ratios=[RatioResponse.model_validate(r) for r in ratios],
        )

    def get_growth(self, stock_code: str) -> GrowthResponse | None:
        company = self._company_repo.get_company_by_stock_code(stock_code)
        if not company:
            return None

        ratio = self._ratio_repo.get_latest_ratio(company.id)
        if not ratio:
            return GrowthResponse(stock_code=stock_code)

        return GrowthResponse(
            stock_code=stock_code,
            revenue_growth_q=ratio.revenue_growth_q,
            revenue_growth_y=ratio.revenue_growth_y,
            revenue_cagr_3y=ratio.revenue_cagr_3y,
            revenue_cagr_5y=ratio.revenue_cagr_5y,
            profit_growth_q=ratio.profit_growth_q,
            profit_growth_y=ratio.profit_growth_y,
            profit_cagr_3y=ratio.profit_cagr_3y,
            profit_cagr_5y=ratio.profit_cagr_5y,
            eps_growth_q=ratio.eps_growth_q,
            eps_growth_y=ratio.eps_growth_y,
            eps_cagr_3y=ratio.eps_cagr_3y,
            eps_cagr_5y=ratio.eps_cagr_5y,
            book_value_growth_y=ratio.book_value_growth_y,
            ebitda_growth_y=ratio.ebitda_growth_y,
            fcf_growth_y=ratio.fcf_growth_y,
        )

    def get_dividends(
        self, stock_code: str, limit: int = 50
    ) -> FinancialDividendsResponse | None:
        company = self._company_repo.get_company_by_stock_code(stock_code)
        if not company:
            return None

        divs = self._div_repo.get_dividends(company.id, limit)
        return FinancialDividendsResponse(
            stock_code=stock_code,
            total_records=len(divs),
            dividends=[DividendResponse.model_validate(d) for d in divs],
        )

    def get_quality(self, stock_code: str) -> FinancialQualityResponse | None:
        company = self._company_repo.get_company_by_stock_code(stock_code)
        if not company:
            return None

        score = self._score_repo.get_latest_score(company.id)
        return FinancialQualityResponse(
            stock_code=stock_code,
            scores=QualityScoreResponse.model_validate(score) if score else None,
        )

    def update_financials(
        self, stock_code: str
    ) -> FinancialUpdateResponse:
        start_time = time.time()

        code_val = self._validator.validate_stock_code(stock_code)
        if not code_val.is_valid:
            raise ValueError("; ".join(code_val.errors))

        company = self._company_repo.get_company_by_stock_code(stock_code)
        if not company:
            raise ValueError(f"Company not found: {stock_code}")

        log = self._log_repo.create_log({
            "update_type": "single",
            "company_id": company.id,
            "stock_code": stock_code,
            "start_time": date.today(),
        })

        try:
            raw_data = self._provider.fetch_financial_data(stock_code)
        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            self._log_repo.update_log(log.id, {
                "end_time": date.today(),
                "status": "error",
                "error_message": str(e),
                "execution_time_ms": elapsed_ms,
            })
            self._company_repo.commit()
            return FinancialUpdateResponse(
                status="error",
                stock_code=stock_code,
                records_added=0,
                records_updated=0,
                ratios_calculated=0,
                scores_calculated=0,
                execution_time_ms=elapsed_ms,
                message=f"Provider error: {e}",
            )

        added, updated = self._stmt_repo.bulk_upsert_statements(company.id, raw_data)

        ratios_calc = 0
        scores_calc = 0
        periods = self._stmt_repo.get_all_periods(company.id)

        all_statements_dict: dict[str, dict] = {}
        for stmt in self._stmt_repo.get_statements(company.id, limit=100):
            d = self._stmt_to_dict(stmt)
            all_statements_dict[stmt.period] = d

        for period in periods:
            stmt_dict = all_statements_dict.get(period)
            if not stmt_dict:
                continue

            y = stmt_dict.get("year", 0)
            q = stmt_dict.get("quarter", 1)
            prev_period = f"{y}Q{q - 1}" if q > 1 else f"{y - 1}Q4"
            prev_y_period = f"{y - 1}Q{q}"

            prev_stmt = all_statements_dict.get(prev_period)
            prev_y_stmt = all_statements_dict.get(prev_y_period)

            ratio_data = self._calc.calculate_all_ratios(
                statement=stmt_dict,
                market_cap=company.market_value,
                prev_statement=prev_stmt,
                prev_y_statement=prev_y_stmt,
            )
            ratio_data["period"] = period
            ratio_data["year"] = y
            ratio_data["quarter"] = q
            ratio_data["report_type"] = stmt_dict.get("report_type", "quarterly")

            self._ratio_repo.upsert_ratio(company.id, ratio_data)
            ratios_calc += 1

            score_data = self._calc.calculate_quality_scores(
                all_ratios=ratio_data,
                statement=stmt_dict,
                prev_statement=prev_stmt,
                market_cap=company.market_value,
            )
            score_data["period"] = period
            score_data["year"] = y
            score_data["quarter"] = q
            score_data["as_of_date"] = date.today()
            self._score_repo.upsert_score(company.id, score_data)
            scores_calc += 1

        try:
            raw_divs = self._provider.fetch_dividends(stock_code)
            for d in raw_divs:
                self._div_repo.upsert_dividend(company.id, d)
        except Exception as e:
            logger.warning(f"Failed to fetch dividends for {stock_code}: {e}")

        try:
            raw_events = self._provider.fetch_capital_events(stock_code)
            for ev in raw_events:
                self._cap_repo.upsert_event(company.id, ev)
        except Exception as e:
            logger.warning(f"Failed to fetch capital events for {stock_code}: {e}")

        elapsed_ms = (time.time() - start_time) * 1000
        self._log_repo.update_log(log.id, {
            "end_time": date.today(),
            "records_processed": len(raw_data),
            "ratios_calculated": ratios_calc,
            "scores_calculated": scores_calc,
            "execution_time_ms": elapsed_ms,
            "status": "success",
        })
        self._company_repo.commit()

        return FinancialUpdateResponse(
            status="success",
            stock_code=stock_code,
            records_added=added,
            records_updated=updated,
            ratios_calculated=ratios_calc,
            scores_calculated=scores_calc,
            execution_time_ms=elapsed_ms,
            message=f"Added {added}, updated {updated}, {ratios_calc} ratios, {scores_calc} scores",
        )

    def update_all(self) -> FinancialBulkUpdateResponse:
        start_time = time.time()
        companies = self._company_repo.get_all_active_companies()

        successful, failed = 0, 0
        total_added, total_updated = 0, 0
        total_ratios, total_scores = 0, 0
        errors: list[str] = []

        for company in companies:
            try:
                result = self.update_financials(company.stock_code)
                if result.status == "error":
                    failed += 1
                    errors.append(f"{company.stock_code}: {result.message}")
                else:
                    successful += 1
                    total_added += result.records_added
                    total_updated += result.records_updated
                    total_ratios += result.ratios_calculated
                    total_scores += result.scores_calculated
            except Exception as e:
                failed += 1
                errors.append(f"{company.stock_code}: {str(e)}")
                logger.error(f"Failed to update {company.stock_code}: {e}")

        elapsed_ms = (time.time() - start_time) * 1000

        return FinancialBulkUpdateResponse(
            status="success" if failed == 0 else "partial",
            total_companies=len(companies),
            successful=successful,
            failed=failed,
            total_records_added=total_added,
            total_records_updated=total_updated,
            total_ratios_calculated=total_ratios,
            total_scores_calculated=total_scores,
            execution_time_ms=elapsed_ms,
            errors=errors,
        )
