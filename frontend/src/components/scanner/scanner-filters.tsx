"use client";

import { Select } from "@/components/ui/select";
import { useScannerFilterOptions } from "@/hooks";

interface ScannerFiltersProps {
  category: string;
  onCategoryChange: (v: string) => void;
  risk: string;
  onRiskChange: (v: string) => void;
  sector: string;
  onSectorChange: (v: string) => void;
  opportunity: string;
  onOpportunityChange: (v: string) => void;
  watchlist: string;
  onWatchlistChange: (v: string) => void;
}

export function ScannerFilters({
  category, onCategoryChange,
  risk, onRiskChange,
  sector, onSectorChange,
  opportunity, onOpportunityChange,
  watchlist, onWatchlistChange,
}: ScannerFiltersProps) {
  const { data: options } = useScannerFilterOptions();

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        label=""
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        options={[
          { value: "", label: "All Categories" },
          ...(options?.categories || []).map((c) => ({ value: c, label: c })),
        ]}
      />
      <Select
        label=""
        value={risk}
        onChange={(e) => onRiskChange(e.target.value)}
        options={[
          { value: "", label: "All Risk" },
          { value: "LOW", label: "Low" },
          { value: "MEDIUM", label: "Medium" },
          { value: "HIGH", label: "High" },
        ]}
      />
      <Select
        label=""
        value={sector}
        onChange={(e) => onSectorChange(e.target.value)}
        options={[
          { value: "", label: "All Sectors" },
          ...(options?.sectors || []).map((s) => ({ value: s, label: s })),
        ]}
      />
      <Select
        label=""
        value={opportunity}
        onChange={(e) => onOpportunityChange(e.target.value)}
        options={[
          { value: "", label: "All Opportunities" },
          ...(options?.opportunityTypes || []).map((o) => ({ value: o, label: o })),
        ]}
      />
      <Select
        label=""
        value={watchlist}
        onChange={(e) => onWatchlistChange(e.target.value)}
        options={[
          { value: "", label: "All Watchlists" },
          ...(options?.watchlists || []).map((w) => ({ value: w, label: w })),
        ]}
      />
    </div>
  );
}
