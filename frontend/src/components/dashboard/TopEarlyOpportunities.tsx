"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEarlyOpportunities } from "@/hooks/use-dashboard";
import type { EarlyOpportunityIntelligenceResult, EarlyOpportunityFilters } from "@/types/dashboard";
import { EARLY_OPPORTUNITY_LEVEL_META } from "@/types/early-opportunity";

interface TopEarlyOpportunitiesProps {
  filters?: EarlyOpportunityFilters;
  limit?: number;
  onTickerSelect?: (ticker: string) => void;
}

export function TopEarlyOpportunities({ filters, limit = 10, onTickerSelect }: TopEarlyOpportunitiesProps) {
  const { data, isLoading, error } = useEarlyOpportunities(filters, limit);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse bg-muted/50 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          Failed to load early opportunities
        </CardContent>
      </Card>
    );
  }

  const results = data?.results || [];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10">
          {results.slice(0, limit).map((item, index) => (
            <EarlyOpportunityCard key={item.ticker} item={item} rank={index + 1} onTickerSelect={onTickerSelect} />
          ))}
          {results.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No early opportunities found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EarlyOpportunityCard({ item, rank, onTickerSelect }: { item: EarlyOpportunityIntelligenceResult; rank: number; onTickerSelect?: (ticker: string) => void }) {
  const levelMeta = EARLY_OPPORTUNITY_LEVEL_META[item.earlyOpportunityLevel];
  const riskColor = item.risk === "low" ? "bg-green-500/20 text-green-400" : 
                   item.risk === "medium" ? "bg-yellow-500/20 text-yellow-400" : 
                   "bg-red-500/20 text-red-400";

  const handleClick = () => {
    if (onTickerSelect) {
      onTickerSelect(item.ticker);
    }
  };

  return (
    <Card 
      className="h-full flex flex-col hover:border-primary/50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">#{rank}</span>
            <div>
              <h3 className="font-semibold text-sm">{item.ticker}</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[150px]">{item.company}</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-xs ${levelMeta.emoji}`}>
            {levelMeta.emoji} {item.earlyOpportunityScore}
          </Badge>
        </div>

        {/* Sector */}
        <p className="text-xs text-muted-foreground mb-3">{item.sector}</p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <Metric value={item.eliteScore} label="Elite Score" />
          <Metric value={`${item.bullishPercent}%`} label="Bullish %" />
          <Metric value={`${item.confidence}%`} label="Confidence" />
          <Metric value={`${item.expectedReturn.toFixed(1)}%`} label="Exp. Return" />
          <Metric value={item.risk} label="Risk" className={riskColor} />
          <Metric value={item.holdingPeriod ? `${item.holdingPeriod.value} ${item.holdingPeriod.unit}` : "-"} label="Holding" />
        </div>

        {/* Multi-Timeframe Info */}
        {item.multiTimeframe && (
          <div className="mb-3 p-2 bg-muted/30 rounded text-xs">
            <div className="flex justify-between text-muted-foreground mb-1">
              <span>MTF Score: <span className="text-foreground font-medium">{item.multiTimeframe.multiTimeframeScore}</span></span>
              <span>Strength: <span className="text-foreground font-medium">{item.multiTimeframe.strength}</span></span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Best TF: <span className="text-foreground font-medium">{item.multiTimeframe.bestTimeframe}</span></span>
              <span>Trend: <span className="text-foreground font-medium">{item.multiTimeframe.trendStage}</span></span>
            </div>
          </div>
        )}

        {/* Smart Money & Catalyst */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="p-2 bg-muted/30 rounded">
            <div className="text-muted-foreground">Smart Money</div>
            <div className="font-medium">{item.smartMoney?.score ?? "-"} ({item.smartMoney?.accumulation ?? "-"})</div>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <div className="text-muted-foreground">Catalyst</div>
            <div className="font-medium">{item.catalyst?.score ?? "-"} {item.catalyst?.verified ? "✓" : "✗"}</div>
          </div>
        </div>

        {/* Entry/Stop/Targets */}
        <div className="grid grid-cols-3 gap-1 mb-3 text-xs">
          <div className="p-1.5 bg-green-500/10 rounded text-green-400 text-center">
            Entry<br />
            <span className="font-mono">{item.entryZone ? `${item.entryZone.min.toFixed(2)}-${item.entryZone.max.toFixed(2)}` : "-"}</span>
          </div>
          <div className="p-1.5 bg-red-500/10 rounded text-red-400 text-center">
            Stop<br />
            <span className="font-mono">{item.stop?.toFixed(2) ?? "-"}</span>
          </div>
          <div className="p-1.5 bg-blue-500/10 rounded text-blue-400 text-center">
            R:R<br />
            <span className="font-mono">{item.riskRewardRatio?.toFixed(1) ?? "-"}</span>
          </div>
        </div>

        {/* Verification & Consensus */}
        <div className="flex items-center justify-between text-xs mb-3">
          <Badge variant="outline" className={item.verificationStatus === "verified" ? "bg-green-500/20 text-green-400" : item.verificationStatus === "unverified" ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"}>
            {item.verificationStatus}
          </Badge>
          {item.researchConsensus && (
            <span className="text-muted-foreground">
              Consensus: {item.researchConsensus.agreementLevel}%
            </span>
          )}
        </div>

        {/* Reason */}
        <p className="text-xs text-muted-foreground line-clamp-2 mt-auto">
          {item.reasons[0] || "No reason provided"}
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({ value, label, className = "" }: { value: string | number; label: string; className?: string }) {
  return (
    <div className={`p-2 bg-muted/30 rounded ${className}`}>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}