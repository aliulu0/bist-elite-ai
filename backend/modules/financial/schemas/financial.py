from datetime import date, datetime
from pydantic import BaseModel, Field


class StatementCreate(BaseModel):
    stock_code: str = Field(..., min_length=1, max_length=10)
    period: str = Field(..., pattern=r"^\d{4}Q[1-4]$")
    year: int = Field(..., ge=2000, le=2035)
    quarter: int = Field(..., ge=1, le=4)
    report_type: str = Field(default="quarterly")
    currency: str = Field(default="TRY", max_length=3)
    is_restated: bool = False
    filing_date: date | None = None

    revenue: float | None = None
    cost_of_sales: float | None = None
    gross_profit: float | None = None
    operating_expenses: float | None = None
    operating_profit: float | None = None
    ebit: float | None = None
    ebitda: float | None = None
    pretax_income: float | None = None
    net_profit: float | None = None
    eps: float | None = None
    diluted_eps: float | None = None
    shares_outstanding: float | None = None

    cash: float | None = None
    cash_equivalents: float | None = None
    receivables: float | None = None
    inventories: float | None = None
    current_assets: float | None = None
    fixed_assets: float | None = None
    total_assets: float | None = None
    short_term_debt: float | None = None
    long_term_debt: float | None = None
    total_debt: float | None = None
    current_liabilities: float | None = None
    total_liabilities: float | None = None
    equity: float | None = None
    book_value: float | None = None
    net_debt: float | None = None
    working_capital: float | None = None

    operating_cash_flow: float | None = None
    investing_cash_flow: float | None = None
    financing_cash_flow: float | None = None
    capital_expenditure: float | None = None
    free_cash_flow: float | None = None
    dividend_paid: float | None = None
    share_buyback: float | None = None


