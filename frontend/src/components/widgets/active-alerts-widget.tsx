"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAlerts } from "@/hooks";
import { AlertTriangle, AlertCircle, Info, AlertOctagon } from "lucide-react";

const priorityIcons = {
  CRITICAL: <AlertOctagon className="h-4 w-4 text-danger" />,
  HIGH: <AlertTriangle className="h-4 w-4 text-warning" />,
  MEDIUM: <AlertCircle className="h-4 w-4 text-primary" />,
  LOW: <Info className="h-4 w-4 text-muted" />,
};

export function ActiveAlertsWidget() {
  const { data, isLoading } = useAlerts("ACTIVE");

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-border/50"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const active = data.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {active.map((alert) => (
            <Link
              key={alert.id}
              href="/alerts"
              className="flex items-center gap-3 rounded-xl bg-background/50 p-3 transition-all hover:bg-border/50"
            >
              {priorityIcons[alert.priority]}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">
                  {alert.symbol}
                </p>
                <p className="truncate text-xs text-muted">{alert.message}</p>
              </div>
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
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
