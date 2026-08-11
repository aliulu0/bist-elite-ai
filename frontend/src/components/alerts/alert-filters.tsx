"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search } from "lucide-react";

interface AlertFiltersProps {
  statusFilter: string;
  onStatusChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function AlertFilters({
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  searchQuery,
  onSearchChange,
}: AlertFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search alerts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select
        label=""
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        options={[
          { value: "", label: "All Status" },
          { value: "ACTIVE", label: "Active" },
          { value: "ACKNOWLEDGED", label: "Acknowledged" },
          { value: "DISMISSED", label: "Dismissed" },
        ]}
      />
      <Select
        label=""
        value={priorityFilter}
        onChange={(e) => onPriorityChange(e.target.value)}
        options={[
          { value: "", label: "All Priority" },
          { value: "CRITICAL", label: "Critical" },
          { value: "HIGH", label: "High" },
          { value: "MEDIUM", label: "Medium" },
          { value: "LOW", label: "Low" },
        ]}
      />
    </div>
  );
}
