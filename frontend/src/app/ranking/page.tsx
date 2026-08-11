"use client";

import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components";
import { RankingTable } from "@/components/ranking";

export default function RankingPage() {
  return (
    <MainLayout>
      <PageHeader
        title="Stock Ranking"
        subtitle="Comprehensive ranking of Borsa Istanbul stocks with AI-powered scoring"
      />
      <RankingTable />
    </MainLayout>
  );
}
