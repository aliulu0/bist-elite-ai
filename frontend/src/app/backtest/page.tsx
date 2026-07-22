"use client";

import { MainLayout } from "@/components/layout";
import { useI18n } from "@/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Select, Button, Input } from "@/components";
import { Activity, Target, TrendingUp, BarChart3 } from "lucide-react";

export default function BacktestPage() {
  const { t } = useI18n();

  return (
    <MainLayout>
      <PageHeader
        title={t("backtest.title")}
        subtitle={t("backtest.subtitle")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("backtest.strategy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label={t("backtest.strategy")}
                  options={[
                    { value: "sma_crossover", label: "SMA Cross" },
                    { value: "rsi_reversal", label: "RSI Reversal" },
                    { value: "macd_signal", label: "MACD Signal" },
                    { value: "bollinger", label: "Bollinger Bands" },
                  ]}
                />
                <Select
                  label={t("backtest.period")}
                  options={[
                    { value: "1y", label: "1 Yıl" },
                    { value: "3y", label: "3 Yıl" },
                    { value: "5y", label: "5 Yıl" },
                    { value: "10y", label: "10 Yıl" },
                  ]}
                />
              </div>
              <div className="mt-4">
                <Button>{t("backtest.results")}</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-success/10 p-2 text-success">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted">{t("backtest.performance")}</p>
                  <p className="text-xl font-bold text-success">+45.2%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted">{t("backtest.winRate")}</p>
                  <p className="text-xl font-bold text-text">68.5%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-danger/10 p-2 text-danger">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted">{t("backtest.maxDrawdown")}</p>
                  <p className="text-xl font-bold text-danger">-12.3%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2 text-warning">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted">{t("backtest.sharpe")}</p>
                  <p className="text-xl font-bold text-text">1.85</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
