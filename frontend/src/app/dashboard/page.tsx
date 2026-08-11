"use client";

import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components";
import { AIFilterPanel } from "./AIFilterPanel";
import { TopEarlyOpportunities } from "./TopEarlyOpportunities";
import { MarketOverview } from "./MarketOverview";
import { Watchlist } from "./Watchlist";
import { QuickSearch } from "./QuickSearch";
import { TimeframePanel } from "./TimeframePanel";
import { TopLists } from "./TopLists";
import { DashboardPerformance } from "./DashboardPerformance";
import { useEarlyOpportunities } from "@/hooks/use-dashboard";
import type { EarlyOpportunityFilters, EarlyOpportunityIntelligenceResult } from "@/types/dashboard";
import { useState } from "react";

export default function EliteDashboardPage() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [filters, setFilters] = useState<EarlyOpportunityFilters>({});

  const { data: earlyOppsData } = useEarlyOpportunities(filters, 10);

  const handleTickerSelect = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  return (
    <MainLayout>
      <PageHeader
        title="Elite Dashboard"
        subtitle="BIST ELITE AI — Professional Multi-Timeframe Intelligence"
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
        </div>
      </div>
    </MainLayout>
  );
}