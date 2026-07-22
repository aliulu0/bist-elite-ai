import pytest
from datetime import date, timedelta
import math

from modules.prices.services.calculation_service import CalculationService, PriceBar


def _make_bars(n: int, base_price: float = 100.0, base_volume: float = 1_000_000.0) -> list[PriceBar]:
    bars = []
    price = base_price
    for i in range(n):
        d = date(2025, 1, 1) + timedelta(days=i)
        change = 0.01 * ((-1) ** i) * (i % 3)
        o = price
        h = price * (1 + abs(change) + 0.005)
        l = price * (1 - abs(change) - 0.005)
        c = price * (1 + change)
        bars.append(PriceBar(date=d, open=o, high=h, low=l, close=c, volume=base_volume))
        price = c
    return bars


class TestCalculateReturns:
    def test_empty(self):
        result = CalculationService.calculate_returns([])
        assert result["daily_return"] is None

    def test_single_bar(self):
        bars = [PriceBar(date=date(2025, 1, 1), open=100, high=110, low=90, close=105, volume=1000)]
        result = CalculationService.calculate_returns(bars)
        assert result["daily_return"] is None

    def test_two_bars(self):
        bars = [
            PriceBar(date=date(2025, 1, 1), open=100, high=110, low=90, close=100, volume=1000),
            PriceBar(date=date(2025, 1, 2), open=100, high=115, low=95, close=110, volume=1000),
        ]
        result = CalculationService.calculate_returns(bars)
        assert result["daily_return"] is not None
        assert abs(result["daily_return"] - 0.10) < 1e-10
        assert result["log_return"] is not None
        assert abs(result["log_return"] - math.log(110 / 100)) < 1e-10

    def test_weekly_return(self):
        bars = _make_bars(6)
        result = CalculationService.calculate_returns(bars)
        assert result["weekly_return"] is not None

    def test_monthly_return(self):
        bars = _make_bars(23)
        result = CalculationService.calculate_returns(bars)
        assert result["monthly_return"] is not None

    def test_yearly_return(self):
        bars = _make_bars(253)
        result = CalculationService.calculate_returns(bars)
        assert result["yearly_return"] is not None

    def test_no_yearly_with_few_bars(self):
        bars = _make_bars(100)
        result = CalculationService.calculate_returns(bars)
        assert result["yearly_return"] is None

    def test_log_return_negative_change(self):
        bars = [
            PriceBar(date=date(2025, 1, 1), open=100, high=110, low=90, close=100, volume=1000),
            PriceBar(date=date(2025, 1, 2), open=100, high=105, low=80, close=90, volume=1000),
        ]
        result = CalculationService.calculate_returns(bars)
        assert result["daily_return"] is not None
        assert result["daily_return"] < 0
        assert result["log_return"] is not None
        assert result["log_return"] < 0


class TestCalculateVolatility:
    def test_empty(self):
        result = CalculationService.calculate_volatility([])
        assert result["historical_volatility"] is None
        assert result["atr_data"] is None
        assert result["avg_daily_range"] is None

    def test_insufficient_data(self):
        bars = _make_bars(5)
        result = CalculationService.calculate_volatility(bars, window=20)
        assert result["historical_volatility"] is None

    def test_enough_data_for_volatility(self):
        bars = _make_bars(25)
        result = CalculationService.calculate_volatility(bars)
        assert result["historical_volatility"] is not None
        assert result["historical_volatility"] >= 0

    def test_atr_with_enough_data(self):
        bars = _make_bars(25)
        result = CalculationService.calculate_volatility(bars)
        assert result["atr_data"] is not None
        assert result["atr_data"] >= 0

    def test_avg_daily_range(self):
        bars = _make_bars(25)
        result = CalculationService.calculate_volatility(bars, window=20)
        assert result["avg_daily_range"] is not None
        assert result["avg_daily_range"] >= 0

    def test_custom_window(self):
        bars = _make_bars(15)
        result = CalculationService.calculate_volatility(bars, window=10)
        assert result["historical_volatility"] is not None
        assert result["atr_data"] is not None


