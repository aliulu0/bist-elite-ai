import pytest
from pydantic import ValidationError
from modules.moving_average.schemas.ma_schemas import (
    PriceBarSchema, SlopeResponse, DistanceResponse,
    CrossResponse, TrendResponse, SmartSignalResponse, ScoreResponse,
    MAResponse, CalculateRequest, CalculateMultipleRequest,
    CrossoverRequest, CrossoverResponse, AvailableTypesResponse,
    TimeframeInfo, TimeframeListResponse, ValidateRequest, ValidateResponse,
)


class TestPriceBarSchema:
    def test_valid(self):
        bar = PriceBarSchema(
            date="2024-01-01", open=100, high=105, low=95, close=102, volume=1000
        )
        assert bar.close == 102

    def test_default_turnover(self):
        bar = PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=102, volume=1000)
        assert bar.turnover == 0.0


class TestSlopeResponse:
    def test_defaults(self):
        s = SlopeResponse()
        assert s.slope is None
        assert s.is_accelerating is False


class TestDistanceResponse:
    def test_defaults(self):
        d = DistanceResponse()
        assert d.distance_pct is None


class TestCrossResponse:
    def test_valid(self):
        c = CrossResponse(
            cross_type="golden_cross", cross_strength="strong",
            fast_period=5, slow_period=20,
            confirmed=True, false_cross=False,
        )
        assert c.cross_type == "golden_cross"


class TestTrendResponse:
    def test_valid(self):
        t = TrendResponse(
            direction="uptrend", strength=0.8, age=5, stability=0.9
        )
        assert t.direction == "uptrend"


class TestSmartSignalResponse:
    def test_valid(self):
        s = SmartSignalResponse(
            signal_type="early_bullish", direction="bullish",
            confidence=0.5, description="test"
        )
        assert s.confidence == 0.5


class TestScoreResponse:
    def test_defaults(self):
        s = ScoreResponse(
            trend_score=50, momentum_score=50,
            cross_score=50, acceleration_score=50, ma_score=50,
        )
        assert s.ma_score == 50


class TestMAResponse:
    def test_valid(self):
        r = MAResponse(
            indicator="SMA", period=10,
            values=[None, None, 100.0], dates=["d1", "d2", "d3"],
        )
        assert r.indicator == "SMA"
        assert len(r.values) == 3


class TestCalculateRequest:
    def test_valid(self):
        req = CalculateRequest(
            ma_type="sma", period=10,
            prices=[PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=102, volume=1000)],
        )
        assert req.ma_type == "sma"

    def test_empty_prices_fails(self):
        with pytest.raises(ValidationError):
            CalculateRequest(ma_type="sma", period=10, prices=[])

    def test_zero_period_fails(self):
        with pytest.raises(ValidationError):
            CalculateRequest(
                ma_type="sma", period=0,
                prices=[PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=102, volume=1000)],
            )


class TestCalculateMultipleRequest:
    def test_valid(self):
        req = CalculateMultipleRequest(
            ma_type="sma", periods=[5, 10, 20],
            prices=[PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=102, volume=1000)],
        )
        assert len(req.periods) == 3


class TestCrossoverRequest:
    def test_valid(self):
        req = CrossoverRequest(
            ma_type="sma", fast_period=5, slow_period=20,
            prices=[PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=102, volume=1000)],
        )
        assert req.fast_period == 5


class TestAvailableTypesResponse:
    def test_valid(self):
        resp = AvailableTypesResponse(types=["sma", "ema"], default_periods={"sma": [5, 10]})
        assert "sma" in resp.types


class TestTimeframeInfo:
    def test_valid(self):
        tf = TimeframeInfo(value="daily", order=5)
        assert tf.value == "daily"


class TestTimeframeListResponse:
    def test_valid(self):
        resp = TimeframeListResponse(
            timeframes=[TimeframeInfo(value="5m", order=1)],
            higher=["15m"],
            lower=[],
        )
        assert len(resp.timeframes) == 1


class TestValidateRequest:
    def test_valid(self):
        req = ValidateRequest(
            ma_type="sma", period=10,
            prices=[PriceBarSchema(date="2024-01-01", open=100, high=105, low=95, close=102, volume=1000)],
        )
        assert req.ma_type == "sma"


class TestValidateResponse:
    def test_valid(self):
        resp = ValidateResponse(valid=True, errors=[], data_points=10, sufficient_data=True)
        assert resp.valid is True
