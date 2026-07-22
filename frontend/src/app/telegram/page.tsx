"use client";

import { MainLayout } from "@/components/layout";
import { useI18n } from "@/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Input, Button, Badge } from "@/components";
import { Send, Bot, User, Settings, Zap } from "lucide-react";

export default function TelegramPage() {
  const { t } = useI18n();

  return (
    <MainLayout>
      <PageHeader
        title={t("telegram.title")}
        subtitle={t("telegram.subtitle")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("telegram.setup")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label={t("telegram.botToken")}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                icon={<Bot className="h-4 w-4" />}
              />
              <Input
                label={t("telegram.chatId")}
                placeholder="-1001234567890"
                icon={<Send className="h-4 w-4" />}
              />
              <div className="flex items-center justify-between rounded-xl bg-background/50 p-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-text">{t("telegram.notifications")}</p>
                    <p className="text-xs text-muted">Anlık bildirimleri etkinleştir</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="h-6 w-11 rounded-full bg-border after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-muted after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </label>
              </div>
              <Button>{t("telegram.testConnection")}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("telegram.commands")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { command: "/start", description: "Botu başlat" },
                { command: "/help", description: "Yardım al" },
                { command: "/portfolio", description: "Portföy görüntüle" },
                { command: "/watchlist", description: "İzleme listesi" },
                { command: "/alerts", description: "Fiyat alarmları" },
                { command: "/analysis", description: "AI analiz iste" },
              ].map((cmd) => (
                <div
                  key={cmd.command}
                  className="flex items-center justify-between rounded-xl bg-background/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="primary">{cmd.command}</Badge>
                    <span className="text-sm text-muted">{cmd.description}</span>
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
