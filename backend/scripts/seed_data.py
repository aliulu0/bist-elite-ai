"""
Database seed script for BIST Elite AI.
Run: python -m scripts.seed_data
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timezone, date
import json
import random

from app.db.database import engine, SessionLocal, Base
from app.models import (
    Company,
    DailyPrice,
    FinancialReport,
    FinancialRatio,
    TechnicalIndicator,
    EliteScore,
    Watchlist,
    WatchlistItem,
    SavedFilter,
    Portfolio,
    PortfolioItem,
    TelegramSetting,
    ApplicationSetting,
    AIAnalysis,
    SectorStrength,
    MarketSummary,
    Notification,
    SystemLog,
)

SEED_COMPANIES = [
    {"stock_code": "GARAN", "company_name": "Garanti Bankası", "sector": "Bankacılık", "sub_sector": "Özel Banka", "market": "BIST-100", "market_value": 500000000000, "free_float": 0.45},
    {"stock_code": "AKBNK", "company_name": "Akbank", "sector": "Bankacılık", "sub_sector": "Özel Banka", "market": "BIST-100", "market_value": 300000000000, "free_float": 0.50},
    {"stock_code": "THYAO", "company_name": "Türk Hava Yolları", "sector": "Ulaştırma", "sub_sector": "Havayolu", "market": "BIST-100", "market_value": 400000000000, "free_float": 0.55},
    {"stock_code": "SISE", "company_name": "Şişe Cam", "sector": "Cam, Seramik", "sub_sector": "Cam", "market": "BIST-100", "market_value": 150000000000, "free_float": 0.40},
    {"stock_code": "EREGL", "company_name": "Ereğli Demir Çelik", "sector": "Demir ve Demir Dışı Metaller", "sub_sector": "Demir Çelik", "market": "BIST-100", "market_value": 200000000000, "free_float": 0.35},
    {"stock_code": "BIMAS", "company_name": "BİM Mağazalar", "sector": "Perakende", "sub_sector": "Gıda Perakende", "market": "BIST-100", "market_value": 350000000000, "free_float": 0.60},
    {"stock_code": "ASELS", "company_name": "ASELSAN", "sector": "Savunma", "sub_sector": "Elektronik", "market": "BIST-100", "market_value": 250000000000, "free_float": 0.15},
    {"stock_code": "KOZAL", "company_name": "Koza Altın", "sector": "Madencilik", "sub_sector": "Altın", "market": "BIST-100", "market_value": 120000000000, "free_float": 0.30},
    {"stock_code": "TOASO", "company_name": "Tofaş Oto. Fab.", "sector": "Otomotiv", "sub_sector": "Binek Araç", "market": "BIST-100", "market_value": 180000000000, "free_float": 0.45},
    {"stock_code": "PETKM", "company_name": "Petkim", "sector": "Kimya", "sub_sector": "Kimyasal Madde", "market": "BIST-100", "market_value": 90000000000, "free_float": 0.50},
    {"stock_code": "FROTO", "company_name": "Ford Otomotiv", "sector": "Otomotiv", "sub_sector": "Ticari Araç", "market": "BIST-100", "market_value": 220000000000, "free_float": 0.40},
    {"stock_code": "TUPRS", "company_name": "Tüpraş", "sector": "Enerji", "sub_sector": "Petrol Rafineri", "market": "BIST-100", "market_value": 280000000000, "free_float": 0.20},
    {"stock_code": "ARCLK", "company_name": "Arçelik", "sector": "Beyaz Eşya", "sub_sector": "Dayanıklı Tüketim", "market": "BIST-100", "market_value": 110000000000, "free_float": 0.50},
    {"stock_code": "KCHOL", "company_name": "Koç Holding", "sector": "Holding", "sub_sector": "Yatırım Holding", "market": "BIST-100", "market_value": 450000000000, "free_float": 0.35},
    {"stock_code": "SAHOL", "company_name": "Sabancı Holding", "sector": "Holding", "sub_sector": "Yatırım Holding", "market": "BIST-100", "market_value": 320000000000, "free_float": 0.40},
]


def seed_companies(session):
    companies = []
    for data in SEED_COMPANIES:
        company = Company(**data)
        session.add(company)
        companies.append(company)
    session.commit()
    print(f"Seeded {len(companies)} companies")
    return companies


def seed_daily_prices(session, companies):
    count = 0
    for company in companies:
        base_price = random.uniform(20, 300)
        for i in range(30):
            d = date(2024, 1, 1 + i)
            change = random.uniform(-0.05, 0.05)
            open_price = base_price * (1 + change)
            high = open_price * (1 + random.uniform(0, 0.03))
            low = open_price * (1 - random.uniform(0, 0.03))
            close = open_price * (1 + random.uniform(-0.02, 0.02))
            volume = random.uniform(500000, 5000000)
            turnover = volume * close

            dp = DailyPrice(
                company_id=company.id,
                date=d,
                open=round(open_price, 2),
                high=round(high, 2),
                low=round(low, 2),
                close=round(close, 2),
                volume=round(volume, 0),
                turnover=round(turnover, 2),
            )
            session.add(dp)
            base_price = close
            count += 1
    session.commit()
    print(f"Seeded {count} daily prices")


def seed_financial_reports(session, companies):
    count = 0
    for company in companies:
        revenue = random.uniform(1000000000, 50000000000)
        for year in [2022, 2023, 2024]:
            for quarter in [1, 2, 3, 4]:
                fr = FinancialReport(
                    company_id=company.id,
                    period=f"{year}Q{quarter}",
                    year=year,
                    quarter=quarter,
                    revenue=round(revenue * (1 + random.uniform(-0.1, 0.15)), 2),
                    gross_profit=round(revenue * random.uniform(0.2, 0.5), 2),
                    ebitda=round(revenue * random.uniform(0.1, 0.3), 2),
                    operating_profit=round(revenue * random.uniform(0.05, 0.25), 2),
                    net_profit=round(revenue * random.uniform(0.02, 0.2), 2),
                    equity=round(revenue * random.uniform(0.3, 0.8), 2),
                    assets=round(revenue * random.uniform(1.0, 3.0), 2),
                    liabilities=round(revenue * random.uniform(0.5, 2.0), 2),
                    cash=round(revenue * random.uniform(0.05, 0.3), 2),
                    net_debt=round(revenue * random.uniform(0.1, 0.5), 2),
                    shares=round(random.uniform(100000000, 5000000000), 0),
                    eps=round(random.uniform(0.5, 15.0), 2),
                )
                session.add(fr)
                count += 1
    session.commit()
    print(f"Seeded {count} financial reports")


def seed_financial_ratios(session, companies):
    count = 0
    for company in companies:
        for year in [2022, 2023, 2024]:
            for quarter in [1, 2, 3, 4]:
                fr = FinancialRatio(
                    company_id=company.id,
                    period=f"{year}Q{quarter}",
                    year=year,
                    quarter=quarter,
                    pd_dd=round(random.uniform(1.0, 8.0), 2),
                    fk=round(random.uniform(5.0, 30.0), 2),
                    fd_favok=round(random.uniform(3.0, 20.0), 2),
                    peg=round(random.uniform(0.5, 3.0), 2),
                    ev_sales=round(random.uniform(0.5, 5.0), 2),
                    roe=round(random.uniform(5.0, 30.0), 2),
                    roa=round(random.uniform(2.0, 15.0), 2),
                    roic=round(random.uniform(8.0, 25.0), 2),
                    net_debt_ebitda=round(random.uniform(0.5, 4.0), 2),
                    current_ratio=round(random.uniform(0.8, 2.5), 2),
                    quick_ratio=round(random.uniform(0.5, 2.0), 2),
                    piotroski=round(random.uniform(2.0, 8.0), 1),
                    altman=round(random.uniform(1.0, 4.0), 2),
                    beneish=round(random.uniform(-3.0, 3.0), 2),
                    revenue_growth=round(random.uniform(-0.1, 0.3), 4),
                    net_profit_growth=round(random.uniform(-0.2, 0.4), 4),
                    ebitda_growth=round(random.uniform(-0.15, 0.35), 4),
                    fcf_growth=round(random.uniform(-0.25, 0.45), 4),
                )
                session.add(fr)
                count += 1
    session.commit()
    print(f"Seeded {count} financial ratios")


def seed_technical_indicators(session, companies):
    count = 0
    for company in companies:
        base_price = random.uniform(20, 300)
        for i in range(30):
            d = date(2024, 1, 1 + i)
            base_price *= (1 + random.uniform(-0.03, 0.03))

            ti = TechnicalIndicator(
                company_id=company.id,
                date=d,
                sma_9=round(base_price * random.uniform(0.95, 1.05), 2),
                sma_20=round(base_price * random.uniform(0.93, 1.07), 2),
                sma_50=round(base_price * random.uniform(0.90, 1.10), 2),
                sma_100=round(base_price * random.uniform(0.88, 1.12), 2),
                sma_200=round(base_price * random.uniform(0.85, 1.15), 2),
                ema_9=round(base_price * random.uniform(0.95, 1.05), 2),
                ema_20=round(base_price * random.uniform(0.93, 1.07), 2),
                ema_50=round(base_price * random.uniform(0.90, 1.10), 2),
                ema_100=round(base_price * random.uniform(0.88, 1.12), 2),
                ema_200=round(base_price * random.uniform(0.85, 1.15), 2),
                rsi=round(random.uniform(20, 80), 2),
                stochastic_rsi=round(random.uniform(0, 100), 2),
                macd=round(random.uniform(-5, 5), 4),
                macd_signal=round(random.uniform(-5, 5), 4),
                adx=round(random.uniform(10, 50), 2),
                atr=round(random.uniform(1, 10), 2),
                obv=round(random.uniform(1000000, 50000000), 0),
                cmf=round(random.uniform(-0.3, 0.3), 4),
                vwap=round(base_price * random.uniform(0.98, 1.02), 2),
                mfi=round(random.uniform(10, 90), 2),
                ichimoku=round(base_price * random.uniform(0.90, 1.10), 2),
                supertrend=round(base_price * random.uniform(0.92, 1.08), 2),
                bollinger_upper=round(base_price * 1.05, 2),
                bollinger_middle=round(base_price, 2),
                bollinger_lower=round(base_price * 0.95, 2),
                donchian_upper=round(base_price * 1.08, 2),
                donchian_lower=round(base_price * 0.92, 2),
            )
            session.add(ti)
            count += 1
    session.commit()
    print(f"Seeded {count} technical indicators")


def seed_elite_scores(session, companies):
    count = 0
    for company in companies:
        for i in range(5):
            d = date(2024, 1, 1 + i * 7)
            es = EliteScore(
                company_id=company.id,
                analysis_date=d,
                weekly_score=round(random.uniform(30, 95), 1),
                one_month_score=round(random.uniform(30, 95), 1),
                three_month_score=round(random.uniform(30, 95), 1),
                five_month_score=round(random.uniform(30, 95), 1),
                one_year_score=round(random.uniform(30, 95), 1),
                technical_score=round(random.uniform(30, 95), 1),
                fundamental_score=round(random.uniform(30, 95), 1),
                smart_money_score=round(random.uniform(30, 95), 1),
                story_score=round(random.uniform(30, 95), 1),
                risk_score=round(random.uniform(10, 80), 1),
                explosion_score=round(random.uniform(20, 90), 1),
                elite_score=round(random.uniform(40, 90), 1),
            )
            session.add(es)
            count += 1
    session.commit()
    print(f"Seeded {count} elite scores")


def seed_watchlists(session, companies):
    watchlist = Watchlist(name="Ana İzleme Listesi", description="Günlük takip", sort_order=0)
    session.add(watchlist)
    session.flush()

    for company in companies[:5]:
        item = WatchlistItem(
            watchlist_id=watchlist.id,
            company_id=company.id,
            sort_order=0,
        )
        session.add(item)
    session.commit()
    print("Seeded 1 watchlist with 5 items")


def seed_saved_filters(session):
    filters = [
        SavedFilter(name="Yüksek Temettü", filter_config=json.dumps({"dividend_yield_min": 3.0, "sector": "all"})),
        SavedFilter(name="Düşük F/K", filter_config=json.dumps({"fk_max": 10.0, "market_cap_min": 10000000000})),
        SavedFilter(name="Güçlü Teknik", filter_config=json.dumps({"rsi_min": 40, "rsi_max": 60, "trend": "up"})),
    ]
    for f in filters:
        session.add(f)
    session.commit()
    print("Seeded 3 saved filters")


def seed_portfolios(session, companies):
    portfolio = Portfolio(name="Ana Portföy", description="Uzun vadeli yatırım")
    session.add(portfolio)
    session.flush()

    for company in companies[:4]:
        qty = random.randint(10, 500)
        avg = random.uniform(20, 200)
        item = PortfolioItem(
            portfolio_id=portfolio.id,
            company_id=company.id,
            quantity=qty,
            average_price=round(avg, 2),
            current_price=round(avg * random.uniform(0.85, 1.25), 2),
        )
        session.add(item)
    session.commit()
    print("Seeded 1 portfolio with 4 items")


def seed_telegram_settings(session):
    ts = TelegramSetting(
        bot_token="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
        chat_id="-1001234567890",
        enabled=False,
    )
    session.add(ts)
    session.commit()
    print("Seeded telegram settings")


def seed_application_settings(session):
    settings = [
        ApplicationSetting(setting_key="language", setting_value="tr", setting_type="string", description="Uygulama dili", is_public=True),
        ApplicationSetting(setting_key="theme", setting_value="dark", setting_type="string", description="Tema seçimi", is_public=True),
        ApplicationSetting(setting_key="appearance", setting_value="compact", setting_type="string", description="Görünüm modu", is_public=True),
        ApplicationSetting(setting_key="notifications_enabled", setting_value="true", setting_type="boolean", description="Bildirimler", is_public=True),
        ApplicationSetting(setting_key="default_currency", setting_value="TRY", setting_type="string", description="Para birimi", is_public=True),
    ]
    for s in settings:
        session.add(s)
    session.commit()
    print("Seeded 5 application settings")


def seed_sector_strength(session):
    sectors = ["Bankacılık", "Ulaştırma", "Cam, Seramik", "Demir ve Demir Dışı Metaller", "Perakende", "Savunma", "Madencilik", "Otomotiv", "Kimya", "Enerji", "Holding"]
    count = 0
    for sector in sectors:
        for i in range(7):
            d = date(2024, 1, 1 + i)
            ss = SectorStrength(
                sector=sector,
                date=d,
                strength_score=round(random.uniform(30, 90), 1),
                momentum=round(random.uniform(-5, 10), 2),
                relative_strength=round(random.uniform(0.5, 2.0), 2),
                breadth=round(random.uniform(0.3, 0.9), 2),
            )
            session.add(ss)
            count += 1
    session.commit()
    print(f"Seeded {count} sector strength records")


def seed_market_summary(session):
    count = 0
    bist = 10000
    for i in range(30):
        d = date(2024, 1, 1 + i)
        change = random.uniform(-0.03, 0.03)
        bist *= (1 + change)
        ms = MarketSummary(
            date=d,
            bist_100=round(bist, 2),
            bist_100_change=round(bist * change, 2),
            bist_100_change_percent=round(change * 100, 2),
            total_volume=round(random.uniform(50000000, 200000000), 0),
            total_turnover=round(random.uniform(5000000000, 30000000000), 0),
            advancing=random.randint(100, 400),
            declining=random.randint(50, 300),
            unchanged=random.randint(10, 50),
            new_highs=random.randint(0, 30),
            new_lows=random.randint(0, 20),
            foreign_net_buy=round(random.uniform(-500000000, 500000000), 0),
            usd_try=round(random.uniform(28, 32), 4),
            eur_try=round(random.uniform(30, 35), 4),
            gold_price=round(random.uniform(1800, 2100), 2),
        )
        session.add(ms)
        count += 1
    session.commit()
    print(f"Seeded {count} market summaries")


def seed_notifications(session, companies):
    types = ["price_alert", "analysis_complete", "news", "system"]
    severities = ["info", "warning", "danger", "success"]
    count = 0
    for _ in range(20):
        n = Notification(
            company_id=random.choice(companies).id if random.random() > 0.3 else None,
            type=random.choice(types),
            title=f"Notification #{count + 1}",
            message="Bu bir örnek bildirim mesajıdır.",
            severity=random.choice(severities),
        )
        session.add(n)
        count += 1
    session.commit()
    print(f"Seeded {count} notifications")


def seed_system_logs(session):
    modules = ["api", "scheduler", "telegram", "ai_engine", "data_fetcher"]
    levels = ["INFO", "WARNING", "ERROR", "DEBUG"]
    count = 0
    for _ in range(30):
        log = SystemLog(
            level=random.choice(levels),
            module=random.choice(modules),
            message=f"System log message #{count + 1}",
        )
        session.add(log)
        count += 1
    session.commit()
    print(f"Seeded {count} system logs")


def seed_ai_analysis(session, companies):
    types = ["market_analysis", "stock_analysis", "sector_analysis"]
    count = 0
    for company in companies[:5]:
        for atype in types:
            ai = AIAnalysis(
                company_id=company.id,
                analysis_type=atype,
                model_name="gpt-4",
                response=f"{company.company_name} hakkında AI analiz sonucu.",
                confidence=round(random.uniform(0.6, 0.95), 2),
                sentiment=random.choice(["positive", "negative", "neutral"]),
            )
            session.add(ai)
            count += 1
    session.commit()
    print(f"Seeded {count} AI analyses")


def main():
    print("=" * 50)
    print("BIST Elite AI - Database Seed Script")
    print("=" * 50)

    Base.metadata.create_all(bind=engine)
    session = SessionLocal()

    try:
        seed_companies(session)
        companies = session.query(Company).all()

        seed_daily_prices(session, companies)
        seed_financial_reports(session, companies)
        seed_financial_ratios(session, companies)
        seed_technical_indicators(session, companies)
        seed_elite_scores(session, companies)
        seed_watchlists(session, companies)
        seed_saved_filters(session)
        seed_portfolios(session, companies)
        seed_telegram_settings(session)
        seed_application_settings(session)
        seed_sector_strength(session)
        seed_market_summary(session)
        seed_notifications(session, companies)
        seed_system_logs(session)
        seed_ai_analysis(session, companies)

        print("=" * 50)
        print("Seed completed successfully!")
        print("=" * 50)

    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
