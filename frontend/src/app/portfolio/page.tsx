"use client";

import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components";
import { PortfolioSummaryWidget } from "@/components/widgets/portfolio-summary-widget";
import { PortfolioView } from "@/components/portfolio/portfolio-view";

export default function PortfolioPage() {
  return (
    <MainLayout>
      <PageHeader
        title="Portfolio"
        subtitle="Manage and monitor your investment portfolio"
      />
      <div className="mb-6">
        <PortfolioSummaryWidget />
      </div>
      <PortfolioView />
    </MainLayout>
  );
}
