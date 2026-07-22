from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from modules.similarity_engine.api.router import router
import modules.similarity_engine.api.router as router_module


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


class TestAPIAnalyze:
    def test_analyze_basic(self, client):
        response = client.post("/similarity/analyze", json={
            "symbol": "THYAO",
            "reference_date": "2024-01-01",
            "top_n": 3,
            "methods": ["weighted_feature"],
        })
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "THYAO"
        assert data["overall_similarity"] >= 0.0

    def test_analyze_all_methods(self, client):
        for method in ["weighted_feature", "cosine", "euclidean", "manhattan", "dynamic_time_warping", "hybrid"]:
            response = client.post("/similarity/analyze", json={
                "symbol": "THYAO",
                "reference_date": "2024-01-01",
                "top_n": 3,
                "methods": [method],
            })
            assert response.status_code == 200

    def test_analyze_invalid(self, client):
        response = client.post("/similarity/analyze", json={
            "symbol": "",
            "reference_date": "",
        })
        assert response.status_code == 400

    def test_analyze_with_seed(self, client):
        response = client.post("/similarity/analyze", json={
            "symbol": "THYAO",
            "reference_date": "2024-01-01",
            "top_n": 3,
            "seed": 42,
        })
        assert response.status_code == 200


class TestAPIList:
    def test_list_empty(self, client):
        response = client.get("/similarity/list")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total" in data

    def test_list_after_analyze(self, client):
        client.post("/similarity/analyze", json={
            "symbol": "THYAO",
            "reference_date": "2024-01-01",
            "top_n": 3,
        })
        response = client.get("/similarity/list")
        data = response.json()
        assert data["total"] >= 0

    def test_list_filter_symbol(self, client):
        client.post("/similarity/analyze", json={
            "symbol": "THYAO",
            "reference_date": "2024-01-01",
            "top_n": 3,
        })
        response = client.get("/similarity/list?symbol=THYAO")
        assert response.status_code == 200


class TestAPITop:
    def test_top(self, client):
        client.post("/similarity/analyze", json={
            "symbol": "THYAO",
            "reference_date": "2024-01-01",
            "top_n": 5,
        })
        response = client.get("/similarity/top?symbol=THYAO&top_n=3")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "THYAO"

    def test_top_no_data(self, client):
        response = client.get("/similarity/top?symbol=THYAO&top_n=3")
        assert response.status_code == 200


class TestAPIDetails:
    def test_details(self, client):
        client.post("/similarity/analyze", json={
            "symbol": "THYAO",
            "reference_date": "2024-01-01",
            "top_n": 3,
        })
        response = client.get("/similarity/details?symbol=THYAO")
        assert response.status_code == 200

    def test_details_not_found(self, client):
        response = client.get("/similarity/details?symbol=NONEXISTENT")
        assert response.status_code == 404


class TestAPIHistory:
    def test_history_empty(self, client):
        response = client.get("/similarity/history")
        assert response.status_code == 200
        assert response.json() == []

    def test_history_after_analyze(self, client):
        client.post("/similarity/analyze", json={
            "symbol": "THYAO",
            "reference_date": "2024-01-01",
            "top_n": 3,
        })
        response = client.get("/similarity/history")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1


class TestAPIReport:
    def test_executive_summary(self, client):
        client.post("/similarity/analyze", json={
            "symbol": "THYAO",
            "reference_date": "2024-01-01",
            "top_n": 3,
        })
        response = client.get("/similarity/report/THYAO?report_type=executive_summary")
        assert response.status_code == 200
        data = response.json()
        assert data.get("report_type") == "executive_summary"

    def test_full_report(self, client):
        client.post("/similarity/analyze", json={
            "symbol": "THYAO",
            "reference_date": "2024-01-01",
            "top_n": 3,
        })
        response = client.get("/similarity/report/THYAO?report_type=full")
        assert response.status_code == 200

    def test_report_not_found(self, client):
        response = client.get("/similarity/report/NONEXISTENT")
        assert response.status_code == 200

    def test_invalid_report_type(self, client):
        client.post("/similarity/analyze", json={
            "symbol": "THYAO",
            "reference_date": "2024-01-01",
            "top_n": 3,
        })
        response = client.get("/similarity/report/THYAO?report_type=invalid")
        assert response.status_code == 400

    def test_all_report_types(self, client):
        client.post("/similarity/analyze", json={
            "symbol": "THYAO",
            "reference_date": "2024-01-01",
            "top_n": 3,
        })
        for rt in ["executive_summary", "top_similar_stocks", "performance_comparison",
                    "similarity_heatmap", "feature_comparison", "risk_comparison", "full"]:
            response = client.get(f"/similarity/report/THYAO?report_type={rt}")
            assert response.status_code == 200


class TestAPICache:
    def test_cache_stats(self, client):
        response = client.get("/similarity/cache/stats")
        assert response.status_code == 200
        data = response.json()
        assert "size" in data
        assert "hit_rate" in data

    def test_clear_cache(self, client):
        response = client.post("/similarity/cache/clear")
        assert response.status_code == 200
        assert response.json()["status"] == "cleared"
