"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components";
import { ScannerFilters } from "@/components/scanner/scanner-filters";
import { ScannerResultsList } from "@/components/scanner/scanner-results-list";

export default function ScannerPage() {
  const [category, setCategory] = useState("");
  const [risk, setRisk] = useState("");
  const [sector, setSector] = useState("");
  const [opportunity, setOpportunity] = useState("");
  const [watchlist, setWatchlist] = useState("");

  const filters: Record<string, string> = {};
  if (category) filters.category = category;
  if (risk) filters.risk = risk;
  if (sector) filters.sector = sector;
  if (opportunity) filters.opportunity = opportunity;
  if (watchlist) filters.watchlist = watchlist;

  return (
    <MainLayout>
      <PageHeader
        title="Stock Scanner"
        subtitle="Scan and filter Borsa Istanbul stocks across multiple dimensions"
      />
      <div className="mb-6">
        <ScannerFilters
          category={category}
          onCategoryChange={setCategory}
          risk={risk}
          onRiskChange={setRisk}
          sector={sector}
          onSectorChange={setSector}
          opportunity={opportunity}
          onOpportunityChange={setOpportunity}
          watchlist={watchlist}
          onWatchlistChange={setWatchlist}
        />
      </div>
      <ScannerResultsList filters={filters} />
    </MainLayout>
  );
}
