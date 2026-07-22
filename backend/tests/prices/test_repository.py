import pytest
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base
import app.models  # noqa: F401
from app.models.company.company import Company
from app.models.company.daily_price import DailyPrice
from modules.prices.models.price_statistics import PriceStatistics
from modules.prices.models.price_update_log import PriceUpdateLog
from modules.prices.repositories.price_repository import PriceRepository


@pytest.fixture(scope="module")
def db_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()


@pytest.fixture()
def repo(db_session):
    return PriceRepository(db_session)


@pytest.fixture()
def test_company(db_session):
    company = Company(stock_code="THYAO", company_name="Turk Hava Yollari", sector="Ulasim", market="BIST", active=True)
    db_session.add(company)
    db_session.flush()
    return company


@pytest.fixture()
def second_company(db_session):
    company = Company(stock_code="GARAN", company_name="Garanti Bankasi", sector="Bankacilik", market="BIST", active=True)
    db_session.add(company)
    db_session.flush()
    return company


def _price(cid: str, d: date, **kw) -> DailyPrice:
    defaults = dict(company_id=cid, stock_code="THYAO", date=d, open=100, high=110, low=95, close=105, volume=1_000_000, turnover=100_000_000)
    defaults.update(kw)
    return DailyPrice(**defaults)


class TestGetCompany:
    def test_get_existing(self, repo, test_company):
        found = repo.get_company_by_stock_code("THYAO")
        assert found is not None
        assert found.stock_code == "THYAO"

    def test_get_not_found(self, repo):
        found = repo.get_company_by_stock_code("NONEXISTENT")
        assert found is None

    def test_case_insensitive(self, repo, test_company):
        found = repo.get_company_by_stock_code("thyao")
        assert found is not None


class TestGetPrices:
    def test_empty(self, repo, test_company):
        assert repo.get_prices(test_company.id) == []

    def test_with_data(self, repo, test_company):
        for i in range(5):
            repo._db.add(_price(test_company.id, date(2025, 6, 1 + i), open=100+i, high=110+i, low=95+i, close=105+i))
        repo._db.flush()
        prices = repo.get_prices(test_company.id)
        assert len(prices) == 5
        assert prices[0].date < prices[-1].date

    def test_date_filter(self, repo, test_company):
        for i in range(5):
            repo._db.add(_price(test_company.id, date(2025, 7, 1 + i)))
        repo._db.flush()
        prices = repo.get_prices(test_company.id, start_date=date(2025, 7, 3), end_date=date(2025, 7, 4))
        assert len(prices) == 2

    def test_limit(self, repo, test_company):
        for i in range(10):
            repo._db.add(_price(test_company.id, date(2025, 8, 1 + i)))
        repo._db.flush()
        assert len(repo.get_prices(test_company.id, limit=3)) == 3

    def test_order_desc(self, repo, test_company):
        for i in range(5):
            repo._db.add(_price(test_company.id, date(2025, 9, 1 + i)))
        repo._db.flush()
        prices = repo.get_prices(test_company.id, order_desc=True)
        assert prices[0].date > prices[-1].date


class TestGetLatestPrice:
    def test_no_prices(self, repo, test_company):
        assert repo.get_latest_price(test_company.id) is None

    def test_returns_most_recent(self, repo, test_company):
        for i in range(5):
            repo._db.add(_price(test_company.id, date(2025, 10, 1 + i), close=100+i))
        repo._db.flush()
        latest = repo.get_latest_price(test_company.id)
        assert latest is not None
        assert latest.date == date(2025, 10, 5)


class TestUpsertPrice:
    def test_insert_new(self, repo, test_company):
        price = repo.upsert_price(test_company.id, {"stock_code": "THYAO", "date": date(2025, 11, 1), "open": 100, "high": 110, "low": 95, "close": 105, "volume": 1_000_000, "turnover": 100_000_000})
        assert price.close == 105.0

    def test_update_existing(self, repo, test_company):
        repo.upsert_price(test_company.id, {"stock_code": "THYAO", "date": date(2025, 11, 2), "open": 100, "high": 110, "low": 95, "close": 105, "volume": 1_000_000, "turnover": 100_000_000})
        repo._db.flush()
        updated = repo.upsert_price(test_company.id, {"stock_code": "THYAO", "date": date(2025, 11, 2), "open": 100, "high": 110, "low": 95, "close": 110, "volume": 1_000_000, "turnover": 100_000_000})
        assert updated.close == 110.0
        assert len([p for p in repo.get_prices(test_company.id) if p.date == date(2025, 11, 2)]) == 1


