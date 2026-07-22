import time
import logging
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.company.company import Company
from modules.prices.repositories.price_repository import PriceRepository
from modules.prices.services.calculation_service import CalculationService, PriceBar
from modules.prices.validators.price_validator import PriceValidator
from modules.prices.schemas.price import (
    PriceResponse,
    PriceHistoryResponse,
    PriceLatestResponse,
    PriceWeeklyResponse,
    PriceMonthlyResponse,
    PriceUpdateResponse,
    PriceBulkUpdateResponse,
    PriceStatisticsResponse,
)
from modules.prices.providers.price_provider import PriceProvider

logger = logging.getLogger(__name__)


class PriceService:

    def __init__(self, db: Session):
        self._db = db
        self._repo = PriceRepository(db)
        self._provider = PriceProvider()
        self._calc = CalculationService()
        self._validator = PriceValidator()

    def _to_price_bar(self, price) -> PriceBar:
        return PriceBar(
            date=price.date if isinstance(price.date, date) else date.fromisoformat(str(price.date)),
            open=price.open,
            high=price.high,
            low=price.low,
            close=price.close,
            volume=price.volume,
            turnover=price.turnover,
        )

    def _compute_statistics(self, company_id: str) -> dict | None:
        prices = self._repo.get_prices(company_id, limit=252)
        if not prices:
            return None

        bars = [self._to_price_bar(p) for p in prices]
        company = self._repo._db.get(Company, company_id)
        market_cap = company.market_value if company else None

        stats_data = self._calc.compute_all(bars, market_cap)
        if not stats_data:
            return None

        latest = prices[-1]
        as_of_date = latest.date if isinstance(latest.date, date) else date.fromisoformat(str(latest.date))
        stats = self._repo.upsert_statistics(company_id, as_of_date, stats_data)
        self._repo.commit()
        return stats

    def get_price_history(
        self,
        stock_code: str,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int = 500,
    ) -> PriceHistoryResponse | None:
        validation = self._validator.validate_stock_code(stock_code)
        if not validation.is_valid:
            raise ValueError("; ".join(validation.errors))

        company = self._repo.get_company_by_stock_code(stock_code)
        if not company:
            return None

        prices = self._repo.get_prices(company.id, start_date, end_date, limit=limit)
        if not prices:
            return PriceHistoryResponse(
                stock_code=stock_code, total_records=0, prices=[], statistics=None
            )

        stats = self._repo.get_price_statistics(company.id)
        if stats is None:
            stats = self._compute_statistics(company.id)

        price_responses = [PriceResponse.model_validate(p) for p in prices]
        stats_response = PriceStatisticsResponse.model_validate(stats) if stats else None

        return PriceHistoryResponse(
            stock_code=stock_code,
            total_records=len(price_responses),
            prices=price_responses,
            statistics=stats_response,
        )

    def get_latest_price(self, stock_code: str) -> PriceLatestResponse | None:
        validation = self._validator.validate_stock_code(stock_code)
        if not validation.is_valid:
            raise ValueError("; ".join(validation.errors))

        company = self._repo.get_company_by_stock_code(stock_code)
        if not company:
            return None

        price = self._repo.get_latest_price(company.id)
        if not price:
            return None

        stats = self._repo.get_price_statistics(company.id)

        daily_change: float | None = None
        daily_change_pct: float | None = None

        prev_prices = self._repo.get_prices(company.id, limit=2)
        if len(prev_prices) >= 2 and prev_prices[-2].close > 0:
            daily_change = prev_prices[-1].close - prev_prices[-2].close
            daily_change_pct = daily_change / prev_prices[-2].close

        return PriceLatestResponse(
            stock_code=stock_code,
            price=PriceResponse.model_validate(price),
            statistics=PriceStatisticsResponse.model_validate(stats) if stats else None,
            daily_change=daily_change,
            daily_change_pct=daily_change_pct,
        )

    def get_weekly_prices(self, stock_code: str, limit: int = 52) -> PriceWeeklyResponse | None:
        validation = self._validator.validate_stock_code(stock_code)
        if not validation.is_valid:
            raise ValueError("; ".join(validation.errors))

        company = self._repo.get_company_by_stock_code(stock_code)
        if not company:
            return None

        prices = self._repo.get_weekly_prices(company.id, limit)
        price_responses = [PriceResponse.model_validate(p) for p in prices]

        return PriceWeeklyResponse(
            stock_code=stock_code,
            total_records=len(price_responses),
            prices=price_responses,
        )

    def get_monthly_prices(self, stock_code: str, limit: int = 24) -> PriceMonthlyResponse | None:
        validation = self._validator.validate_stock_code(stock_code)
        if not validation.is_valid:
            raise ValueError("; ".join(validation.errors))

        company = self._repo.get_company_by_stock_code(stock_code)
        if not company:
            return None

        prices = self._repo.get_monthly_prices(company.id, limit)
        price_responses = [PriceResponse.model_validate(p) for p in prices]

        return PriceMonthlyResponse(
            stock_code=stock_code,
            total_records=len(price_responses),
            prices=price_responses,
        )

    def get_prices_for_date(self, target_date: date, stock_codes: list[str] | None = None) -> list[PriceResponse]:
        prices = self._repo.get_prices_for_date(target_date, stock_codes)
        return [PriceResponse.model_validate(p) for p in prices]

    def update_prices(
        self,
        stock_code: str,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> PriceUpdateResponse:
        start_time = time.time()

        validation = self._validator.validate_stock_code(stock_code)
        if not validation.is_valid:
            raise ValueError("; ".join(validation.errors))

        company = self._repo.get_company_by_stock_code(stock_code)
        if not company:
            raise ValueError(f"Company not found: {stock_code}")

        if end_date is None:
            end_date = date.today()
        if start_date is None:
            existing = self._repo.get_latest_price(company.id)
            if existing:
                latest_date = existing.date
                if isinstance(latest_date, str):
                    latest_date = date.fromisoformat(latest_date)
                start_date = latest_date + timedelta(days=1)
            else:
                start_date = end_date - timedelta(days=365)

        date_validation = self._validator.validate_date_range(start_date, end_date)
        if not date_validation.is_valid:
            raise ValueError("; ".join(date_validation.errors))

        try:
            raw_prices = self._provider.fetch_prices(stock_code, start_date, end_date)
        except Exception as e:
            logger.error(f"Provider error fetching {stock_code}: {e}")
            elapsed_ms = (time.time() - start_time) * 1000
            log = self._repo.log_update({
                "update_type": "single",
                "company_id": company.id,
                "stock_code": stock_code,
                "records_added": 0,
                "records_updated": 0,
                "failed_records": 1,
                "execution_time_ms": elapsed_ms,
                "status": "error",
                "error_message": str(e),
            })
            self._repo.commit()
            return PriceUpdateResponse(
                status="error",
                stock_code=stock_code,
                records_added=0,
                records_updated=0,
                failed_records=1,
                execution_time_ms=elapsed_ms,
                message=f"Provider error: {e}",
            )

        if not raw_prices:
            elapsed_ms = (time.time() - start_time) * 1000
            self._repo.log_update({
                "update_type": "single",
                "company_id": company.id,
                "stock_code": stock_code,
                "records_added": 0,
                "records_updated": 0,
                "failed_records": 0,
                "execution_time_ms": elapsed_ms,
                "status": "success",
            })
            self._repo.commit()
            return PriceUpdateResponse(
                status="success",
                stock_code=stock_code,
                records_added=0,
                records_updated=0,
                failed_records=0,
                execution_time_ms=elapsed_ms,
                message="No new data available",
            )

        batch_validation = self._validator.validate_batch(raw_prices)
        valid_prices = []
        failed_count = 0
        if batch_validation.is_valid:
            valid_prices = raw_prices
        else:
            for i, p in enumerate(raw_prices):
                single = self._validator.validate_single_price(p)
                if single.is_valid:
                    valid_prices.append(p)
                else:
                    failed_count += 1
                    logger.warning(f"Skipping invalid price record for {stock_code} on {p.get('date')}: {single.errors}")

        added, updated = 0, 0
        if valid_prices:
            added, updated = self._repo.bulk_upsert(company.id, valid_prices)

        elapsed_ms = (time.time() - start_time) * 1000

        self._repo.log_update({
            "update_type": "single",
            "company_id": company.id,
            "stock_code": stock_code,
            "records_added": added,
            "records_updated": updated,
            "failed_records": failed_count,
            "execution_time_ms": elapsed_ms,
            "status": "success" if failed_count == 0 else "partial",
        })

        try:
            self._compute_statistics(company.id)
        except Exception as e:
            logger.warning(f"Failed to compute statistics for {stock_code}: {e}")

        self._repo.commit()

        logger.info(
            f"Updated {stock_code}: +{added} added, ~{updated} updated, "
            f"!{failed_count} failed in {elapsed_ms:.0f}ms"
        )

        return PriceUpdateResponse(
            status="success" if failed_count == 0 else "partial",
            stock_code=stock_code,
            records_added=added,
            records_updated=updated,
            failed_records=failed_count,
            execution_time_ms=elapsed_ms,
            message=f"Added {added}, updated {updated}, failed {failed_count}",
        )

    def update_all_prices(self) -> PriceBulkUpdateResponse:
        start_time = time.time()
        companies = self._repo.get_all_active_companies()

        successful = 0
        failed = 0
        total_added = 0
        total_updated = 0
        total_failed = 0
        errors: list[str] = []

        for company in companies:
            try:
                result = self.update_prices(company.stock_code)
                if result.status == "error":
                    failed += 1
                    errors.append(f"{company.stock_code}: {result.message}")
                else:
                    successful += 1
                    total_added += result.records_added
                    total_updated += result.records_updated
                    total_failed += result.failed_records
            except Exception as e:
                failed += 1
                errors.append(f"{company.stock_code}: {str(e)}")
                logger.error(f"Failed to update {company.stock_code}: {e}")

        elapsed_ms = (time.time() - start_time) * 1000

        self._repo.log_update({
            "update_type": "bulk",
            "records_added": total_added,
            "records_updated": total_updated,
            "failed_records": total_failed,
            "execution_time_ms": elapsed_ms,
            "status": "success" if failed == 0 else "partial",
            "error_message": "; ".join(errors[:10]) if errors else None,
        })
        self._repo.commit()

        return PriceBulkUpdateResponse(
            status="success" if failed == 0 else "partial",
            total_companies=len(companies),
            successful=successful,
            failed=failed,
            total_records_added=total_added,
            total_records_updated=total_updated,
            total_failed_records=total_failed,
            execution_time_ms=elapsed_ms,
            errors=errors,
        )
