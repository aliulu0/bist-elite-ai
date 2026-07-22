"use client";

import { MainLayout } from "@/components/layout";
import { useI18n } from "@/providers/i18n-provider";
import { useSettingsStore } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Select, Button, Badge } from "@/components";
import {
  Globe,
  Palette,
  Bell,
  Send,
  Database,
  Monitor,
  Sun,
  Moon,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useSettingsStore();

  return (
    <MainLayout>
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.description")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          {[
            { id: "language", label: t("settings.language"), icon: <Globe className="h-5 w-5" /> },
            { id: "theme", label: t("settings.theme"), icon: <Palette className="h-5 w-5" /> },
            { id: "notifications", label: t("settings.notifications"), icon: <Bell className="h-5 w-5" /> },
            { id: "telegram", label: t("settings.telegram"), icon: <Send className="h-5 w-5" /> },
            { id: "database", label: t("settings.database"), icon: <Database className="h-5 w-5" /> },
            { id: "appearance", label: t("settings.appearance"), icon: <Monitor className="h-5 w-5" /> },
          ].map((item) => (
            <button
              key={item.id}
              className="flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left text-muted transition-all hover:bg-border/50 hover:text-text"
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.language")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "tr", label: t("settings.turkish"), flag: "🇹🇷" },
                  { value: "en", label: t("settings.english"), flag: "🇺🇸" },
                ].map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setLocale(lang.value as "tr" | "en")}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 transition-all",
                      locale === lang.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background/50 text-muted hover:border-primary/30"
                    )}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                    {locale === lang.value && (
                      <Check className="ml-auto h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.theme")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "dark" as const, label: t("settings.darkMode"), icon: <Moon className="h-5 w-5" /> },
                  { value: "light" as const, label: t("settings.lightMode"), icon: <Sun className="h-5 w-5" /> },
                  { value: "system" as const, label: t("settings.systemMode"), icon: <Monitor className="h-5 w-5" /> },
                ].map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => setTheme(themeOption.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                      theme === themeOption.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background/50 text-muted hover:border-primary/30"
                    )}
                  >
                    {themeOption.icon}
                    <span className="text-sm font-medium">{themeOption.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notifications")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Fiyat Alarmları", description: "Belirlediğiniz fiyat seviyelerinde bildirim alın" },
                  { label: "Analiz Bildirimleri", description: "Yeni analiz sonuçları hakkında bilgilendirilin" },
                  { label: "Haber Bildirimleri", description: "Önemli KAP haberlerinden haberdar olun" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-background/50 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-text">{item.label}</p>
                      <p className="text-xs text-muted">{item.description}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" className="peer sr-only" defaultChecked={i < 2} />
                      <div className="h-6 w-11 rounded-full bg-border after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-muted after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
