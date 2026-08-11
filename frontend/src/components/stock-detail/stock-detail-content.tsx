"use client";

import { useStockDetail, useRankedStock } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StockDetailContentProps {
  symbol: string;
}

export function StockDetailContent({ symbol }: StockDetailContentProps) {
  const { data: detail, isLoading: detailLoading } = useStockDetail(symbol);
  const { data: ranking } = useRankedStock(symbol);

  if (detailLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );
  }

  const priceChange =
    detail?.changePercent ?? ranking?.changePercent ?? 0;
  const isUp = priceChange >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between rounded-2xl border border-border bg-card p-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text">{symbol}</h1>
            {detail && <span className="text-lg text-muted">{detail.name}</span>}
            {ranking && (
              <Badge variant="primary">Rank #{ranking.rank}</Badge>
            )}
          </div>
          {detail && (
            <div className="mt-2 flex items-center gap-4 text-sm text-muted">
              <span>{detail.sector}</span>
              {detail.industry && <span>• {detail.industry}</span>}
              <span>
                • Market Cap: {formatCurrency(detail.marketCap)}
              </span>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-text">
            {detail ? formatCurrency(detail.price) : ranking ? formatCurrency(ranking.price) : "-"}
          </p>
          <div className="flex items-center justify-end gap-1">
            {isUp ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : priceChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-danger" />
            ) : (
              <Minus className="h-4 w-4 text-muted" />
            )}
            <span
              className={`text-sm font-medium ${
                isUp ? "text-success" : "text-danger"
              }`}
            >
              {formatPercent(priceChange)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {ranking && (
          <Card>
            <CardHeader>
              <CardTitle>Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Score</span>
                  <span className="font-semibold text-text">
                    {ranking.score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Confidence</span>
                  <span className="font-semibold text-text">
                    {ranking.confidence}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Grade</span>
                  <span className="font-bold text-text">
                    {ranking.investmentGrade}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Recommendation</span>
                  <Badge
                    variant={
                      ranking.recommendation === "STRONG_BUY" ||
                      ranking.recommendation === "BUY"
                        ? "success"
                        : ranking.recommendation === "SELL" ||
                            ranking.recommendation === "STRONG_SELL"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {ranking.recommendation}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Risk</span>
                  <span className="font-semibold text-text">
                    {ranking.risk.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Trend</span>
                  <span className="font-semibold text-text">
                    {ranking.trend}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {detail?.financialSummary && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "P/E Ratio", value: detail.financialSummary.pe.toFixed(2) },
                  { label: "P/B Ratio", value: detail.financialSummary.pb.toFixed(2) },
                  {
                    label: "Dividend Yield",
                    value: formatPercent(detail.financialSummary.dividendYield),
                  },
                  {
                    label: "Revenue",
                    value: formatCurrency(detail.financialSummary.revenue),
                  },
                  {
                    label: "Profit",
                    value: formatCurrency(detail.financialSummary.profit),
                  },
                  {
                    label: "Debt/Equity",
                    value: detail.financialSummary.debtToEquity.toFixed(2),
                  },
                  {
                    label: "ROE",
                    value: formatPercent(detail.financialSummary.roe),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted">{item.label}</span>
                    <span className="font-medium text-text">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {detail?.technicalSummary && (
          <Card>
            <CardHeader>
              <CardTitle>Technical Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "RSI", value: detail.technicalSummary.rsi.toFixed(1) },
                  { label: "MACD", value: detail.technicalSummary.macd },
                  {
                    label: "SMA 20",
                    value: formatCurrency(detail.technicalSummary.sma20),
                  },
                  {
                    label: "SMA 50",
                    value: formatCurrency(detail.technicalSummary.sma50),
                  },
                  {
                    label: "SMA 200",
                    value: formatCurrency(detail.technicalSummary.sma200),
                  },
                  { label: "Trend", value: detail.technicalSummary.trend },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted">{item.label}</span>
                    <span className="font-medium text-text">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {detail?.aiAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted">
                {detail.aiAnalysis.summary}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-success">
                    Strengths
                  </p>
                  <ul className="space-y-0.5">
                    {detail.aiAnalysis.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-muted">
                        ✓ {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-danger">
                    Weaknesses
                  </p>
                  <ul className="space-y-0.5">
                    {detail.aiAnalysis.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-muted">
                        ✗ {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {detail?.portfolioPosition && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Position</CardTitle>
            </CardHeader>
            <CardContent>
              {detail.portfolioPosition.hasPosition ? (
                <div className="space-y-3">
                  {[
                    {
                      label: "Quantity",
                      value: String(detail.portfolioPosition.quantity),
                    },
                    {
                      label: "Average Cost",
                      value: formatCurrency(detail.portfolioPosition.averageCost ?? 0),
                    },
                    {
                      label: "Current Value",
                      value: formatCurrency(detail.portfolioPosition.currentValue ?? 0),
                    },
                    {
                      label: "Profit / Loss",
                      value: formatCurrency(detail.portfolioPosition.profitLoss ?? 0),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted">{item.label}</span>
                      <span className="font-medium text-text">
                        {item.value}
                      </span>
                    </div>
                  ))}
                  {detail.portfolioPosition.profitLossPercent !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Return</span>
                      <span
                        className={`font-medium ${
                          detail.portfolioPosition.profitLossPercent >= 0
                            ? "text-success"
                            : "text-danger"
                        }`}
                      >
                        {formatPercent(detail.portfolioPosition.profitLossPercent)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">No position in portfolio</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {detail?.opportunityHistory && detail.opportunityHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Opportunity History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {detail.opportunityHistory.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-xl bg-background/50 p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      variant={
                        opp.confidence >= 70
                          ? "success"
                          : opp.confidence >= 40
                            ? "warning"
                            : "danger"
                      }
                    >
                      {opp.confidence}%
                    </Badge>
                    <span className="text-xs text-muted">
                      {new Date(opp.detectedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {opp.reasons.map((r, i) => (
                    <p key={i} className="text-sm text-muted">
                      • {r}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {detail?.alertHistory && detail.alertHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alert History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {detail.alertHistory.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-xl bg-background/50 p-3"
                >
                  <div>
                    <p className="text-sm text-text">{alert.message}</p>
                    <p className="text-xs text-muted">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      alert.priority === "CRITICAL"
                        ? "danger"
                        : alert.priority === "HIGH"
                          ? "warning"
                          : "default"
                    }
                  >
                    {alert.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
