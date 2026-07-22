"use client";

import { MainLayout } from "@/components/layout";
import { useI18n } from "@/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Input } from "@/components";
import { TrendingUp, DollarSign, BarChart3, PieChart } from "lucide-react";

export default function FundamentalAnalysisPage() {
  const { t } = useI18n();

  return (
    <MainLayout>
      <PageHeader
        title={t("fundamentalAnalysis.title")}
        subtitle={t("fundamentalAnalysis.subtitle")}
      />

      <div className="mb-6">
        <Input
          placeholder={t("screener.search")}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("fundamentalAnalysis.ratios")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: t("fundamentalAnalysis.pe"), value: "12.5", icon: <BarChart3 className="h-4 w-4" /> },
                { label: t("fundamentalAnalysis.pb"), value: "1.8", icon: <PieChart className="h-4 w-4" /> },
                { label: t("fundamentalAnalysis.dividend"), value: "%4.2", icon: <DollarSign className="h-4 w-4" /> },
              ].map((ratio) => (
                <div
                  key={ratio.label}
                  className="flex items-center justify-between rounded-xl bg-background/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      {ratio.icon}
                    </div>
                    <span className="text-sm text-muted">{ratio.label}</span>
                  </div>
                  <span className="text-lg font-semibold text-text">{ratio.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("fundamentalAnalysis.valuation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: t("fundamentalAnalysis.revenue"), value: "45.2B TL", change: 12.5 },
                { label: t("fundamentalAnalysis.profit"), value: "8.5B TL", change: 8.3 },
                { label: "ROE", value: "%18.5", change: 2.1 },
                { label: "ROA", value: "%5.2", change: -0.5 },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between rounded-xl bg-background/50 p-4"
                >
                  <div>
                    <p className="text-sm text-muted">{metric.label}</p>
                    <p className="text-lg font-semibold text-text">{metric.value}</p>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      metric.change >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {metric.change >= 0 ? "+" : ""}
                    {metric.change}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
