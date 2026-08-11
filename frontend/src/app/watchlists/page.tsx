"use client";

import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components";
import { WatchlistManager } from "@/components/watchlists";

export default function WatchlistsPage() {
  return (
    <MainLayout>
      <PageHeader
        title="Watchlists"
        subtitle="Create and manage your stock watchlists"
      />
      <WatchlistManager />
    </MainLayout>
  );
}
