"use client";

import { useParams } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { StockDetailContent } from "@/components/stock-detail";

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  return (
    <MainLayout>
      <StockDetailContent symbol={symbol} />
    </MainLayout>
  );
}
