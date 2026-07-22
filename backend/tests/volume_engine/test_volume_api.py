import json
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from modules.volume_engine.api.router import router
from tests.volume_engine.conftest import _bars


app = FastAPI()
app.include_router(router)


def _price_bars_json(bars=None):
    if bars is None:
        bars = _bars(50)
    return [
        {
            "date": b.date, "open": b.open, "high": b.high,
            "low": b.low, "close": b.close, "volume": b.volume,
        }
        for b in bars
    ]


class TestVolumeAPI:
    def setup_method(self):
        self.client = TestClient(app)

    def test_get_indicators(self):
        resp = self.client.get("/volume/indicators")
        assert resp.status_code == 200
        data = resp.json()
        assert "indicators" in data
        assert len(data["indicators"]) == 12

    def test_calculate_obv(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "obv",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["indicator"] == "On Balance Volume"
        assert data["current_value"] is not None

    def test_calculate_cmf(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "cmf",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["indicator"] == "Chaikin Money Flow"

    def test_calculate_mfi(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "mfi",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200

    def test_calculate_vwap(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "vwap",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200

    def test_calculate_rvol(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "rvol",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200

    def test_calculate_adl(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "adl",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200

    def test_calculate_chaikin(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "chaikin",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200

    def test_calculate_volume_oscillator(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "volume_oscillator",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200

    def test_calculate_eom(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "eom",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200

    def test_calculate_force_index(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "force_index",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200

    def test_calculate_nvi(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "nvi",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200

    def test_calculate_pvi(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "pvi",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 200

    def test_calculate_unknown(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "xyz",
            "prices": _price_bars_json(),
        })
        assert resp.status_code == 400

    def test_calculate_empty_prices(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "obv",
            "prices": [],
        })
        assert resp.status_code == 422

    def test_get_obv_redirect(self):
        resp = self.client.post("/volume/obv")
        assert resp.status_code == 400
        assert "POST" in resp.json()["detail"]

    def test_get_cmf_redirect(self):
        resp = self.client.post("/volume/cmf")
        assert resp.status_code == 400

    def test_get_mfi_redirect(self):
        resp = self.client.post("/volume/mfi")
        assert resp.status_code == 400

    def test_get_vwap_redirect(self):
        resp = self.client.post("/volume/vwap")
        assert resp.status_code == 400

    def test_get_rvol_redirect(self):
        resp = self.client.post("/volume/rvol")
        assert resp.status_code == 400

    def test_get_liquidity_redirect(self):
        resp = self.client.post("/volume/liquidity")
        assert resp.status_code == 400

    def test_get_smart_money_redirect(self):
        resp = self.client.post("/volume/smart-money")
        assert resp.status_code == 400

    def test_get_signals_redirect(self):
        resp = self.client.get("/volume/signals/obv")
        assert resp.status_code == 400

    def test_get_cache_stats(self):
        resp = self.client.get("/volume/cache-stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "size" in data
        assert "hits" in data
        assert "misses" in data

    def test_benchmark_redirect(self):
        resp = self.client.post("/volume/benchmark?indicator=obv&iterations=10")
        assert resp.status_code == 400

    def test_calculate_with_params(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "cmf",
            "prices": _price_bars_json(),
            "params": {"period": 20},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["parameters"]["period"] == 20

    def test_calculate_with_smart_money(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "obv",
            "prices": _price_bars_json(),
            "include_smart_money": True,
        })
        assert resp.status_code == 200

    def test_calculate_with_liquidity(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "obv",
            "prices": _price_bars_json(),
            "include_liquidity": True,
        })
        assert resp.status_code == 200

    def test_calculate_with_scoring(self):
        resp = self.client.post("/volume/calculate", json={
            "indicator": "obv",
            "prices": _price_bars_json(),
            "include_scoring": True,
        })
        assert resp.status_code == 200
