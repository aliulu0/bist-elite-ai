import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from modules.moving_average.api.router import router as ma_router


@pytest.fixture()
def client():
    test_app = FastAPI()
    test_app.include_router(ma_router)
    with TestClient(test_app) as c:
        yield c


def _price_bars(n=50, start=100.0, step=1.0):
    return [
        {
            "date": f"2024-01-{i+1:02d}",
            "open": start + i * step,
            "high": start + i * step + 2,
            "low": start + i * step - 1,
            "close": start + i * step,
            "volume": 1000.0 + i * 10,
        }
        for i in range(n)
    ]


class TestGetTypes:
    def test_get_types(self, client):
        resp = client.get("/moving-average/types")
        assert resp.status_code == 200
        data = resp.json()
        assert "sma" in data["types"]
        assert "ema" in data["types"]
        assert "default_periods" in data


class TestCalculateMA:
    def test_basic_sma(self, client):
        resp = client.post("/moving-average/calculate", json={
            "ma_type": "sma",
            "period": 10,
            "prices": _price_bars(30),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["indicator"] == "SMA"
        assert data["period"] == 10
        assert data["current_value"] is not None

    def test_with_slope(self, client):
        resp = client.post("/moving-average/calculate", json={
            "ma_type": "sma",
            "period": 10,
            "prices": _price_bars(30),
            "include_slope": True,
        })
        assert resp.status_code == 200
        assert resp.json()["slope"] is not None

    def test_with_trend(self, client):
        resp = client.post("/moving-average/calculate", json={
            "ma_type": "sma",
            "period": 10,
            "prices": _price_bars(30),
            "include_trend": True,
        })
        assert resp.status_code == 200
        assert resp.json()["trend"] is not None

    def test_with_scores(self, client):
        resp = client.post("/moving-average/calculate", json={
            "ma_type": "sma",
            "period": 10,
            "prices": _price_bars(30),
            "include_scores": True,
        })
        assert resp.status_code == 200
        assert resp.json()["scores"] is not None

    def test_invalid_ma_type(self, client):
        resp = client.post("/moving-average/calculate", json={
            "ma_type": "xyz",
            "period": 10,
            "prices": _price_bars(30),
        })
        assert resp.status_code == 400

    def test_zero_period(self, client):
        resp = client.post("/moving-average/calculate", json={
            "ma_type": "sma",
            "period": 0,
            "prices": _price_bars(30),
        })
        assert resp.status_code == 422

    def test_ema(self, client):
        resp = client.post("/moving-average/calculate", json={
            "ma_type": "ema",
            "period": 10,
            "prices": _price_bars(30),
        })
        assert resp.status_code == 200
        assert resp.json()["indicator"] == "EMA"


class TestCalculateMultiple:
    def test_multiple(self, client):
        resp = client.post("/moving-average/calculate-multiple", json={
            "ma_type": "sma",
            "periods": [5, 10, 20],
            "prices": _price_bars(30),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3
        assert data[0]["period"] == 5
        assert data[2]["period"] == 20

    def test_empty_periods(self, client):
        resp = client.post("/moving-average/calculate-multiple", json={
            "ma_type": "sma",
            "periods": [],
            "prices": _price_bars(30),
        })
        assert resp.status_code == 422


class TestCrossovers:
    def test_basic_crossover(self, client):
        resp = client.post("/moving-average/crossovers", json={
            "ma_type": "sma",
            "fast_period": 5,
            "slow_period": 20,
            "prices": _price_bars(50),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["fast_period"] == 5
        assert data["slow_period"] == 20
        assert "crosses" in data

    def test_insufficient_data(self, client):
        resp = client.post("/moving-average/crossovers", json={
            "ma_type": "sma",
            "fast_period": 5,
            "slow_period": 20,
            "prices": _price_bars(5),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["crosses"] == []


class TestTimeframes:
    def test_all_timeframes(self, client):
        resp = client.get("/moving-average/timeframes")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["timeframes"]) == 7

    def test_with_base_timeframe(self, client):
        resp = client.get("/moving-average/timeframes?timeframe=daily")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["higher"]) > 0
        assert len(data["lower"]) > 0

    def test_with_alignment(self, client):
        resp = client.get(
            "/moving-average/timeframes?timeframe=daily"
            "&uptrend_timeframes=daily&uptrend_timeframes=weekly"
        )
        assert resp.status_code == 200
        assert resp.json()["alignment_score"] is not None


class TestValidate:
    def test_valid(self, client):
        resp = client.post("/moving-average/validate", json={
            "ma_type": "sma",
            "period": 10,
            "prices": _price_bars(30),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        assert data["sufficient_data"] is True

    def test_invalid_period(self, client):
        resp = client.post("/moving-average/validate", json={
            "ma_type": "sma",
            "period": 0,
            "prices": _price_bars(30),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is False

    def test_insufficient_data(self, client):
        resp = client.post("/moving-average/validate", json={
            "ma_type": "sma",
            "period": 100,
            "prices": _price_bars(30),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["sufficient_data"] is False

    def test_unknown_type(self, client):
        resp = client.post("/moving-average/validate", json={
            "ma_type": "xyz",
            "period": 10,
            "prices": _price_bars(30),
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is False
