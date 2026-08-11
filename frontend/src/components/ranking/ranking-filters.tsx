"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface RankingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function RankingFilters({ search, onSearchChange }: RankingFiltersProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input
        placeholder="Search ticker or company..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
