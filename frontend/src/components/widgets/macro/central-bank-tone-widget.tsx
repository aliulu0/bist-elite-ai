"use client";

import type { CentralBankAnalysis } from "@/types/dashboard";

const toneColors: Record<string, string> = {
  hawkish: "text-danger",
  dovish: "text-success",
  neutral: "text-yellow-400",
  hawkish_leaning: "text-warning",
  dovish_leaning: "text-info",
};

export function CentralBankToneWidget({
  tcmb, fed, ecb, isLoading,
}: {
  tcmb?: CentralBankAnalysis;
  fed?: CentralBankAnalysis;
  ecb?: CentralBankAnalysis;
  isLoading: boolean;
}) {
  const banks = [
    { name: "TCMB", data: tcmb },
    { name: "FED", data: fed },
    { name: "ECB", data: ecb },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-xs font-medium text-muted">Central Bank Tone</h3>
      <div className="mt-2 space-y-2">
        {banks.map(({ name, data }) => (
          <div key={name} className="flex items-center justify-between">
            <span className="text-xs font-medium text-text">{name}</span>
            {isLoading ? (
              <div className="h-4 w-16 animate-pulse rounded bg-surface" />
            ) : (
              <span className={`text-xs font-bold ${toneColors[data?.tone || "neutral"]}`}>
                {data ? data.tone.replace("_", " ") : "unknown"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
