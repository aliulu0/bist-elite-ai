"use client";

import { MainLayout } from "@/components/layout";
import { useI18n } from "@/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Tabs, TabsList, TabsTrigger, TabsContent, Input } from "@/components";
import { BarChart3, TrendingUp, Target, Activity } from "lucide-react";

export default function TechnicalAnalysisPage() {
  const { t } = useI18n();

  return (
    <MainLayout>
      <PageHeader
        title={t("technicalAnalysis.title")}
        subtitle={t("technicalAnalysis.subtitle")}
      />

      <div className="mb-6">
        <Input
          placeholder={t("screener.search")}
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      <Tabs value="indicators" onValueChange={() => {}}>
        <TabsList>
          <TabsTrigger value="indicators">{t("technicalAnalysis.indicators")}</TabsTrigger>
          <TabsTrigger value="patterns">{t("technicalAnalysis.patterns")}</TabsTrigger>
          <TabsTrigger value="support">{t("technicalAnalysis.support")}</TabsTrigger>
          <TabsTrigger value="resistance">{t("technicalAnalysis.resistance")}</TabsTrigger>
        </TabsList>

        <TabsContent value="indicators">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[
              { label: "RSI (14)", value: "45.2", status: "neutral" },
              { label: "MACD", value: "1.23", status: "bullish" },
              { label: "SMA 20", value: "120.50", status: "above" },
              { label: "SMA 50", value: "118.30", status: "above" },
              { label: "SMA 200", value: "115.00", status: "above" },
              { label: "Bollinger Bands", value: "118-123", status: "within" },
            ].map((indicator) => (
              <Card key={indicator.label}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted">{indicator.label}</p>
                      <p className="text-xl font-bold text-text">{indicator.value}</p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        indicator.status === "bullish"
                          ? "bg-success/10 text-success"
                          : indicator.status === "bearish"
                          ? "bg-danger/10 text-danger"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {indicator.status}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted">Desen analizi yakında eklenecek</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted">Destek seviyeleri yakında eklenecek</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resistance">
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted">Direnç seviyeleri yakında eklenecek</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
