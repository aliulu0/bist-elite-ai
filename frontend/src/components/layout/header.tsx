"use client";

import React from "react";
import { useAppStore } from "@/stores";
import { useI18n } from "@/providers/i18n-provider";
import { Bell, Search, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { locales, type Locale } from "@/locales";

export function Header() {
  const { sidebarOpen } = useAppStore();
  const { locale, setLocale, t } = useI18n();

  const toggleLocale = () => {
    const nextLocale = locale === "tr" ? "en" : "tr";
    setLocale(nextLocale);
  };

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-xl transition-all duration-300",
        sidebarOpen ? "left-64" : "left-[72px]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder={t("common.search") + "..."}
            className="input w-80 pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleLocale}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition-all duration-200 hover:bg-border/50 hover:text-text"
          title={locale === "tr" ? "English" : "Türkçe"}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{locale.toUpperCase()}</span>
        </button>

        <button className="relative rounded-xl p-2 text-muted transition-all duration-200 hover:bg-border/50 hover:text-text">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>
      </div>
    </header>
  );
}
