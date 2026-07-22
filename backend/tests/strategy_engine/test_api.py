import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from modules.strategy_engine.api.router import router as strategy_router
from tests.strategy_engine.conftest import _all_metrics


@pytest.fixture()
def client():
    test_app = FastAPI()
    test_app.include_router(strategy_router)
    with TestClient(test_app) as c:
        yield c


class TestStrategyList:
    def test_list_strategies(self, client):
        resp = client.get("/strategy/list")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] >= 11
        assert len(data["strategies"]) >= 11

    def test_list_has_value(self, client):
        resp = client.get("/strategy/list")
        names = [s["name"] for s in resp.json()["strategies"]]
        assert "Value Investing" in names


class TestStrategyTemplates:
    def test_list_templates(self, client):
        resp = client.get("/strategy/templates")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] >= 11


class TestRunStrategy:
    def test_run_value(self, client):
        metrics = _all_metrics()
        resp = client.post("/strategy/run", json={
            "strategy_name": "value_investing",
            "symbols": ["THYAO", "GARAN"],
            "metrics_map": {
                "THYAO": metrics,
                "GARAN": metrics,
            },
        })
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["results"]) == 2
        assert len(data["rankings"]) == 2
        assert "summary" in data

    def test_run_not_found(self, client):
        resp = client.post("/strategy/run", json={
            "strategy_name": "nonexistent",
            "symbols": ["THYAO"],
            "metrics_map": {"THYAO": {}},
        })
        assert resp.status_code == 400

    def test_run_high_conviction(self, client):
        metrics = _all_metrics()
        resp = client.post("/strategy/run", json={
            "strategy_name": "high_conviction",
            "symbols": ["THYAO"],
            "metrics_map": {"THYAO": metrics},
        })
        assert resp.status_code == 200
        assert resp.json()["strategy_name"] == "high_conviction"


class TestCreateStrategy:
    def test_create_valid(self, client):
        resp = client.post("/strategy/create", json={
            "definition": {
                "name": "API Strategy",
                "strategy_type": "custom",
                "rule_groups": [{
                    "operator": "and",
                    "rules": [{
                        "name": "test_rule",
                        "rule_type": "financial",
                        "conditions": [{
                            "metric": "pe_ratio",
                            "operator": "lt",
                            "value": 15.0,
                        }],
                    }],
                }],
            },
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True

    def test_create_invalid(self, client):
        resp = client.post("/strategy/create", json={
            "definition": {"name": "", "strategy_type": "custom"},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is False


class TestUpdateStrategy:
    def test_update(self, client):
        resp = client.post("/strategy/update", json={
            "definition": {
                "name": "Update Test",
                "strategy_type": "custom",
                "rule_groups": [{
                    "operator": "and",
                    "rules": [{
                        "name": "r1",
                        "rule_type": "financial",
                        "conditions": [{"metric": "x", "operator": "gt", "value": 0}],
                    }],
                }],
            },
        })
        assert resp.status_code == 200


class TestDeleteStrategy:
    def test_delete(self, client):
        client.post("/strategy/create", json={
            "definition": {
                "name": "Delete Me",
                "strategy_type": "custom",
                "rule_groups": [{
                    "operator": "and",
                    "rules": [{
                        "name": "r1",
                        "rule_type": "custom",
                        "conditions": [{"metric": "x", "operator": "gt", "value": 0}],
                    }],
                }],
            },
        })
        resp = client.delete("/strategy/Delete Me")
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

    def test_delete_not_found(self, client):
        resp = client.delete("/strategy/nonexistent")
        assert resp.status_code == 404


class TestValidateStrategy:
    def test_validate_valid(self, client):
        resp = client.post("/strategy/validate", json={
            "definition": {
                "name": "Valid",
                "strategy_type": "custom",
                "rule_groups": [{
                    "operator": "and",
                    "rules": [{
                        "name": "r1",
                        "rule_type": "financial",
                        "conditions": [{"metric": "x", "operator": "gt", "value": 0}],
                    }],
                }],
            },
        })
        assert resp.status_code == 200
        assert resp.json()["valid"] is True

    def test_validate_invalid(self, client):
        resp = client.post("/strategy/validate", json={
            "definition": {"name": "", "strategy_type": "custom"},
        })
        assert resp.status_code == 200
        assert resp.json()["valid"] is False


class TestBenchmark:
    def test_benchmark(self, client):
        resp = client.post("/strategy/benchmark", json={
            "strategy_name": "value_investing",
            "iterations": 10,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["iterations"] == 10

    def test_benchmark_not_found(self, client):
        resp = client.post("/strategy/benchmark", json={
            "strategy_name": "nonexistent",
            "iterations": 10,
        })
        assert resp.status_code == 400


class TestHistory:
    def test_get_history(self, client):
        resp = client.get("/strategy/history")
        assert resp.status_code == 200
        assert "entries" in resp.json()