class TestBulkUpsert:
    def test_all_new(self, repo, test_company):
        prices = [{"stock_code": "THYAO", "date": date(2025, 12, 1 + i), "open": 100, "high": 110, "low": 95, "close": 105, "volume": 1_000_000, "turnover": 100_000_000} for i in range(5)]
        added, updated = repo.bulk_upsert(test_company.id, prices)
        assert added == 5 and updated == 0

    def test_mix_new_and_existing(self, repo, test_company):
        initial = [{"stock_code": "THYAO", "date": date(2025, 12, 10 + i), "open": 100, "high": 110, "low": 95, "close": 105, "volume": 1_000_000, "turnover": 100_000_000} for i in range(3)]
        repo.bulk_upsert(test_company.id, initial)
        repo._db.flush()
        batch = [{"stock_code": "THYAO", "date": date(2025, 12, 10 + i), "open": 100, "high": 110, "low": 95, "close": 105, "volume": 1_000_000, "turnover": 100_000_000} for i in range(5)]
        batch[0]["close"] = 999.0
        added, updated = repo.bulk_upsert(test_company.id, batch)
        assert added == 2 and updated == 3


class TestGetWeeklyPrices:
    def test_empty(self, repo, test_company):
        assert repo.get_weekly_prices(test_company.id) == []

    def test_aggregates_weeks(self, repo, test_company):
        for i in range(21):
            repo._db.add(_price(test_company.id, date(2025, 3, 1 + i)))
        repo._db.flush()
        weekly = repo.get_weekly_prices(test_company.id, limit=4)
        assert len(weekly) == 4
        for bar in weekly:
            assert bar.high >= bar.low


class TestGetMonthlyPrices:
    def test_empty(self, repo, test_company):
        assert repo.get_monthly_prices(test_company.id) == []

    def test_aggregates_months(self, repo, test_company):
        for i in range(62):
            d = date(2025, 1, 1) + timedelta(days=i)
            repo._db.add(_price(test_company.id, d))
        repo._db.flush()
        monthly = repo.get_monthly_prices(test_company.id, limit=3)
        assert len(monthly) == 3


class TestGetPricesForDate:
    def test_all_stocks(self, repo, test_company, second_company):
        for c in [test_company, second_company]:
            repo._db.add(_price(c.id, date(2025, 5, 5)))
        repo._db.flush()
        assert len(repo.get_prices_for_date(date(2025, 5, 5))) == 2

    def test_filter_by_stock_codes(self, repo, test_company, second_company):
        for c in [test_company, second_company]:
            repo._db.add(_price(c.id, date(2025, 5, 6)))
        repo._db.flush()
        assert len(repo.get_prices_for_date(date(2025, 5, 6), stock_codes=["THYAO"])) == 1

    def test_empty_date(self, repo, test_company):
        assert repo.get_prices_for_date(date(2099, 1, 1)) == []


class TestStatistics:
    def test_upsert_and_get(self, repo, test_company):
        stats = repo.upsert_statistics(test_company.id, date(2025, 1, 31), {"avg_volume_20": 5_000_000.0, "daily_return": 0.05, "trend_direction": "UPTREND", "historical_volatility": 0.25})
        assert stats.trend_direction == "UPTREND"
        found = repo.get_price_statistics(test_company.id)
        assert found is not None and found.daily_return == 0.05

    def test_update_existing(self, repo, test_company):
        repo.upsert_statistics(test_company.id, date(2025, 2, 1), {"daily_return": 0.05})
        repo.upsert_statistics(test_company.id, date(2025, 2, 1), {"daily_return": 0.10})
        assert repo.get_price_statistics(test_company.id).daily_return == 0.10


class TestGetVolumeAverages:
    def test_insufficient_data(self, repo, test_company):
        assert repo.get_volume_averages(test_company.id, max_period=200)["avg_volume_5"] is None

    def test_enough_data(self, repo, test_company):
        for i in range(200):
            d = date(2024, 7, 1) + timedelta(days=i)
            if d.weekday() < 5:
                repo._db.add(_price(test_company.id, d))
        repo._db.flush()
        result = repo.get_volume_averages(test_company.id, max_period=200)
        assert result["avg_volume_20"] == 1_000_000.0


class TestUpdateLog:
    def test_log_update(self, repo):
        log = repo.log_update({"update_type": "single", "stock_code": "THYAO", "records_added": 10, "records_updated": 5, "failed_records": 1, "execution_time_ms": 150.0, "status": "partial"})
        assert log.records_added == 10

    def test_get_logs(self, repo):
        for i in range(3):
            repo.log_update({"update_type": "single", "stock_code": "TESTLOG", "records_added": i, "records_updated": 0, "failed_records": 0, "execution_time_ms": 100.0, "status": "success"})
        assert len(repo.get_update_logs(limit=10)) >= 3


class TestGetAllActiveCompanies:
    def test_filters_active(self, repo, test_company, second_company):
        second_company.active = False
        repo._db.flush()
        codes = [c.stock_code for c in repo.get_all_active_companies()]
        assert "THYAO" in codes and "GARAN" not in codes
