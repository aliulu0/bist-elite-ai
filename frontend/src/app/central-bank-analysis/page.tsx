"use client";

import { PageHeader } from "@/components";
import { useCentralBankAnalysis } from "@/hooks";

const toneColors: Record<string, string> = {
  hawkish: "text-danger",
  dovish: "text-success",
  neutral: "text-yellow-400",
  hawkish_leaning: "text-warning",
  dovish_leaning: "text-info",
};

const impactColors: Record<string, string> = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-muted",
};

function BankAnalysisCard({ bank, isLoading }: { bank: string; isLoading: boolean }) {
  const { data } = useCentralBankAnalysis(bank);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-text uppercase">{bank}</h3>
      {isLoading ? (
        <div className="mt-4 h-20 animate-pulse rounded-lg bg-surface" />
      ) : data ? (
        <div className="mt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-xs text-muted">Tone</span>
            <span className={`text-sm font-bold ${toneColors[data.tone] || "text-text"}`}>
              {data.tone.replace("_", " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-muted">Confidence</span>
            <span className="text-sm text-text">{(data.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-muted">Market Impact</span>
            <span className={`text-sm font-medium ${impactColors[data.marketImpact] || "text-text"}`}>
              {data.marketImpact}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-muted">Liquidity</span>
            <span className="text-sm capitalize text-text">{data.liquidity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-muted">Risk</span>
            <span className="text-sm capitalize text-text">{data.risk}</span>
          </div>
          {data.expectedInflation != null && (
            <div className="flex justify-between">
              <span className="text-xs text-muted">Expected Inflation</span>
              <span className="text-sm text-text">{data.expectedInflation}%</span>
            </div>
          )}
          <p className="mt-2 text-xs text-muted">{data.summary}</p>

          <div className="mt-3">
            <p className="text-xs font-medium text-muted mb-2">Sector Impacts</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.sectorImpacts).map(([sector, impact]) => (
                <span key={sector} className={`rounded-full px-2 py-0.5 text-xs ${impactColors[impact]} bg-surface`}>
                  {sector}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted">No data available</p>
      )}
    </div>
  );
}

export default function CentralBankAnalysisPage() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Central Bank Analysis"
        description="NLP-based analysis of TCMB, FED, and ECB decision texts"
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <BankAnalysisCard bank="tcmb" isLoading={false} />
        <BankAnalysisCard bank="fed" isLoading={false} />
        <BankAnalysisCard bank="ecb" isLoading={false} />
      </div>
    </div>
  );
}
