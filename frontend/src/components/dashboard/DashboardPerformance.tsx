"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDashboardPerformance } from "@/hooks/use-dashboard";
import type { DashboardPerformanceData } from "@/types/dashboard";

export function DashboardPerformance() {
  const { data, isLoading, error } = useDashboardPerformance();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-48 animate-pulse bg-muted/50 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          Failed to load performance data
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dashboard Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            label="AI Accuracy"
            value={`${data.aiAccuracy.toFixed(1)}%`}
            description="Prediction accuracy rate"
            icon="🤖"
            color="blue"
          />
          <MetricCard
            label="Prediction Success"
            value={`${data.predictionSuccess.toFixed(1)}%`}
            description="Successful predictions"
            icon="✅"
            color="green"
          />
          <MetricCard
            label="Avg Exp. Return"
            value={`${data.avgExpectedReturn.toFixed(2)}%`}
            description="Average expected return"
            icon="📊"
            color="purple"
          />
          <MetricCard
            label="Avg Win Rate"
            value={`${data.avgWinRate.toFixed(1)}%`}
            description="Historical win rate"
            icon="🏆"
            color="orange"
          />
          <MetricCard
            label="Learning Progress"
            value={`${Math.round((data.learningProgress.updated / Math.max(data.learningProgress.scanned, 1)) * 100)}%`}
            description={`${data.learningProgress.updated}/${data.learningProgress.scanned} updated`}
            icon="🧠"
            color="indigo"
          />
        </div>

        {/* Learning Progress */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Self-Learning Progress</span>
              <span className="font-medium">
                {data.learningProgress.updated}/{data.learningProgress.scanned} tickers calibrated
              </span>
            </div>
            <Progress
              value={Math.round((data.learningProgress.updated / Math.max(data.learningProgress.scanned, 1)) * 100)}
              className="h-2"
            />
          </div>

          {/* Accuracy Trend */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Accuracy Trend (Last 30 Days)</h4>
            <div className="h-32 bg-muted/30 rounded flex items-end justify-around p-2">
              {/* Simple bar chart placeholder */}
              {[72, 74, 71, 75, 73, 76, 74, 77, 75, 78, 76, 79, 77, 80, 78, 81, 79, 82, 80, 83, 81, 82, 80, 81, 79, 80, 78, 81, 79, 82].map((val, i) => (
                <div
                  key={i}
                  className="w-2 bg-primary/60 rounded-t transition-all hover:bg-primary"
                  style={{ height: `${(val - 65) * 4}px` }}
                  title={`${val}%`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
  color,
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{description}</div>
    </div>
  );
}