class TestCalculateLiquidity:
    def test_basic(self):
        bars = _make_bars(25, base_volume=5_000_000)
        result = CalculationService.calculate_liquidity(
            bars, current_volume=10_000_000, avg_volume_20=5_000_000, turnover=1_000_000_000
        )
        assert result["relative_volume"] is not None
        assert abs(result["relative_volume"] - 2.0) < 1e-10
        assert result["volume_ratio"] is not None

    def test_no_avg_volume(self):
        bars = _make_bars(5)
        result = CalculationService.calculate_liquidity(
            bars, current_volume=10_000_000, avg_volume_20=None, turnover=1_000_000_000
        )
        assert result["relative_volume"] is None

    def test_turnover_ratio(self):
        bars = _make_bars(25)
        result = CalculationService.calculate_liquidity(
            bars, current_volume=10_000_000, avg_volume_20=5_000_000,
            turnover=500_000_000, market_cap=10_000_000_000
        )
        assert result["turnover_ratio"] is not None
        assert abs(result["turnover_ratio"] - 5.0) < 1e-10

    def test_liquidity_score_computed(self):
        bars = _make_bars(25)
        result = CalculationService.calculate_liquidity(
            bars, current_volume=10_000_000, avg_volume_20=5_000_000,
            turnover=500_000_000, market_cap=10_000_000_000
        )
        assert result["liquidity_score"] is not None
        assert 0 <= result["liquidity_score"] <= 1

    def test_zero_market_cap(self):
        bars = _make_bars(25)
        result = CalculationService.calculate_liquidity(
            bars, current_volume=10_000_000, avg_volume_20=5_000_000,
            turnover=500_000_000, market_cap=0
        )
        assert result["turnover_ratio"] is None


class TestCalculateGaps:
    def test_no_gap(self):
        bars = [
            PriceBar(date=date(2025, 1, 1), open=100, high=110, low=95, close=105, volume=1000),
            PriceBar(date=date(2025, 1, 2), open=105, high=112, low=100, close=108, volume=1000),
        ]
        result = CalculationService.calculate_gaps(bars)
        assert result["gap_up"] is False
        assert result["gap_down"] is False

    def test_gap_up(self):
        bars = [
            PriceBar(date=date(2025, 1, 1), open=100, high=110, low=95, close=100, volume=1000),
            PriceBar(date=date(2025, 1, 2), open=110, high=115, low=108, close=112, volume=1000),
        ]
        result = CalculationService.calculate_gaps(bars)
        assert result["gap_up"] is True

    def test_gap_down(self):
        bars = [
            PriceBar(date=date(2025, 1, 1), open=100, high=110, low=95, close=100, volume=1000),
            PriceBar(date=date(2025, 1, 2), open=90, high=92, low=85, close=88, volume=1000),
        ]
        result = CalculationService.calculate_gaps(bars)
        assert result["gap_down"] is True

    def test_empty(self):
        result = CalculationService.calculate_gaps([])
        assert result["gap_up"] is False

    def test_single_bar(self):
        bars = [PriceBar(date=date(2025, 1, 1), open=100, high=110, low=95, close=105, volume=1000)]
        result = CalculationService.calculate_gaps(bars)
        assert result["gap_up"] is False


class TestCalculateExtremes:
    def test_empty(self):
        result = CalculationService.calculate_extremes([])
        assert result["all_time_high"] is None
        assert result["all_time_low"] is None

    def test_basic(self):
        bars = _make_bars(300)
        result = CalculationService.calculate_extremes(bars)
        assert result["all_time_high"] is not None
        assert result["all_time_low"] is not None
        assert result["week_52_high"] is not None
        assert result["week_52_low"] is not None
        assert result["all_time_high"] >= result["all_time_low"]

    def test_single_bar(self):
        bars = [PriceBar(date=date(2025, 1, 1), open=100, high=110, low=90, close=105, volume=1000)]
        result = CalculationService.calculate_extremes(bars)
        assert result["all_time_high"] == 110
        assert result["all_time_low"] == 90


