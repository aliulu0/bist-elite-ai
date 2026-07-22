"use client";

import { MainLayout } from "@/components/layout";
import { useI18n } from "@/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle, StatCard, PageHeader } from "@/components";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <MainLayout>
      <PageHeader
        title={t("home.title")}
        subtitle={t("home.subtitle")}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("home.marketOverview")}
          value="10,234.56"
          change={1.23}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          title={t("home.topGainers")}
          value="156"
          change={3.45}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title={t("home.topLosers")}
          value="89"
          change={-2.1}
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <StatCard
          title={t("home.mostActive")}
          value="42"
          change={0.5}
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("home.topGainers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["GARAN", "AKBNK", "SISE", "EREGL", "BIMAS"].map((symbol, i) => (
                <div
                  key={symbol}
                  className="flex items-center justify-between rounded-xl bg-background/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">{symbol}</p>
                      <p className="text-xs text-muted">Şirket Adı</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text">
                      {(120.5 + i * 10.3).toFixed(2)} TL
                    </p>
                    <p className="text-xs text-success">
                      +{(3.2 + i * 0.5).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("home.topLosers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["THYAO", "TOASO", "KOZAL", "PETKM", "KOZAA"].map((symbol, i) => (
                <div
                  key={symbol}
                  className="flex items-center justify-between rounded-xl bg-background/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10 text-danger">
                      <ArrowDownRight className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">{symbol}</p>
                      <p className="text-xs text-muted">Şirket Adı</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text">
                      {(280.5 - i * 15.2).toFixed(2)} TL
                    </p>
                    <p className="text-xs text-danger">
                      -{(2.8 + i * 0.4).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
