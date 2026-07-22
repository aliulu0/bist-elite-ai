"use client";

import { MainLayout } from "@/components/layout";
import { useI18n } from "@/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Button, Badge } from "@/components";
import { Briefcase, Plus, TrendingUp, TrendingDown } from "lucide-react";

export default function PortfolioPage() {
  const { t } = useI18n();

  return (
    <MainLayout>
      <PageHeader
        title={t("portfolio.title")}
        subtitle={t("portfolio.subtitle")}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("portfolio.addStock")}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted">{t("portfolio.totalValue")}</p>
            <p className="mt-1 text-2xl font-bold text-text">125,450.00 TL</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted">{t("portfolio.totalProfit")}</p>
            <p className="mt-1 text-2xl font-bold text-success">+12,350.00 TL</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted">Toplam Kâr Oranı</p>
            <p className="mt-1 text-2xl font-bold text-success">+10.95%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("portfolio.holdings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { symbol: "GARAN", name: "Garanti Bankası", quantity: 100, avgPrice: 110.5, currentPrice: 120.5, profit: 1000 },
              { symbol: "AKBNK", name: "Akbank", quantity: 200, avgPrice: 60.0, currentPrice: 65.3, profit: 1060 },
              { symbol: "THYAO", name: "Türk Hava Yolları", quantity: 50, avgPrice: 270.0, currentPrice: 280.5, profit: 525 },
              { symbol: "SISE", name: "Şişe Cam", quantity: 300, avgPrice: 42.0, currentPrice: 45.2, profit: 960 },
            ].map((holding) => (
              <div
                key={holding.symbol}
                className="flex items-center justify-between rounded-xl bg-background/50 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-text">{holding.symbol}</p>
                    <p className="text-sm text-muted">{holding.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">{holding.quantity} adet</p>
                  <p className="text-sm text-muted">Ort: {holding.avgPrice.toFixed(2)} TL</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-text">{holding.currentPrice.toFixed(2)} TL</p>
                  <p className="text-sm text-success">+{holding.profit.toFixed(2)} TL</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
