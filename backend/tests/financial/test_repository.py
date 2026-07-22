import pytest
from datetime import date

from app.models.company.company import Company
from modules.financial.repositories.financial_repository import (
    StatementRepository,
    RatioRepository,
    DividendRepository,
    QualityScoreRepository,
    CalculationLogRepository,
)


@pytest.fixture()
def company(db_session):
    c = Company(
        stock_code="THYAO",
        company_name="Turk Hava Yollari",
        sector="Ulasim",
        market="BIST",
        active=True,
    )
    db_session.add(c)
    db_session.flush()
    return c


def _make_statement_data(**overrides) -> dict:
    data = {
        "period": "2024Q1",
        "year": 2024,
        "quarter": 1,
        "report_type": "quarterly",
        "currency": "TRY",
        "revenue": 10_000_000,
        "cost_of_sales": 6_000_000,
        "gross_profit": 4_000_000,
        "operating_expenses": 1_500_000,
        "operating_profit": 2_500_000,
        "ebit": 2_500_000,
        "ebitda": 3_000_000,
        "pretax_income": 2_000_000,
        "net_profit": 1_500_000,
        "eps": 1.5,
        "diluted_eps": 1.47,
        "shares_outstanding": 1_000_000_000,
        "cash": 500_000,
        "cash_equivalents": 50_000,
        "receivables": 1_000_000,
        "inventories": 300_000,
        "current_assets": 2_000_000,
        "fixed_assets": 1_500_000,
        "total_assets": 10_000_000,
        "short_term_debt": 500_000,
        "long_term_debt": 1_000_000,
        "total_debt": 1_500_000,
        "current_liabilities": 1_200_000,
        "total_liabilities": 4_000_000,
        "equity": 6_000_000,
        "book_value": 6.0,
        "net_debt": 1_000_000,
        "working_capital": 800_000,
        "operating_cash_flow": 2_000_000,
        "investing_cash_flow": -500_000,
        "financing_cash_flow": -800_000,
        "capital_expenditure": 300_000,
        "free_cash_flow": 1_200_000,
        "dividend_paid": 500_000,
        "share_buyback": 0,
    }
    data.update(overrides)
    return data


class TestStatementRepository:
    def test_get_company_by_stock_code(self, db_session, company):
        repo = StatementRepository(db_session)
        found = repo.get_company_by_stock_code("THYAO")
        assert found is not None
        assert found.stock_code == "THYAO"

    def test_get_company_not_found(self, db_session):
        repo = StatementRepository(db_session)
        assert repo.get_company_by_stock_code("NONEXIST") is None

    def test_get_company_case_insensitive(self, db_session, company):
        repo = StatementRepository(db_session)
        found = repo.get_company_by_stock_code("thyao")
        assert found is not None

    def test_upsert_insert(self, db_session, company):
        repo = StatementRepository(db_session)
        stmt = repo.upsert_statement(company.id, _make_statement_data())
        assert stmt.period == "2024Q1"
        assert stmt.revenue == 10_000_000

    def test_upsert_update(self, db_session, company):
        repo = StatementRepository(db_session)
        repo.upsert_statement(company.id, _make_statement_data())
        repo._db.flush()
        updated = repo.upsert_statement(
            company.id, _make_statement_data(revenue=20_000_000)
        )
        assert updated.revenue == 20_000_000

    def test_upsert_preserves_period_and_type(self, db_session, company):
        repo = StatementRepository(db_session)
        repo.upsert_statement(company.id, _make_statement_data())
        repo._db.flush()
        updated = repo.upsert_statement(
            company.id,
            _make_statement_data(revenue=999, period="2024Q1", report_type="quarterly"),
        )
        assert updated.period == "2024Q1"
        assert updated.report_type == "quarterly"
        assert updated.revenue == 999

    def test_bulk_upsert(self, db_session, company):
        repo = StatementRepository(db_session)
        stmts = [
            _make_statement_data(period="2024Q1"),
            _make_statement_data(period="2024Q2"),
            _make_statement_data(period="2024Q3"),
        ]
        added, updated = repo.bulk_upsert_statements(company.id, stmts)
        assert added == 3
        assert updated == 0

    def test_bulk_upsert_mixed(self, db_session, company):
        repo = StatementRepository(db_session)
        repo.bulk_upsert_statements(
            company.id,
            [_make_statement_data(period="2024Q1"), _make_statement_data(period="2024Q2")],
        )
        repo._db.flush()
        batch = [
            _make_statement_data(period="2024Q1", revenue=999),
            _make_statement_data(period="2024Q2", revenue=888),
            _make_statement_data(period="2024Q3"),
        ]
        added, updated = repo.bulk_upsert_statements(company.id, batch)
        assert added == 1
        assert updated == 2

    def test_get_statements(self, db_session, company):
        repo = StatementRepository(db_session)
        repo.bulk_upsert_statements(
            company.id,
            [_make_statement_data(period=f"2024Q{q}") for q in range(1, 5)],
        )
        repo._db.flush()
        stmts = repo.get_statements(company.id)
        assert len(stmts) == 4

    def test_get_statements_empty(self, db_session, company):
        repo = StatementRepository(db_session)
        assert repo.get_statements(company.id, report_type="annual") == []

    def test_get_statements_by_report_type(self, db_session, company):
        repo = StatementRepository(db_session)
        repo.upsert_statement(
            company.id, _make_statement_data(period="2024Q1", report_type="annual")
        )
        repo._db.flush()
        stmts = repo.get_statements(company.id, report_type="annual")
        assert len(stmts) == 1

    def test_get_latest_statement(self, db_session, company):
        repo = StatementRepository(db_session)
        repo.bulk_upsert_statements(
            company.id,
            [
                _make_statement_data(period="2023Q4", year=2023, quarter=4),
                _make_statement_data(period="2024Q1"),
            ],
        )
        repo._db.flush()
        latest = repo.get_latest_statement(company.id)
        assert latest is not None
        assert latest.period == "2024Q1"

    def test_get_latest_statement_empty(self, db_session, company):
        repo = StatementRepository(db_session)
        assert repo.get_latest_statement(company.id, report_type="annual") is None

    def test_get_statement_by_period(self, db_session, company):
        repo = StatementRepository(db_session)
        repo.upsert_statement(company.id, _make_statement_data(period="2024Q2"))
        repo._db.flush()
        found = repo.get_statement_by_period(company.id, "2024Q2")
        assert found is not None
        assert found.period == "2024Q2"

    def test_get_statement_by_period_not_found(self, db_session, company):
        repo = StatementRepository(db_session)
        assert repo.get_statement_by_period(company.id, "9999Q1") is None

    def test_get_all_periods(self, db_session, company):
        repo = StatementRepository(db_session)
        repo.bulk_upsert_statements(
            company.id,
            [_make_statement_data(period=f"2024Q{q}") for q in range(1, 5)],
        )
        repo._db.flush()
        periods = repo.get_all_periods(company.id)
        assert set(periods) == {"2024Q1", "2024Q2", "2024Q3", "2024Q4"}