class StatementResponse(BaseModel):
    id: str
    company_id: str
    period: str
    year: int
    quarter: int
    report_type: str
    currency: str
    is_restated: bool
    filing_date: date | None = None

    revenue: float | None = None
    cost_of_sales: float | None = None
    gross_profit: float | None = None
    operating_expenses: float | None = None
    operating_profit: float | None = None
    ebit: float | None = None
    ebitda: float | None = None
    pretax_income: float | None = None
    net_profit: float | None = None
    eps: float | None = None
    diluted_eps: float | None = None
    shares_outstanding: float | None = None

    cash: float | None = None
    cash_equivalents: float | None = None
    receivables: float | None = None
    inventories: float | None = None
    current_assets: float | None = None
    fixed_assets: float | None = None
    total_assets: float | None = None
    short_term_debt: float | None = None
    long_term_debt: float | None = None
    total_debt: float | None = None
    current_liabilities: float | None = None
    total_liabilities: float | None = None
    equity: float | None = None
    book_value: float | None = None
    net_debt: float | None = None
    working_capital: float | None = None

    operating_cash_flow: float | None = None
    investing_cash_flow: float | None = None
    financing_cash_flow: float | None = None
    capital_expenditure: float | None = None
    free_cash_flow: float | None = None
    dividend_paid: float | None = None
    share_buyback: float | None = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RatioResponse(BaseModel):
    id: str
    company_id: str
    period: str
    year: int
    quarter: int
    report_type: str

    pe_ratio: float | None = None
    pb_ratio: float | None = None
    ev_ebitda: float | None = None
    ev_sales: float | None = None
    peg_ratio: float | None = None
    price_sales: float | None = None
    enterprise_value: float | None = None

    gross_margin: float | None = None
    operating_margin: float | None = None
    ebitda_margin: float | None = None
    net_margin: float | None = None
    fcf_margin: float | None = None

    roe: float | None = None
    roa: float | None = None
    roic: float | None = None
    roce: float | None = None
    gross_return: float | None = None

    debt_equity: float | None = None
    debt_assets: float | None = None
    net_debt_ebitda: float | None = None
    interest_coverage: float | None = None
    current_ratio: float | None = None
    quick_ratio: float | None = None
    cash_ratio: float | None = None

    asset_turnover: float | None = None
    inventory_turnover: float | None = None
    receivable_turnover: float | None = None
    cash_conversion_cycle: float | None = None

    revenue_growth_q: float | None = None
    revenue_growth_y: float | None = None
    revenue_cagr_3y: float | None = None
    revenue_cagr_5y: float | None = None
    profit_growth_q: float | None = None
    profit_growth_y: float | None = None
    profit_cagr_3y: float | None = None
    profit_cagr_5y: float | None = None
    eps_growth_q: float | None = None
    eps_growth_y: float | None = None
    eps_cagr_3y: float | None = None
    eps_cagr_5y: float | None = None
    book_value_growth_y: float | None = None
    book_value_cagr_3y: float | None = None
    book_value_cagr_5y: float | None = None
    ebitda_growth_y: float | None = None
    fcf_growth_y: float | None = None

    ttm_revenue: float | None = None
    ttm_net_profit: float | None = None
    ttm_eps: float | None = None
    ttm_ebitda: float | None = None
    ttm_fcf: float | None = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DividendResponse(BaseModel):
    id: str
    company_id: str
    ex_date: date
    payment_date: date | None = None
    gross_dividend: float
    net_dividend: float | None = None
    yield_pct: float | None = None
    payout_ratio: float | None = None
    dividend_per_share: float | None = None
    period: str | None = None
    year: int | None = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CapitalEventResponse(BaseModel):
    id: str
    company_id: str
    event_type: str
    event_date: date
    ratio: float | None = None
    price_adjustment: float | None = None
    description: str | None = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QualityScoreResponse(BaseModel):
    id: str
    company_id: str
    period: str
    year: int
    quarter: int
    as_of_date: date

    piotroski_f_score: int | None = None
    altman_z_score: float | None = None
    beneish_m_score: float | None = None
    financial_strength_score: float | None = None
    profitability_score: float | None = None
    growth_score: float | None = None
    dividend_quality_score: float | None = None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GrowthResponse(BaseModel):
    stock_code: str
    revenue_growth_q: float | None = None
    revenue_growth_y: float | None = None
    revenue_cagr_3y: float | None = None
    revenue_cagr_5y: float | None = None
    profit_growth_q: float | None = None
    profit_growth_y: float | None = None
    profit_cagr_3y: float | None = None
    profit_cagr_5y: float | None = None
    eps_growth_q: float | None = None
    eps_growth_y: float | None = None
    eps_cagr_3y: float | None = None
    eps_cagr_5y: float | None = None
    book_value_growth_y: float | None = None
    ebitda_growth_y: float | None = None
    fcf_growth_y: float | None = None


class FinancialLatestResponse(BaseModel):
    stock_code: str
    statement: StatementResponse | None = None
    ratios: RatioResponse | None = None
    quality_scores: QualityScoreResponse | None = None


class FinancialHistoryResponse(BaseModel):
    stock_code: str
    total_records: int
    statements: list[StatementResponse]


class FinancialRatiosResponse(BaseModel):
    stock_code: str
    ratios: list[RatioResponse]


class FinancialDividendsResponse(BaseModel):
    stock_code: str
    total_records: int
    dividends: list[DividendResponse]


class FinancialQualityResponse(BaseModel):
    stock_code: str
    scores: QualityScoreResponse | None = None


class FinancialUpdateRequest(BaseModel):
    stock_code: str = Field(..., min_length=1, max_length=10)


class FinancialUpdateResponse(BaseModel):
    status: str
    stock_code: str
    records_added: int
    records_updated: int
    ratios_calculated: int
    scores_calculated: int
    execution_time_ms: float
    message: str


class FinancialBulkUpdateResponse(BaseModel):
    status: str
    total_companies: int
    successful: int
    failed: int
    total_records_added: int
    total_records_updated: int
    total_ratios_calculated: int
    total_scores_calculated: int
    execution_time_ms: float
    errors: list[str] = []
