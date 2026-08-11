"use client";

import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components";
import { PortfolioSummaryWidget } from "@/components/widgets/portfolio-summary-widget";
import { TopRankedWidget } from "@/components/widgets/top-ranked-widget";
import { LatestOpportunitiesWidget } from "@/components/widgets/latest-opportunities-widget";
import { ActiveAlertsWidget } from "@/components/widgets/active-alerts-widget";
import { WatchlistsWidget } from "@/components/widgets/watchlists-widget";
import { MarketStatusWidget } from "@/components/widgets/market-status-widget";
import { AIRecommendationsWidget } from "@/components/widgets/ai-recommendations-widget";
import { PerformanceOverviewWidget } from "@/components/widgets/performance-overview-widget";
import { MacroScoreWidget } from "@/components/widgets/macro/macro-score-widget";
import { MarketRegimeWidget } from "@/components/widgets/macro/market-regime-widget";
import { RiskAppetiteWidget } from "@/components/widgets/macro/risk-appetite-widget";
import { useMacroFullAnalysis } from "@/hooks";
import { TopEarlyOpportunities } from "@/components/dashboard";
import { MarketOverview } from "@/components/dashboard";
import { AIFilterPanel } from "@/components/dashboard";
import { Watchlist } from "@/components/dashboard";
import { QuickSearch } from "@/components/dashboard";
import { TimeframePanel } from "@/components/dashboard";
import { TopLists } from "@/components/dashboard";
import { DashboardPerformance } from "@/components/dashboard";
import { useEarlyOpportunities } from "@/hooks/use-dashboard";
import type { EarlyOpportunityFilters, EarlyOpportunityIntelligenceResult } from "@/types/dashboard";
import { useState } from "react";

export default function HomePage() {
  const { data: macro, isLoading: macroLoading } = useMacroFullAnalysis();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [filters, setFilters] = useState<EarlyOpportunityFilters>({});

  const { data: earlyOppsData } = useEarlyOpportunities(filters, 10);

  const handleTickerSelect = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  return (
    <MainLayout>
      <PageHeader
        title="BIST Elite AI"
        subtitle="Professional Multi-Timeframe Intelligence Platform"
      />

      {/* Quick Search Bar - Fixed at top */}
      <div className="mb-6 sticky top-4 z-10 bg-background/80 backdrop-blur-sm pb-4 border-b">
        <QuickSearch onTickerSelect={handleTickerSelect} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar - Filters & Watchlist */}
        <div className="lg:col-span-3 space-y-6">
          <AIFilterPanel onFiltersChange={setFilters} />
          <Watchlist />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Market Overview - Full width */}
          <MarketOverview />

          {/* Top 10 Early Opportunities - Full width */}
          <div className="lg:col-span-12">
            <TopEarlyOpportunities
              filters={filters}
              limit={10}
              onTickerSelect={handleTickerSelect}
            />
          </div>

          {/* Timeframe Panel & Top Lists - Side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedTicker && (
              <TimeframePanel ticker={selectedTicker} />
            )}
            <TopLists />
          </div>

          {/* Dashboard Performance - Full width */}
          <DashboardPerformance />

          {/* Legacy widgets - kept for compatibility */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <PortfolioSummaryWidget />
            </div>
            <MarketStatusWidget />
            <AIRecommendationsWidget />
          </div>

          <div className="mb-8">
            <PerformanceOverviewWidget />
          </div>

          <div className="mb-8">
            <h2 className="mb-4 text-sm font-semibold text-text">Macro Intelligence Overview</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MacroScoreWidget score={macro?.score} isLoading={macroLoading} />
              <MarketRegimeWidget regime={macro?.regime} isLoading={macroLoading} />
              <RiskAppetiteWidget regime={macro?.regime} isLoading={macroLoading} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <TopRankedWidget />
            <LatestOpportunitiesWidget />
            <ActiveAlertsWidget />
            <WatchlistsWidget />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}