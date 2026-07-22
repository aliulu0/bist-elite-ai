import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from modules.momentum_engine.api.router import router as momentum_router


@pytest.fixture()
def client():
    test_app = FastAPI()
    test_app.include_router(momentum_router)
    with TestClient(test_app) as c:
        yield c


def _price_bars(n=100, start=100.0, step=0.5):
    return [
        {
            "date": f"2024-01-{(i%28)+1:02d}",
            "open": start + i * step,
            "high": start + i * step + 3,
            "low": start + i * step - 2,
            "close": start + i * step,
            "volume": 1000 + i * 10,
        }
        for i in range(n)
    ]


class TestGetIndicators:
    def test_indicators(self, client):
        resp = client.get("/momentum/indicators")
        assert resp.status_code == 200
        data = resp.json()
        assert "rsi" in data["indicators"]
        assert "macd" in data["indicators"]
        assert len(data["indicators"]) >= 10


class TestCalculate:
    def test_rsi(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "rsi",
            "prices": _price_bars(100),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["indicator"] == "Relative Strength Index"
        assert data["current_value"] is not None

    def test_macd(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "macd",
            "prices": _price_bars(100),
        })
        assert resp.status_code == 200
        assert resp.json()["indicator"] == "MACD"

    def test_adx(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "adx",
            "prices": _price_bars(100),
        })
        assert resp.status_code == 200

    def test_cci(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "cci",
            "prices": _price_bars(100),
        })
        assert resp.status_code == 200

    def test_roc(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "roc",
            "prices": _price_bars(100),
        })
        assert resp.status_code == 200

    def test_momentum(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "momentum",
            "prices": _price_bars(100),
        })
        assert resp.status_code == 200

    def test_williams_r(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "williams_r",
            "prices": _price_bars(100),
        })
        assert resp.status_code == 200

    def test_tsi(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "tsi",
            "prices": _price_bars(100),
        })
        assert resp.status_code == 200

    def test_ao(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "ao",
            "prices": _price_bars(100),
        })
        assert resp.status_code == 200

    def test_stoch_rsi(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "stoch_rsi",
            "prices": _price_bars(100),
        })
        assert resp.status_code == 200

    def test_unknown_indicator(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "xyz",
            "prices": _price_bars(100),
        })
        assert resp.status_code == 400

    def test_custom_params(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "rsi",
            "prices": _price_bars(100),
            "params": {"period": 21},
        })
        assert resp.status_code == 200
        assert resp.json()["parameters"]["period"] == 21

    def test_empty_prices(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "rsi",
            "prices": [],
        })
        assert resp.status_code == 422

    def test_with_signals(self, client):
        resp = client.post("/momentum/calculate", json={
            "indicator": "rsi",
            "prices": _price_bars(100),
            "include_signals": True,
        })
        assert resp.status_code == 200


class TestCacheStats:
    def test_stats(self, client):
        resp = client.get("/momentum/cache-stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "size" in data
        assert "hit_ratio" in data


class TestGetRSI:
    def test_with_prices(self, client):
        import json
        prices = _price_bars(100)[:5]
        resp = client.get(f"/momentum/rsi?period=14&prices_json={json.dumps(prices)}")
        assert resp.status_code == 200

    def test_no_prices(self, client):
        resp = client.get("/momentum/rsi?period=14")
        assert resp.status_code == 400


class TestStubEndpoints:
    def test_stoch_rsi_get(self, client):
        resp = client.get("/momentum/stoch-rsi")
        assert resp.status_code == 400

    def test_macd_get(self, client):
        resp = client.get("/momentum/macd")
        assert resp.status_code == 400

    def test_adx_get(self, client):
        resp = client.get("/momentum/adx")
        assert resp.status_code == 400

    def test_signals_get(self, client):
        resp = client.get("/momentum/signals/rsi")
        assert resp.status_code == 400

    def test_divergence_get(self, client):
        resp = client.get("/momentum/divergence/rsi")
        assert resp.status_code == 400

    def test_benchmark_post(self, client):
        resp = client.post("/momentum/benchmark?indicator=rsi")
        assert resp.status_code == 400
