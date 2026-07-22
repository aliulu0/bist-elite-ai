from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from modules.strategy_optimizer.api.router import router
import modules.strategy_optimizer.api.router as router_module


@pytest.fixture(autouse=True)
def reset_service():
    router_module._service = None
    yield
    router_module._service = None


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router)
    return TestClient(app, raise_server_exceptions=False)


class TestAPIRunOptimization:
    def test_run_basic(self, client):
        response = client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "optimization_type": "rule_threshold",
            "horizon": "3_months",
            "max_iterations": 5,
            "max_candidates": 3,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["run"]["symbol"] == "THYAO"
        assert data["run"]["candidates_evaluated"] > 0

    def test_run_weight_type(self, client):
        response = client.post("/optimizer/run", json={
            "symbol": "GARAN",
            "optimization_type": "weight",
            "horizon": "6_months",
            "max_iterations": 5,
            "max_candidates": 3,
        })
        assert response.status_code == 200

    def test_run_with_seed(self, client):
        response = client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "max_iterations": 5,
            "max_candidates": 3,
            "seed": 42,
        })
        assert response.status_code == 200

    def test_run_invalid(self, client):
        response = client.post("/optimizer/run", json={
            "symbol": "",
            "max_iterations": -1,
        })
        assert response.status_code == 400

    def test_run_all_horizons(self, client):
        for horizon in ["weekly", "1_month", "3_months", "6_months", "12_months"]:
            response = client.post("/optimizer/run", json={
                "symbol": "THYAO",
                "horizon": horizon,
                "max_iterations": 3,
                "max_candidates": 2,
            })
            assert response.status_code == 200

    def test_run_all_types(self, client):
        for opt_type in ["rule_threshold", "weight", "bonus", "penalty", "filter", "ranking"]:
            response = client.post("/optimizer/run", json={
                "symbol": "THYAO",
                "optimization_type": opt_type,
                "max_iterations": 3,
                "max_candidates": 2,
            })
            assert response.status_code == 200


class TestAPIListOptimizations:
    def test_list_empty(self, client):
        response = client.get("/optimizer/list")
        assert response.status_code == 200
        data = response.json()
        assert "runs" in data
        assert "total" in data

    def test_list_with_runs(self, client):
        client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "max_iterations": 3,
            "max_candidates": 2,
        })
        response = client.get("/optimizer/list")
        data = response.json()
        assert data["total"] >= 1

    def test_list_filter_by_symbol(self, client):
        client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "max_iterations": 3,
            "max_candidates": 2,
        })
        client.post("/optimizer/run", json={
            "symbol": "GARAN",
            "max_iterations": 3,
            "max_candidates": 2,
        })
        response = client.get("/optimizer/list?symbol=THYAO")
        data = response.json()
        assert data["total"] == 1


class TestAPIHistory:
    def test_history(self, client):
        result = client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "max_iterations": 3,
            "max_candidates": 2,
        }).json()
        run_id = result["run"]["run_id"]
        response = client.get(f"/optimizer/history/{run_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["run_id"] == run_id

    def test_history_not_found(self, client):
        response = client.get("/optimizer/history/nonexistent")
        assert response.status_code == 404


class TestAPIReport:
    def test_summary_report(self, client):
        result = client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "max_iterations": 3,
            "max_candidates": 2,
        }).json()
        run_id = result["run"]["run_id"]
        response = client.get(f"/optimizer/report/{run_id}?report_type=optimization_summary")
        assert response.status_code == 200

    def test_parameter_comparison_report(self, client):
        result = client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "max_iterations": 3,
            "max_candidates": 2,
        }).json()
        run_id = result["run"]["run_id"]
        response = client.get(f"/optimizer/report/{run_id}?report_type=parameter_comparison")
        assert response.status_code == 200

    def test_performance_report(self, client):
        result = client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "max_iterations": 3,
            "max_candidates": 2,
        }).json()
        run_id = result["run"]["run_id"]
        response = client.get(f"/optimizer/report/{run_id}?report_type=performance_improvement")
        assert response.status_code == 200

    def test_rejected_report(self, client):
        result = client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "max_iterations": 5,
            "max_candidates": 5,
        }).json()
        run_id = result["run"]["run_id"]
        response = client.get(f"/optimizer/report/{run_id}?report_type=rejected_candidates")
        assert response.status_code == 200

    def test_accepted_report(self, client):
        result = client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "max_iterations": 5,
            "max_candidates": 5,
        }).json()
        run_id = result["run"]["run_id"]
        response = client.get(f"/optimizer/report/{run_id}?report_type=accepted_candidates")
        assert response.status_code == 200

    def test_full_report(self, client):
        result = client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "max_iterations": 3,
            "max_candidates": 2,
        }).json()
        run_id = result["run"]["run_id"]
        response = client.get(f"/optimizer/report/{run_id}?report_type=full")
        assert response.status_code == 200

    def test_report_not_found(self, client):
        response = client.get("/optimizer/report/nonexistent")
        assert response.status_code == 200

    def test_invalid_report_type(self, client):
        result = client.post("/optimizer/run", json={
            "symbol": "THYAO",
            "max_iterations": 3,
            "max_candidates": 2,
        }).json()
        run_id = result["run"]["run_id"]
        response = client.get(f"/optimizer/report/{run_id}?report_type=invalid")
        assert response.status_code == 400


class TestAPICacheStats:
    def test_cache_stats(self, client):
        response = client.get("/optimizer/cache/stats")
        assert response.status_code == 200
        data = response.json()
        assert "size" in data
        assert "hits" in data
        assert "misses" in data
        assert "hit_rate" in data

    def test_clear_cache(self, client):
        response = client.post("/optimizer/cache/clear")
        assert response.status_code == 200
        assert response.json()["status"] == "cleared"
