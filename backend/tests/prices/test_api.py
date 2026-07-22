import pytest
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.db.database import Base, get_db
import app.models  # noqa: F401 - import all models to register tables
from app.models.company.company import Company
from app.models.company.daily_price import DailyPrice
from modules.prices.models.price_statistics import PriceStatistics
from modules.prices.models.price_update_log import PriceUpdateLog
from modules.prices.api.router import router as price_router


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
def client(db_session):
    test_app = FastAPI()
    test_app.include_router(price_router)

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    test_app.dependency_overrides[get_db] = override_get_db
    with TestClient(test_app) as c:
        yield c
    test_app.dependency_overrides.clear()


@pytest.fixture()
def seeded_company(db_session):
    existing = db_session.query(Company).filter(Company.stock_code == "THYAO").first()
    if existing:
        return existing
    company = Company(
        stock_code="THYAO",
        company_name="Turk Hava Yollari",
        sector="Ulasim",
        market="BIST",
        active=True,
    )
    db_session.add(company)
    db_session.flush()
    return company


@pytest.fixture()
def empty_company(db_session):
    existing = db_session.query(Company).filter(Company.stock_code == "GARAN").first()
    if existing:
        return existing
    company = Company(
        stock_code="GARAN",
        company_name="Garanti Bankasi",
        sector="Banka",
        market="BIST",
        active=True,
    )
    db_session.add(company)
    db_session.flush()
    return company


@pytest.fixture()
def seeded_prices(db_session, seeded_company):
    existing = db_session.query(DailyPrice).filter(
        DailyPrice.company_id == seeded_company.id
    ).first()
    if existing:
        return seeded_company
    for i in range(30):
        d = date(2025, 1, 1) + timedelta(days=i)
        if d.weekday() < 5:
            price = DailyPrice(
                company_id=seeded_company.id,
                stock_code="THYAO",
                date=d,
                open=100.0 + i,
                high=110.0 + i,
                low=95.0 + i,
                close=105.0 + i,
                volume=1_000_000.0 + i * 100_000,
                turnover=100_000_000.0 + i * 10_000_000,
            )
            db_session.add(price)
    db_session.flush()
    return seeded_company


class TestGetPriceHistory:
    def test_not_found(self, client):
        resp = client.get("/prices/history/NONEXIST")
        assert resp.status_code == 404

    def test_empty_history(self, client, empty_company):
        resp = client.get(f"/prices/history/{empty_company.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_records"] == 0

    def test_with_data(self, client, seeded_prices):
        resp = client.get(f"/prices/history/{seeded_prices.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"
        assert data["total_records"] > 0
        assert data["prices"][0]["open"] > 0

    def test_with_date_filter(self, client, seeded_prices):
        resp = client.get(
            f"/prices/history/{seeded_prices.stock_code}",
            params={"start_date": "2025-01-05", "end_date": "2025-01-10"},
        )
        assert resp.status_code == 200
        data = resp.json()
        for p in data["prices"]:
            assert p["date"] >= "2025-01-05"
            assert p["date"] <= "2025-01-10"

    def test_limit(self, client, seeded_prices):
        resp = client.get(
            f"/prices/history/{seeded_prices.stock_code}",
            params={"limit": 5},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_records"] <= 5

    def test_invalid_limit(self, client, seeded_prices):
        resp = client.get(
            f"/prices/history/{seeded_prices.stock_code}",
            params={"limit": 0},
        )
        assert resp.status_code == 422


class TestGetLatestPrice:
    def test_not_found(self, client):
        resp = client.get("/prices/latest/NONEXIST")
        assert resp.status_code == 404

    def test_empty(self, client, empty_company):
        resp = client.get(f"/prices/latest/{empty_company.stock_code}")
        assert resp.status_code == 404

    def test_with_data(self, client, seeded_prices):
        resp = client.get(f"/prices/latest/{seeded_prices.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"
        assert data["price"]["open"] > 0
        assert data["daily_change"] is not None
        assert data["daily_change_pct"] is not None


class TestGetWeeklyPrices:
    def test_not_found(self, client):
        resp = client.get("/prices/weekly/NONEXIST")
        assert resp.status_code == 404

    def test_empty(self, client, empty_company):
        resp = client.get(f"/prices/weekly/{empty_company.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_records"] == 0

    def test_with_data(self, client, seeded_prices):
        resp = client.get(f"/prices/weekly/{seeded_prices.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"


class TestGetMonthlyPrices:
    def test_not_found(self, client):
        resp = client.get("/prices/monthly/NONEXIST")
        assert resp.status_code == 404

    def test_empty(self, client, empty_company):
        resp = client.get(f"/prices/monthly/{empty_company.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_records"] == 0

    def test_with_data(self, client, seeded_prices):
        resp = client.get(f"/prices/monthly/{seeded_prices.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"


class TestGetPricesForDate:
    def test_empty_date(self, client):
        resp = client.get("/prices/date", params={"target_date": "2099-01-01"})
        assert resp.status_code == 200
        assert resp.json() == []

    def test_with_data(self, client, seeded_prices):
        resp = client.get("/prices/date", params={"target_date": "2025-01-06"})
        assert resp.status_code == 200

    def test_filter_stock_codes(self, client, seeded_prices):
        resp = client.get(
            "/prices/date",
            params={"target_date": "2025-01-06", "stock_codes": ["THYAO"]},
        )
        assert resp.status_code == 200

    def test_missing_date_param(self, client):
        resp = client.get("/prices/date")
        assert resp.status_code == 422


class TestUpdatePrices:
    def test_company_not_found(self, client):
        resp = client.post(
            "/prices/update",
            json={"stock_code": "NONEXIST"},
        )
        assert resp.status_code == 400

    def test_update_with_provider(self, client, seeded_company):
        resp = client.post(
            "/prices/update",
            json={
                "stock_code": "THYAO",
                "start_date": "2025-01-01",
                "end_date": "2025-01-10",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"
        assert data["execution_time_ms"] >= 0


class TestUpdateAllPrices:
    def test_update_all(self, client, seeded_company):
        resp = client.post("/prices/update-all")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_companies"] >= 1
        assert data["execution_time_ms"] >= 0
