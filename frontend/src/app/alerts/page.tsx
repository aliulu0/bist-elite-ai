"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components";
import { AlertFilters } from "@/components/alerts/alert-filters";
import { AlertList } from "@/components/alerts/alert-list";

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <MainLayout>
      <PageHeader
        title="Alerts"
        subtitle="Monitor and manage all trading alerts"
      />
      <div className="mb-6">
        <AlertFilters
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
      <AlertList
        statusFilter={statusFilter || undefined}
        priorityFilter={priorityFilter || undefined}
        searchQuery={searchQuery || undefined}
      />
    </MainLayout>
  );
}
