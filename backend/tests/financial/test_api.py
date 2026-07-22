import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.db.database import get_db
from app.models.company.company import Company
from modules.financial.api.router import router as financial_router


@pytest.fixture()
def client(db_session):
    test_app = FastAPI()
    test_app.include_router(financial_router)

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
def seeded_financials(client, seeded_company):
    resp = client.post("/financial/update", json={"stock_code": "THYAO"})
    assert resp.status_code == 200
    return seeded_company


class TestGetFinancialLatest:
    def test_not_found(self, client):
        resp = client.get("/financial/latest/NONEXIST")
        assert resp.status_code == 404

    def test_empty_company(self, client, empty_company):
        resp = client.get(f"/financial/latest/{empty_company.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "GARAN"
        assert data["statement"] is None
        assert data["ratios"] is None

    def test_with_data(self, client, seeded_financials):
        resp = client.get("/financial/latest/THYAO")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"
        assert data["statement"] is not None
        assert data["statement"]["period"] is not None
        assert data["ratios"] is not None


class TestGetFinancialHistory:
    def test_not_found(self, client):
        resp = client.get("/financial/history/NONEXIST")
        assert resp.status_code == 404

    def test_empty(self, client, empty_company):
        resp = client.get(f"/financial/history/{empty_company.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_records"] == 0
        assert data["statements"] == []

    def test_with_data(self, client, seeded_financials):
        resp = client.get("/financial/history/THYAO")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"
        assert data["total_records"] > 0
        assert len(data["statements"]) == data["total_records"]


class TestGetFinancialRatios:
    def test_not_found(self, client):
        resp = client.get("/financial/ratios/NONEXIST")
        assert resp.status_code == 404

    def test_empty(self, client, empty_company):
        resp = client.get(f"/financial/ratios/{empty_company.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ratios"] == []

    def test_with_data(self, client, seeded_financials):
        resp = client.get("/financial/ratios/THYAO")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"
        assert len(data["ratios"]) > 0


class TestGetFinancialGrowth:
    def test_not_found(self, client):
        resp = client.get("/financial/growth/NONEXIST")
        assert resp.status_code == 404

    def test_empty_company(self, client, empty_company):
        resp = client.get(f"/financial/growth/{empty_company.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == empty_company.stock_code

    def test_with_data(self, client, seeded_financials):
        resp = client.get("/financial/growth/THYAO")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"


class TestGetFinancialDividends:
    def test_not_found(self, client):
        resp = client.get("/financial/dividends/NONEXIST")
        assert resp.status_code == 404

    def test_with_data(self, client, seeded_financials):
        resp = client.get("/financial/dividends/THYAO")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"
        assert data["total_records"] >= 0


class TestGetFinancialQuality:
    def test_not_found(self, client):
        resp = client.get("/financial/quality/NONEXIST")
        assert resp.status_code == 404

    def test_empty_company(self, client, empty_company):
        resp = client.get(f"/financial/quality/{empty_company.stock_code}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == empty_company.stock_code

    def test_with_data(self, client, seeded_financials):
        resp = client.get("/financial/quality/THYAO")
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"
        assert data["scores"] is not None


class TestUpdateFinancials:
    def test_company_not_found(self, client):
        resp = client.post("/financial/update", json={"stock_code": "NONEXIST"})
        assert resp.status_code == 400

    def test_update_with_provider(self, client, seeded_company):
        resp = client.post("/financial/update", json={"stock_code": "THYAO"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["stock_code"] == "THYAO"
        assert data["status"] == "success"
        assert data["records_added"] + data["records_updated"] > 0
        assert data["ratios_calculated"] > 0
        assert data["scores_calculated"] > 0
        assert data["execution_time_ms"] >= 0


class TestUpdateAllFinancials:
    def test_update_all(self, client, seeded_company):
        resp = client.post("/financial/update-all")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_companies"] >= 1
        assert data["successful"] >= 1
        assert data["execution_time_ms"] >= 0
