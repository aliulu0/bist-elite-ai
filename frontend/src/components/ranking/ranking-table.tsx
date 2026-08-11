"use client";

import { useState } from "react";
import Link from "next/link";
import { useRanking } from "@/hooks";
import { Input } from "@/components/ui/input";
import { formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";

type SortField = "rank" | "score" | "confidence" | "changePercent" | "risk";

export function RankingTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data, isLoading } = useRanking(page, 50, sortBy, sortOrder, search);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 text-muted" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary" />
    );
  };

  const recColors: Record<string, "success" | "warning" | "danger" | "primary" | "default"> = {
    STRONG_BUY: "success", BUY: "success", HOLD: "warning",
    SELL: "danger", STRONG_SELL: "danger",
  };
  const gradeColors: Record<string, string> = {
    AAA: "text-success", AA: "text-success", A: "text-success",
    BBB: "text-warning", BB: "text-warning", B: "text-warning",
    CCC: "text-danger", CC: "text-danger", C: "text-danger", D: "text-danger",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search ticker or company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted">
          {data?.total ?? 0} stocks
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card">
              {[
                { key: "rank" as SortField, label: "#" },
                { key: null, label: "Ticker" },
                { key: null, label: "Company" },
                { key: "score" as SortField, label: "Score" },
                { key: "confidence" as SortField, label: "Conf." },
                { key: null, label: "Grade" },
                { key: null, label: "Rec." },
                { key: "risk" as SortField, label: "Risk" },
                { key: null, label: "Trend" },
                { key: null, label: "Sector" },
                { key: "changePercent" as SortField, label: "Change" },
              ].map((col) => (
                <th
                  key={col.label}
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted ${
                    col.key ? "cursor-pointer hover:text-text" : ""
                  }`}
                  onClick={() => col.key && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.key && <SortIcon field={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-muted">
                  Loading...
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-muted">
                  No stocks found
                </td>
              </tr>
            ) : (
              data?.items.map((stock) => (
                <tr
                  key={stock.symbol}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-border/20"
                >
                  <td className="px-4 py-3 text-sm font-medium text-text">
                    {stock.rank}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/stocks/${stock.symbol}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {stock.symbol}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{stock.name}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-text">
                    {stock.score.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {stock.confidence.toFixed(0)}%
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-bold ${
                        gradeColors[stock.investmentGrade] || "text-muted"
                      }`}
                    >
                      {stock.investmentGrade}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={recColors[stock.recommendation] || "default"}
                    >
                      {stock.recommendation}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {stock.risk.toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{stock.trend}</td>
                  <td className="px-4 py-3 text-sm text-muted">{stock.sector}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-medium ${
                        stock.changePercent >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {formatPercent(stock.changePercent)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 50 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">
            Showing {(page - 1) * 50 + 1} - {Math.min(page * 50, data.total)} of{" "}
            {data.total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 50 >= data.total}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
