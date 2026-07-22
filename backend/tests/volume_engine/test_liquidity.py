import pytest
from modules.volume_engine.liquidity.liquidity_engine import LiquidityEngine
from tests.volume_engine.conftest import _bars


class TestLiquidityEngine:
    def setup_method(self):
        self.engine = LiquidityEngine()

    def test_calculate(self):
        liq = self.engine.calculate(_bars(50))
        assert liq.liquidity_score >= 0
        assert liq.turnover_score >= 0
        assert liq.spread_score >= 0
        assert liq.trade_activity >= 0
        assert liq.avg_daily_volume > 0
        assert liq.market_participation >= 0

    def test_calculate_empty(self):
        liq = self.engine.calculate([])
        assert liq.liquidity_score == 0.0

    def test_single_bar(self):
        liq = self.engine.calculate(_bars(1))
        assert liq.liquidity_score >= 0
