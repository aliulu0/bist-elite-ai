from fastapi import FastAPI
from fastapi.testclient import TestClient

from modules.explainability_engine.api.router import router


app = FastAPI()
app.include_router(router)
client = TestClient(app)


class TestExplainabilityAPI:
    def test_generate(self):
        resp = client.post("/api/v1/explainability/generate", json={
            "symbol": "TEST",
            "metrics": {"pe_ratio": 15.0, "roe": 12.0},
            "explanation_type": "fundamental",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["result"]["symbol"] == "TEST"
        assert data["result"]["explanation_type"] == "fundamental"

    def test_generate_comprehensive(self):
        resp = client.post("/api/v1/explainability/comprehensive", json={
            "symbol": "TEST",
            "metrics": {"pe_ratio": 15.0, "rsi": 45.0, "volume_trend": 1.0},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["result"]["symbol"] == "TEST"

    def test_get_summary(self):
        import json as json_mod
        resp = client.get(
            "/api/v1/explainability/summary",
            params={"symbol": "TEST", "metrics": json_mod.dumps({"pe_ratio": 15.0}), "explanation_type": "fundamental"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "TEST"

    def test_get_history(self):
        client.post("/api/v1/explainability/generate", json={
            "symbol": "TEST", "metrics": {"pe_ratio": 15.0}, "explanation_type": "fundamental",
        })
        resp = client.get("/api/v1/explainability/history")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1

    def test_validate(self):
        resp = client.post("/api/v1/explainability/validate", json={
            "symbol": "TEST",
            "metrics": {"pe_ratio": 15.0},
            "explanation_type": "fundamental",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True

    def test_cache_stats(self):
        resp = client.get("/api/v1/explainability/cache/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "size" in data

    def test_cache_clear(self):
        resp = client.post("/api/v1/explainability/cache/clear")
        assert resp.status_code == 200
        assert "cleared" in resp.json()

    def test_benchmark(self):
        resp = client.post("/api/v1/explainability/benchmark", params={"iterations": 10})
        assert resp.status_code == 200
        data = resp.json()
        assert data["iterations"] == 10

    def test_templates(self):
        resp = client.get("/api/v1/explainability/templates")
        assert resp.status_code == 200
        data = resp.json()
        assert "templates" in data
        assert len(data["templates"]) > 0

    def test_localization_keys(self):
        resp = client.get("/api/v1/explainability/localization/keys", params={"language": "en"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["keys"]) > 0

    def test_localization_keys_turkish(self):
        resp = client.get("/api/v1/explainability/localization/keys", params={"language": "tr"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["keys"]) > 0