class TestCalculateTrend:
    def test_empty(self):
        result = CalculationService.calculate_trend([])
        assert result["trend_direction"] is None

    def test_uptrend(self):
        bars = [
            PriceBar(date=date(2025, 1, 1), open=100, high=105, low=98, close=103, volume=1000),
            PriceBar(date=date(2025, 1, 2), open=103, high=110, low=102, close=108, volume=1000),
            PriceBar(date=date(2025, 1, 3), open=108, high=115, low=107, close=113, volume=1000),
        ]
        result = CalculationService.calculate_trend(bars)
        assert result["trend_direction"] == "UPTREND"
        assert result["higher_high"] is True
        assert result["higher_low"] is True

    def test_downtrend(self):
        bars = [
            PriceBar(date=date(2025, 1, 1), open=110, high=112, low=105, close=107, volume=1000),
            PriceBar(date=date(2025, 1, 2), open=107, high=108, low=100, close=102, volume=1000),
            PriceBar(date=date(2025, 1, 3), open=102, high=103, low=95, close=97, volume=1000),
        ]
        result = CalculationService.calculate_trend(bars)
        assert result["trend_direction"] == "DOWNTREND"
        assert result["lower_low"] is True
        assert result["lower_high"] is True

    def test_volatile(self):
        bars = [
            PriceBar(date=date(2025, 1, 1), open=100, high=105, low=98, close=103, volume=1000),
            PriceBar(date=date(2025, 1, 2), open=103, high=110, low=100, close=105, volume=1000),
            PriceBar(date=date(2025, 1, 3), open=105, high=115, low=95, close=100, volume=1000),
        ]
        result = CalculationService.calculate_trend(bars)
        assert result["trend_direction"] == "VOLATILE"
        assert result["higher_high"] is True
        assert result["lower_low"] is True

    def test_sideways(self):
        bars = [
            PriceBar(date=date(2025, 1, 1), open=100, high=105, low=98, close=102, volume=1000),
            PriceBar(date=date(2025, 1, 2), open=102, high=104, low=99, close=103, volume=1000),
            PriceBar(date=date(2025, 1, 3), open=103, high=104, low=99, close=101, volume=1000),
        ]
        result = CalculationService.calculate_trend(bars)
        assert result["trend_direction"] == "SIDEWAYS"

    def test_insufficient_data(self):
        bars = [
            PriceBar(date=date(2025, 1, 1), open=100, high=105, low=98, close=103, volume=1000),
            PriceBar(date=date(2025, 1, 2), open=103, high=110, low=102, close=108, volume=1000),
        ]
        result = CalculationService.calculate_trend(bars)
        assert result["trend_direction"] is None


class TestCalculateVolumeAverages:
    def test_insufficient_data(self):
        bars = _make_bars(3, base_volume=1_000_000)
        result = CalculationService.calculate_volume_averages(bars)
        assert result["avg_volume_5"] is None
        assert result["avg_volume_200"] is None

    def test_enough_for_all_periods(self):
        bars = _make_bars(210, base_volume=1_000_000)
        result = CalculationService.calculate_volume_averages(bars)
        assert result["avg_volume_5"] is not None
        assert result["avg_volume_10"] is not None
        assert result["avg_volume_20"] is not None
        assert result["avg_volume_50"] is not None
        assert result["avg_volume_100"] is not None
        assert result["avg_volume_200"] is not None
        for key in result:
            assert result[key] > 0


class TestComputeAll:
    def test_empty(self):
        result = CalculationService.compute_all([])
        assert result == {}

    def test_full_computation(self):
        bars = _make_bars(252)
        result = CalculationService.compute_all(bars)
        assert "daily_return" in result
        assert "historical_volatility" in result
        assert "relative_volume" in result
        assert "gap_up" in result
        assert "all_time_high" in result
        assert "trend_direction" in result
        assert "avg_volume_20" in result
        assert result["all_time_high"] is not None
        assert result["historical_volatility"] is not None

    def test_with_market_cap(self):
        bars = _make_bars(252)
        result = CalculationService.compute_all(bars, market_cap=10_000_000_000)
        assert result["turnover_ratio"] is not None