class TestRatioRepository:
    def test_upsert_ratio(self, db_session, company):
        repo = RatioRepository(db_session)
        data = {
            "period": "2024Q1",
            "year": 2024,
            "quarter": 1,
            "report_type": "quarterly",
            "pe_ratio": 10.0,
            "pb_ratio": 2.0,
        }
        ratio = repo.upsert_ratio(company.id, data)
        assert ratio.pe_ratio == 10.0

    def test_upsert_ratio_update(self, db_session, company):
        repo = RatioRepository(db_session)
        data = {
            "period": "2024Q1",
            "year": 2024,
            "quarter": 1,
            "report_type": "quarterly",
            "pe_ratio": 10.0,
        }
        repo.upsert_ratio(company.id, data)
        repo._db.flush()
        data["pe_ratio"] = 15.0
        updated = repo.upsert_ratio(company.id, data)
        assert updated.pe_ratio == 15.0

    def test_get_ratios(self, db_session, company):
        repo = RatioRepository(db_session)
        for q in range(1, 4):
            repo.upsert_ratio(
                company.id,
                {
                    "period": f"2024Q{q}",
                    "year": 2024,
                    "quarter": q,
                    "report_type": "quarterly",
                    "pe_ratio": 10.0 + q,
                },
            )
        repo._db.flush()
        ratios = repo.get_ratios(company.id)
        assert len(ratios) == 3

    def test_get_ratios_empty(self, db_session, company):
        repo = RatioRepository(db_session)
        assert repo.get_ratios(company.id, report_type="annual") == []

    def test_get_latest_ratio(self, db_session, company):
        repo = RatioRepository(db_session)
        repo.upsert_ratio(
            company.id,
            {
                "period": "2023Q4",
                "year": 2023,
                "quarter": 4,
                "report_type": "quarterly",
                "pe_ratio": 8.0,
            },
        )
        repo.upsert_ratio(
            company.id,
            {
                "period": "2024Q1",
                "year": 2024,
                "quarter": 1,
                "report_type": "quarterly",
                "pe_ratio": 10.0,
            },
        )
        repo._db.flush()
        latest = repo.get_latest_ratio(company.id)
        assert latest is not None
        assert latest.period == "2024Q1"


