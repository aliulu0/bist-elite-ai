"use client";

import Link from "next/link";
import { useScannerResults } from "@/hooks";
import { Badge } from "@/components/ui/badge";
import { formatPercent, formatVolume } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScannerResultsListProps {
  filters?: Record<string, string>;
}

export function ScannerResultsList({ filters }: ScannerResultsListProps) {
  const { data, isLoading } = useScannerResults(filters);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        <p>No results match your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((result) => (
        <Link
          key={result.id}
          href={`/stocks/${result.symbol}`}
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30"
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text">
                  {result.symbol}
                </span>
                <span className="text-xs text-muted">{result.name}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted">{result.sector}</span>
                <span className="text-xs text-muted">
                  • {formatVolume(result.volume)}
                </span>
                <Badge variant="primary">{result.marketCap}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-text">
                {result.price.toFixed(2)}
              </p>
              <div className="flex items-center justify-end gap-1">
                {result.changePercent > 0 ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : result.changePercent < 0 ? (
                  <TrendingDown className="h-3 w-3 text-danger" />
                ) : (
                  <Minus className="h-3 w-3 text-muted" />
                )}
                <span
                  className={`text-xs font-medium ${
                    result.changePercent >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {formatPercent(result.changePercent)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={
                  result.risk <= 30
                    ? "success"
                    : result.risk <= 60
                      ? "warning"
                      : "danger"
                }
              >
                Risk: {result.risk}
              </Badge>
              {result.opportunity && (
                <Badge variant="primary">{result.opportunity}</Badge>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
