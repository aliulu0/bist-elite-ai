"use client";

import { MainLayout } from "@/components/layout";
import { useI18n } from "@/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle, Input, PageHeader, Badge } from "@/components";
import { Search, Filter, TrendingUp, TrendingDown } from "lucide-react";

export default function ScreenerPage() {
  const { t } = useI18n();

  return (
    <MainLayout>
      <PageHeader
        title={t("screener.title")}
        subtitle={t("screener.subtitle")}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder={t("screener.search")}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {t("screener.filter")}
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("screener.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted">
                    {t("screener.sector")}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted">
                    {t("screener.price")}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted">
                    {t("screener.change")}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted">
                    {t("screener.marketCap")}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted">
                    {t("screener.volume")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { symbol: "GARAN", name: "Garanti Bankası", price: 120.5, change: 3.2, marketCap: "500B", volume: "1.2M" },
                  { symbol: "AKBNK", name: "Akbank", price: 65.3, change: 2.1, marketCap: "300B", volume: "800K" },
                  { symbol: "THYAO", name: "Türk Hava Yolları", price: 280.5, change: -1.5, marketCap: "400B", volume: "2.1M" },
                  { symbol: "SISE", name: "Şişe Cam", price: 45.2, change: 0.8, marketCap: "150B", volume: "500K" },
                  { symbol: "EREGL", name: "Ereğli Demir Çelik", price: 52.1, change: -0.5, marketCap: "200B", volume: "600K" },
                ].map((stock) => (
                  <tr
                    key={stock.symbol}
                    className="border-b border-border/50 transition-colors hover:bg-border/20"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-text">{stock.symbol}</p>
                        <p className="text-xs text-muted">{stock.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-text">
                      {stock.price.toFixed(2)} TL
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Badge variant={stock.change >= 0 ? "success" : "danger"}>
                        {stock.change >= 0 ? "+" : ""}
                        {stock.change.toFixed(2)}%
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-muted">
                      {stock.marketCap}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-muted">
                      {stock.volume}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
