'use client';

import { MarketSummaryCard } from './market-summary-card';
import { SignalsCard } from './signals-card';
import { OpportunitiesCard } from './opportunities-card';
import { TopRankedCard } from './top-ranked-card';
import { MarketRegimeCard } from './market-regime-card';
import { PortfolioSummaryCard } from './portfolio-summary-card';
import { RiskIndicatorCard } from './risk-indicator-card';
import { NotificationsCard } from './notifications-card';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <span className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('tr-TR')}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MarketSummaryCard />
        <SignalsCard />
        <OpportunitiesCard />
        <RiskIndicatorCard />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TopRankedCard />
        <MarketRegimeCard />
        <PortfolioSummaryCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <NotificationsCard />
      </div>
    </div>
  );
}
