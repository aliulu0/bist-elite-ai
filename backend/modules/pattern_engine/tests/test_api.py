from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from modules.pattern_engine.api.router import router


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def _make_price_bars(n: int = 30, base: float = 100.0) -> list[dict]:
    bars = []
    for i in range(n):
        o = base + i * 0.5
        bars.append({
            "date": f"2024-01-{i+1:02d}",
            "open": round(o, 2),
            "high": round(o + 0.8, 2),
            "low": round(o - 0.3, 2),
            "close": round(o + 0.4, 2),
            "volume": 1000 + i * 10,
        })
    return bars


class TestPatternAPI:
    def test_detect_patterns(self, client):
        resp = client.post("/api/v1/patterns/detect", json={
            "symbol": "TEST",
            "prices": _make_price_bars(30),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "TEST"
        assert "total_patterns" in data
        assert "patterns" in data

    def test_detect_with_category(self, client):
        resp = client.post("/api/v1/patterns/detect", json={
            "symbol": "TEST",
            "prices": _make_price_bars(30),
            "category": "classical",
        })
        assert resp.status_code == 200

    def test_detect_with_patterns(self, client):
        resp = client.post("/api/v1/patterns/detect", json={
            "symbol": "TEST",
            "prices": _make_price_bars(30),
            "patterns": ["hammer", "doji"],
        })
        assert resp.status_code == 200

    def test_detect_empty_prices(self, client):
        resp = client.post("/api/v1/patterns/detect", json={
            "symbol": "TEST",
            "prices": [],
        })
        assert resp.status_code == 422

    def test_classical_endpoint(self, client):
        resp = client.post("/api/v1/patterns/classical", json={
            "prices": _make_price_bars(30),
        })
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_candlestick_endpoint(self, client):
        resp = client.post("/api/v1/patterns/candlestick", json={
            "prices": _make_price_bars(10),
        })
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_smc_endpoint(self, client):
        resp = client.post("/api/v1/patterns/smc", json={
            "prices": _make_price_bars(30),
        })
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_wyckoff_endpoint(self, client):
        resp = client.post("/api/v1/patterns/wyckoff", json={
            "prices": _make_price_bars(40),
        })
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_plugins(self, client):
        resp = client.get("/api/v1/patterns/list")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] > 0
        assert isinstance(data["plugins"], list)

    def test_get_plugin_parameters(self, client):
        resp = client.get("/api/v1/patterns/plugin/hammer")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "hammer"
        assert "parameters" in data

    def test_get_plugin_nonexistent(self, client):
        resp = client.get("/api/v1/patterns/plugin/nonexistent")
        assert resp.status_code == 404

    def test_validate_valid(self, client):
        resp = client.post("/api/v1/patterns/validate", json={
            "prices": _make_price_bars(10),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        assert data["bar_count"] == 10

    def test_validate_invalid(self, client):
        resp = client.post("/api/v1/patterns/validate", json={
            "prices": [],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0

    def test_history_endpoint(self, client):
        resp = client.post("/api/v1/patterns/history", json={
            "symbol": "TEST",
            "prices": _make_price_bars(30),
        })
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_detect_with_params(self, client):
        resp = client.post("/api/v1/patterns/detect", json={
            "symbol": "TEST",
            "prices": _make_price_bars(30),
            "params": {"tolerance": 0.05},
        })
        assert resp.status_code == 200

    def test_detect_result_structure(self, client):
        resp = client.post("/api/v1/patterns/detect", json={
            "symbol": "TEST",
            "prices": _make_price_bars(30),
            "patterns": ["hammer"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "bullish_count" in data
        assert "bearish_count" in data
        assert "avg_confidence" in data
        assert "dominant_direction" in data
