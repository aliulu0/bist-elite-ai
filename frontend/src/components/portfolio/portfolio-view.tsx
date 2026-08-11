"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AllocationSection } from "./allocation-section";
import { PerformanceSection } from "./performance-section";
import { usePortfolioSummary } from "@/hooks";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export function PortfolioView() {
  const { data: summary } = usePortfolioSummary();
  const [tab, setTab] = useState("allocation");

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted">Invested Capital</p>
            <p className="text-lg font-bold text-text">
              {formatCurrency(summary.investedCapital)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted">Market Value</p>
            <p className="text-lg font-bold text-text">
              {formatCurrency(summary.totalValue)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted">Total Profit/Loss</p>
            <div className="flex items-center gap-2">
              <p
                className={`text-lg font-bold ${
                  summary.totalProfitLoss >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {formatCurrency(Math.abs(summary.totalProfitLoss))}
              </p>
              {summary.totalProfitLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
            </div>
            <p
              className={`text-xs ${
                summary.totalProfitLossPercent >= 0
                  ? "text-success"
                  : "text-danger"
              }`}
            >
              {formatPercent(summary.totalProfitLossPercent)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted">Cash / Stock</p>
            <p className="text-lg font-bold text-text">
              {summary.cashAllocation.toFixed(0)}% / {summary.stockAllocation.toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
        </TabsList>
        <TabsContent value="allocation">
          <AllocationSection />
        </TabsContent>
        <TabsContent value="performance">
          <PerformanceSection />
        </TabsContent>
        <TabsContent value="positions">
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <p>Position data loads from Portfolio Engine</p>
          </div>
        </TabsContent>
        <TabsContent value="risk">
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <p>Risk data loads from Portfolio Engine</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