class TestDividendRepository:
    def test_upsert_dividend(self, db_session, company):
        repo = DividendRepository(db_session)
        data = {
            "ex_date": date(2024, 3, 15),
            "payment_date": date(2024, 4, 15),
            "gross_dividend": 1_000_000,
            "net_dividend": 850_000,
            "yield_pct": 0.03,
            "payout_ratio": 0.40,
            "dividend_per_share": 1.0,
            "period": "2024Q1",
            "year": 2024,
        }
        div = repo.upsert_dividend(company.id, data)
        assert div.gross_dividend == 1_000_000

    def test_upsert_dividend_update(self, db_session, company):
        repo = DividendRepository(db_session)
        data = {
            "ex_date": date(2024, 6, 15),
            "payment_date": date(2024, 7, 15),
            "gross_dividend": 500_000,
        }
        repo.upsert_dividend(company.id, data)
        repo._db.flush()
        data["gross_dividend"] = 750_000
        updated = repo.upsert_dividend(company.id, data)
        assert updated.gross_dividend == 750_000

    def test_get_dividends(self, db_session, company):
        repo = DividendRepository(db_session)
        for i in range(3):
            repo.upsert_dividend(
                company.id,
                {
                    "ex_date": date(2024, 3 + i * 3, 15),
                    "gross_dividend": 500_000 * (i + 1),
                },
            )
        repo._db.flush()
        divs = repo.get_dividends(company.id)
        assert len(divs) == 3


class TestQualityScoreRepository:
    def test_upsert_score(self, db_session, company):
        repo = QualityScoreRepository(db_session)
        data = {
            "period": "2024Q1",
            "year": 2024,
            "quarter": 1,
            "as_of_date": date(2024, 6, 1),
            "piotroski_f_score": 7,
            "altman_z_score": 3.2,
            "beneish_m_score": -1.8,
            "financial_strength_score": 75.0,
            "profitability_score": 80.0,
            "growth_score": 65.0,
            "dividend_quality_score": 70.0,
        }
        score = repo.upsert_score(company.id, data)
        assert score.piotroski_f_score == 7
        assert score.altman_z_score == 3.2

    def test_upsert_score_update(self, db_session, company):
        repo = QualityScoreRepository(db_session)
        data = {
            "period": "2024Q1",
            "year": 2024,
            "quarter": 1,
            "as_of_date": date(2024, 6, 1),
            "piotroski_f_score": 5,
        }
        repo.upsert_score(company.id, data)
        repo._db.flush()
        data["piotroski_f_score"] = 8
        updated = repo.upsert_score(company.id, data)
        assert updated.piotroski_f_score == 8

    def test_get_latest_score(self, db_session, company):
        repo = QualityScoreRepository(db_session)
        repo.upsert_score(
            company.id,
            {
                "period": "2023Q4",
                "year": 2023,
                "quarter": 4,
                "as_of_date": date(2024, 3, 1),
                "piotroski_f_score": 5,
            },
        )
        repo.upsert_score(
            company.id,
            {
                "period": "2024Q1",
                "year": 2024,
                "quarter": 1,
                "as_of_date": date(2024, 6, 1),
                "piotroski_f_score": 7,
            },
        )
        repo._db.flush()
        latest = repo.get_latest_score(company.id)
        assert latest is not None
        assert latest.period == "2024Q1"

    def test_get_latest_score_empty(self, db_session, company):
        repo = QualityScoreRepository(db_session)
        assert repo.get_latest_score(company.id, report_type="annual") is None


class TestCalculationLogRepository:
    def test_create_log(self, db_session, company):
        repo = CalculationLogRepository(db_session)
        log = repo.create_log({
            "update_type": "single",
            "company_id": company.id,
            "stock_code": "THYAO",
            "start_time": date(2024, 6, 1),
            "status": "running",
        })
        assert log.stock_code == "THYAO"
        assert log.status == "running"

    def test_update_log(self, db_session, company):
        repo = CalculationLogRepository(db_session)
        log = repo.create_log({
            "update_type": "single",
            "company_id": company.id,
            "stock_code": "THYAO",
            "start_time": date(2024, 6, 1),
            "status": "running",
        })
        repo._db.flush()
        updated = repo.update_log(log.id, {
            "status": "success",
            "records_processed": 16,
            "ratios_calculated": 16,
            "execution_time_ms": 500.0,
        })
        assert updated.status == "success"
        assert updated.records_processed == 16

    def test_update_log_not_found(self, db_session):
        repo = CalculationLogRepository(db_session)
        assert repo.update_log("nonexistent-id", {"status": "failed"}) is None

    def test_get_logs(self, db_session, company):
        repo = CalculationLogRepository(db_session)
        for i in range(3):
            repo.create_log({
                "update_type": "single",
                "company_id": company.id,
                "stock_code": f"TEST{i}",
                "start_time": date(2024, 1, 1),
                "status": "success",
            })
        repo._db.flush()
        logs = repo.get_logs(limit=10)
        assert len(logs) >= 3
