"use client";

import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components";
import { OpportunityList } from "@/components/opportunities";

export default function OpportunitiesPage() {
  return (
    <MainLayout>
      <PageHeader
        title="Opportunities"
        subtitle="All detected investment opportunities with AI analysis"
      />
      <OpportunityList />
    </MainLayout>
  );
}
