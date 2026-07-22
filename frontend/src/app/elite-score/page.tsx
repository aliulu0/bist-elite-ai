"use client";

import { MainLayout } from "@/components/layout";
import { useI18n } from "@/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Badge } from "@/components";
import { Star, TrendingUp, Target, BarChart3 } from "lucide-react";

export default function EliteScorePage() {
  const { t } = useI18n();

  return (
    <MainLayout>
      <PageHeader
        title={t("eliteScore.title")}
        subtitle={t("eliteScore.subtitle")}
      />

      <div className="mb-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted">{t("eliteScore.description")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {[
          { symbol: "GARAN", name: "Garanti Bankası", score: 85, rating: "STRONG_BUY" as const },
          { symbol: "AKBNK", name: "Akbank", score: 78, rating: "BUY" as const },
          { symbol: "THYAO", name: "Türk Hava Yolları", score: 65, rating: "HOLD" as const },
          { symbol: "SISE", name: "Şişe Cam", score: 72, rating: "BUY" as const },
          { symbol: "EREGL", name: "Ereğli Demir Çelik", score: 55, rating: "HOLD" as const },
          { symbol: "BIMAS", name: "BİM Mağazalar", score: 88, rating: "STRONG_BUY" as const },
        ].map((stock) => (
          <Card key={stock.symbol} variant="hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{stock.symbol}</CardTitle>
                  <p className="text-sm text-muted">{stock.name}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Star className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">{t("eliteScore.score")}</p>
                  <p className="text-3xl font-bold text-text">{stock.score}</p>
                </div>
                <Badge
                  variant={
                    stock.rating === "STRONG_BUY"
                      ? "success"
                      : stock.rating === "BUY"
                      ? "success"
                      : stock.rating === "HOLD"
                      ? "warning"
                      : "danger"
                  }
                >
                  {stock.rating}
                </Badge>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Teknik", value: 80 },
                  { label: "Temel", value: 75 },
                  { label: "Momentum", value: 70 },
                ].map((factor) => (
                  <div key={factor.label}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">{factor.label}</span>
                      <span className="text-text">{factor.value}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${factor.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
