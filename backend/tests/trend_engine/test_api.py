import json
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from modules.trend_engine.api.router import router
from modules.trend_engine.schemas.trend_schemas import PriceBarSchema
from tests.trend_engine.conftest import _bars


app = FastAPI()
app.include_router(router)


def _price_bars_json(bars=None):
    if bars is None:
        bars = _bars(100)
    return [
        {
            "date": b.date, "open": b.open, "high": b.high,
            "low": b.low, "close": b.close, "volume": b.volume,
        }
        for b in bars
    ]


class TestTrendAPI:
    def setup_method(self):
        self.client = TestClient(app)

    def test_get_indicators(self):
        resp = self.client.get("/trend/indicators")
        assert resp.status_code == 200
        data = resp.json()
        assert "indicators" in data
        assert len(data["indicators"]) == 8

    def test_calculate_supertrend(self):
        resp = self.client.post("/trend/calculate", json={
            "indicator": "supertrend",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["indicator"] == "SuperTrend"
        assert data["current_value"] is not None

    def test_calculate_bollinger(self):
        resp = self.client.post("/trend/calculate", json={
            "indicator": "bollinger",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["indicator"] == "Bollinger Bands"

    def test_calculate_unknown(self):
        resp = self.client.post("/trend/calculate", json={
            "indicator": "xyz",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 400

    def test_calculate_empty_prices(self):
        resp = self.client.post("/trend/calculate", json={
            "indicator": "supertrend",
            "prices": [],
        })
        assert resp.status_code == 422

    def test_get_supertrend(self):
        resp = self.client.get("/trend/supertrend")
        assert resp.status_code == 400
        assert "POST" in resp.json()["detail"]

    def test_get_ichimoku(self):
        resp = self.client.get("/trend/ichimoku")
        assert resp.status_code == 400

    def test_get_bollinger(self):
        resp = self.client.get("/trend/bollinger")
        assert resp.status_code == 400

    def test_get_donchian(self):
        resp = self.client.get("/trend/donchian")
        assert resp.status_code == 400

    def test_get_parabolic(self):
        resp = self.client.get("/trend/parabolic")
        assert resp.status_code == 400

    def test_get_signals(self):
        resp = self.client.get("/trend/signals/supertrend")
        assert resp.status_code == 400

    def test_get_breakout(self):
        resp = self.client.get("/trend/breakout")
        assert resp.status_code == 400

    def test_get_cache_stats(self):
        resp = self.client.get("/trend/cache-stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "size" in data
        assert "hit_ratio" in data

    def test_benchmark(self):
        resp = self.client.post("/trend/benchmark?indicator=supertrend&iterations=10")
        assert resp.status_code == 400
        assert "POST" in resp.json()["detail"]

    def test_calculate_all_8_indicators(self):
        for indicator in ["supertrend", "ichimoku", "donchian", "parabolic_sar", "bollinger", "keltner", "ma_envelope", "linear_regression"]:
            resp = self.client.post("/trend/calculate", json={
                "indicator": indicator,
                "prices": _price_bars_json(),
            })
            assert resp.status_code == 200, f"Failed for {indicator}"
            data = resp.json()
            assert data["indicator"] is not None

    def test_calculate_with_custom_params(self):
        resp = self.client.post("/trend/calculate", json={
            "indicator": "supertrend",
            "prices": _price_bars_json(),
            "params": {"period": 14, "multiplier": 2.5},
        })
        assert resp.status_code == 200
        assert resp.json()["parameters"]["period"] == 14
        assert resp.json()["parameters"]["multiplier"] == 2.5
