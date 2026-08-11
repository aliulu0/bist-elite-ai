"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAlerts, useAcknowledgeAlert, useDismissAlert } from "@/hooks";
import { AlertTriangle, AlertCircle, Info, AlertOctagon, Check, X } from "lucide-react";

const priorityIcons = {
  CRITICAL: <AlertOctagon className="h-5 w-5 text-danger" />,
  HIGH: <AlertTriangle className="h-5 w-5 text-warning" />,
  MEDIUM: <AlertCircle className="h-5 w-5 text-primary" />,
  LOW: <Info className="h-5 w-5 text-muted" />,
};

interface AlertListProps {
  statusFilter?: string;
  priorityFilter?: string;
  watchlistFilter?: string;
  searchQuery?: string;
}

export function AlertList({
  statusFilter,
  priorityFilter,
  watchlistFilter,
  searchQuery,
}: AlertListProps) {
  const { data, isLoading } = useAlerts(statusFilter, priorityFilter, watchlistFilter, searchQuery);
  const acknowledge = useAcknowledgeAlert();
  const dismiss = useDismissAlert();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted">
        <AlertCircle className="mb-3 h-12 w-12" />
        <p>No alerts found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4"
        >
          <div className="mt-1">{priorityIcons[alert.priority]}</div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-text">{alert.symbol}</span>
              <Badge
                variant={
                  alert.priority === "CRITICAL"
                    ? "danger"
                    : alert.priority === "HIGH"
                      ? "warning"
                      : "default"
                }
              >
                {alert.priority}
              </Badge>
              <Badge variant="primary">{alert.type}</Badge>
            </div>
            <p className="text-sm text-muted">{alert.message}</p>
            <p className="mt-1 text-xs text-muted">
              {new Date(alert.createdAt).toLocaleString()}
              {alert.watchlist && ` • ${alert.watchlist}`}
            </p>
          </div>
          {alert.status === "ACTIVE" && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => acknowledge.mutate(alert.id)}
                disabled={acknowledge.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismiss.mutate(alert.id)}
                disabled={dismiss.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
