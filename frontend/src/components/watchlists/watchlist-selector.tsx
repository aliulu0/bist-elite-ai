"use client";

import { Select } from "@/components/ui/select";
import { useWatchlists } from "@/hooks";

interface WatchlistSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function WatchlistSelector({ value, onChange }: WatchlistSelectorProps) {
  const { data } = useWatchlists();

  return (
    <Select
      label=""
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={[
        { value: "", label: "All Watchlists" },
        ...(data || []).map((wl) => ({
          value: wl.id,
          label: wl.name,
        })),
      ]}
    />
  );
}
