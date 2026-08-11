"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioSummary } from "@/hooks";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Briefcase, TrendingUp, TrendingDown, Banknote } from "lucide-react";

export function PortfolioSummaryWidget() {
  const { data, isLoading } = usePortfolioSummary();

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse rounded-xl bg-border/50" />
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      label: "Total Value",
      value: formatCurrency(data.totalValue),
      icon: <Briefcase className="h-5 w-5 text-primary" />,
    },
    {
      label: "Cash",
      value: formatCurrency(data.cash),
      icon: <Banknote className="h-5 w-5 text-success" />,
    },
    {
      label: "Profit / Loss",
      value: formatCurrency(data.totalProfitLoss),
      change: data.totalProfitLossPercent,
      icon:
        data.totalProfitLoss >= 0 ? (
          <TrendingUp className="h-5 w-5 text-success" />
        ) : (
          <TrendingDown className="h-5 w-5 text-danger" />
        ),
    },
    {
      label: "Positions",
      value: String(data.positionCount),
      icon: <Briefcase className="h-5 w-5 text-warning" />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-background/50 p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                {item.icon}
                <span className="text-xs text-muted">{item.label}</span>
              </div>
              <p className="text-lg font-bold text-text">{item.value}</p>
              {item.change !== undefined && (
                <p
                  className={`text-xs ${
                    item.change >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {formatPercent(item.change)}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
