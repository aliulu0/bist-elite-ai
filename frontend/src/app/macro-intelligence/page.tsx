"use client";

import { PageHeader } from "@/components";
import { MacroScoreWidget } from "@/components/widgets/macro/macro-score-widget";
import { MarketRegimeWidget } from "@/components/widgets/macro/market-regime-widget";
import { CentralBankToneWidget } from "@/components/widgets/macro/central-bank-tone-widget";
import { RiskAppetiteWidget } from "@/components/widgets/macro/risk-appetite-widget";
import { GlobalMarketsWidget } from "@/components/widgets/macro/global-markets-widget";
import { SectorImpactWidget } from "@/components/widgets/macro/sector-impact-widget";
import { useMacroFullAnalysis } from "@/hooks";

export default function MacroIntelligencePage() {
  const { data, isLoading } = useMacroFullAnalysis();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Macro Intelligence"
        description="Macroeconomic analysis, central bank decisions, and global risk indicators"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MacroScoreWidget score={data?.score} isLoading={isLoading} />
        <MarketRegimeWidget regime={data?.regime} isLoading={isLoading} />
        <CentralBankToneWidget tcmb={data?.tcmb} fed={data?.fed} ecb={data?.ecb} isLoading={isLoading} />
        <RiskAppetiteWidget regime={data?.regime} isLoading={isLoading} />
        <GlobalMarketsWidget data={data?.data} isLoading={isLoading} />
        <SectorImpactWidget sectors={data?.sectors} isLoading={isLoading} />
      </div>
    </div>
  );
}
