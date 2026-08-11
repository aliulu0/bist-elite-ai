"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores";
import { useI18n } from "@/providers/i18n-provider";
import {
  Home,
  Search,
  Star,
  BarChart3,
  TrendingUp,
  Activity,
  Briefcase,
  Newspaper,
  Send,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Bell,
  Zap,
  BookmarkCheck,
  LayoutDashboard,
  Globe,
  LineChart,
  AlertTriangle,
  Eye,
  Container,
  Gauge,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { t } = useI18n();

  const navItems: NavItem[] = [
    { label: t("nav.dashboard"), href: "/", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: t("nav.ranking"), href: "/ranking", icon: <Star className="h-5 w-5" /> },
    { label: t("nav.scanner"), href: "/scanner", icon: <Search className="h-5 w-5" /> },
    { label: t("nav.portfolio"), href: "/portfolio", icon: <Briefcase className="h-5 w-5" /> },
    { label: t("nav.opportunities"), href: "/opportunities", icon: <Zap className="h-5 w-5" /> },
    { label: t("nav.alerts"), href: "/alerts", icon: <Bell className="h-5 w-5" /> },
    { label: t("nav.watchlists"), href: "/watchlists", icon: <BookmarkCheck className="h-5 w-5" /> },
    { label: t("nav.eliteScore"), href: "/elite-score", icon: <TrendingUp className="h-5 w-5" /> },
    { label: t("nav.technicalAnalysis"), href: "/technical-analysis", icon: <BarChart3 className="h-5 w-5" /> },
    { label: t("nav.fundamentalAnalysis"), href: "/fundamental-analysis", icon: <Activity className="h-5 w-5" /> },
    { label: t("nav.backtest"), href: "/backtest", icon: <TrendingUp className="h-5 w-5" /> },
    { label: t("nav.news"), href: "/news", icon: <Newspaper className="h-5 w-5" /> },
    { label: t("nav.telegram"), href: "/telegram", icon: <Send className="h-5 w-5" /> },
    { label: t("nav.macroIntelligence"), href: "/macro-intelligence", icon: <Globe className="h-5 w-5" /> },
    { label: t("nav.macroOpportunities"), href: "/macro-opportunities", icon: <LineChart className="h-5 w-5" /> },
    { label: t("nav.macroRisk"), href: "/macro-risk", icon: <AlertTriangle className="h-5 w-5" /> },
    { label: t("nav.marketRegime"), href: "/market-regime", icon: <Activity className="h-5 w-5" /> },
    { label: t("nav.centralBankAnalysis"), href: "/central-bank-analysis", icon: <BarChart3 className="h-5 w-5" /> },
    { label: t("nav.globalIndicators"), href: "/global-indicators", icon: <Globe className="h-5 w-5" /> },
    { label: t("nav.pipelineStatus"), href: "/pipeline-status", icon: <Container className="h-5 w-5" /> },
    { label: t("nav.productionObservability"), href: "/production-observability", icon: <Gauge className="h-5 w-5" /> },
    { label: t("nav.aiAssistant"), href: "/ai-assistant", icon: <Bot className="h-5 w-5" /> },
    { label: t("nav.settings"), href: "/settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
        sidebarOpen ? "w-64" : "w-[72px]"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {sidebarOpen && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-text">BIST Elite AI</h1>
              <p className="text-[10px] text-muted">v1.0.0</p>
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TrendingDown className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:bg-border/50 hover:text-text",
                    !sidebarOpen && "justify-center"
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  {item.icon}
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-xl p-2 text-muted transition-all duration-200 hover:bg-border/50 hover:text-text"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
