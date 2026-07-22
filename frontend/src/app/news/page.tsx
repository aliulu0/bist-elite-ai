"use client";

import { MainLayout } from "@/components/layout";
import { useI18n } from "@/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from "@/components";
import { Newspaper, Clock, ExternalLink } from "lucide-react";

export default function NewsPage() {
  const { t } = useI18n();

  return (
    <MainLayout>
      <PageHeader
        title={t("news.title")}
        subtitle={t("news.subtitle")}
      />

      <Tabs value="latest" onValueChange={() => {}}>
        <TabsList>
          <TabsTrigger value="latest">{t("news.latest")}</TabsTrigger>
          <TabsTrigger value="important">{t("news.important")}</TabsTrigger>
          <TabsTrigger value="all">{t("news.all")}</TabsTrigger>
        </TabsList>

        <TabsContent value="latest">
          <div className="space-y-4">
            {[
              {
                title: "Garanti Bankası 4. Çeyrek Sonuçlarını Açıkladı",
                company: "GARAN",
                date: "2024-01-15",
                content: "Garanti Bankası 4. çeyrekte beklentilerin üzerinde kâr açıkladı. Net kâr önceki çeyreğe göre %15 arttı.",
                category: "Finansal Sonuç",
              },
              {
                title: "Türk Hava Yolları Yeni Rota Açıkladı",
                company: "THYAO",
                date: "2024-01-14",
                content: "Türk Hava Yolları, 2024 yılı için yeni uçuş rotaları planladığını duyurdu.",
                category: "Operasyon",
              },
              {
                title: "Ereğli Demir Çelik Yatırım Planı",
                company: "EREGL",
                date: "2024-01-13",
                content: "Ereğli Demir Çelik, yeni yatırım planı kapsamında 500 milyon TL'lik yatırım yapacağını açıkladı.",
                category: "Yatırım",
              },
            ].map((news, i) => (
              <Card key={i} variant="hover">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <Badge variant="primary">{news.company}</Badge>
                        <Badge>{news.category}</Badge>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Clock className="h-3 w-3" />
                          {news.date}
                        </span>
                      </div>
                      <h3 className="mb-1 text-lg font-semibold text-text">{news.title}</h3>
                      <p className="text-sm text-muted">{news.content}</p>
                    </div>
                    <button className="ml-4 rounded-lg p-2 text-muted hover:bg-border/50 hover:text-text">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="important">
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted">Önemli haberler yükleniyor...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted">Tüm haberler yükleniyor...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
