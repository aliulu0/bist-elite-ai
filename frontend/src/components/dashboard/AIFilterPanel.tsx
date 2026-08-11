"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEarlyOpportunities } from "@/hooks/use-dashboard";
import type { EarlyOpportunityFilters, RiskLevel } from "@/types/dashboard";
import { SECTORS, LIQUIDITY_LEVELS, RISK_LEVELS } from "@/lib/constants";

export function AIFilterPanel({ onFiltersChange }: { onFiltersChange: (filters: EarlyOpportunityFilters) => void }) {
  const [filters, setFilters] = useState<EarlyOpportunityFilters>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof EarlyOpportunityFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onFiltersChange({});
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">AI Filter Panel</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "−" : "+"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Score Filters */}
          <FilterSection title="Scores">
            <div className="grid grid-cols-2 gap-3">
              <SliderField
                label="Early Opportunity Score"
                value={filters.minEarlyOpportunityScore || 0}
                min={0}
                max={100}
                step={1}
                onChange={(v) => handleChange("minEarlyOpportunityScore", v)}
                unit=""
              />
              <SliderField
                label="Elite Score"
                value={filters.minEliteScore || 0}
                min={0}
                max={100}
                step={1}
                onChange={(v) => handleChange("minEliteScore", v)}
                unit=""
              />
              <SliderField
                label="Smart Money Score"
                value={filters.minSmartMoneyScore || 0}
                min={0}
                max={100}
                step={1}
                onChange={(v) => handleChange("minSmartMoneyScore", v)}
                unit=""
              />
              <SliderField
                label="Catalyst Score"
                value={filters.minCatalystScore || 0}
                min={0}
                max={100}
                step={1}
                onChange={(v) => handleChange("minCatalystScore", v)}
                unit=""
              />
            </div>
          </FilterSection>

          <Separator />

          {/* Confidence & Return */}
          <FilterSection title="Quality Metrics">
            <div className="grid grid-cols-2 gap-3">
              <SliderField
                label="Confidence"
                value={filters.minConfidence || 0}
                min={0}
                max={100}
                step={1}
                onChange={(v) => handleChange("minConfidence", v)}
                unit="%"
              />
              <SliderField
                label="Expected Return"
                value={filters.minExpectedReturn || 0}
                min={0}
                max={50}
                step={0.5}
                onChange={(v) => handleChange("minExpectedReturn", v)}
                unit="%"
              />
            </div>
          </FilterSection>

          <Separator />

          {/* Risk & Liquidity */}
          <FilterSection title="Risk & Liquidity">
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Max Risk"
                value={filters.maxRisk}
                options={RISK_LEVELS}
                onChange={(v) => handleChange("maxRisk", v as RiskLevel)}
              />
              <SelectField
                label="Liquidity"
                value={filters.liquidity}
                options={LIQUIDITY_LEVELS}
                onChange={(v) => handleChange("liquidity", v as "high" | "medium" | "low")}
              />
            </div>
          </FilterSection>

          <Separator />

          {/* Sector & Market Cap */}
          <FilterSection title="Fundamentals">
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Sector"
                value={filters.sector}
                options={["", ...SECTORS]}
                onChange={(v) => handleChange("sector", v || undefined)}
              />
              <InputField
                label="Market Cap Min (TL)"
                value={filters.marketCap?.min?.toString() || ""}
                placeholder="e.g., 1000000000"
                onChange={(v) => handleChange("marketCap", { ...filters.marketCap, min: v ? Number(v) : undefined })}
              />
            </div>
            <InputField
              label="Market Cap Max (TL)"
              value={filters.marketCap?.max?.toString() || ""}
              placeholder="e.g., 10000000000"
              onChange={(v) => handleChange("marketCap", { ...filters.marketCap, max: v ? Number(v) : undefined })}
            />
          </FilterSection>

          <Separator />

          {/* Advanced Filters */}
          {isExpanded && (
            <FilterSection title="Advanced">
              <p className="text-xs text-muted-foreground mb-2">
                Additional filters: Holding Period, Volume Spike, Relative Volume, Momentum, Trend, Multi-Timeframe Agreement, Timeframe
              </p>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Trend"
                  value={undefined}
                  options={["", "up", "down", "sideways"]}
                  onChange={() => {}}
                  disabled
                />
                <SelectField
                  label="Momentum"
                  value={undefined}
                  options={["", "bullish", "bearish", "neutral"]}
                  onChange={() => {}}
                  disabled
                />
              </div>
            </FilterSection>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button size="sm" onClick={() => onFiltersChange(filters)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex justify-between">
        {label}
        <span className="font-mono text-foreground">{value}{unit}</span>
      </Label>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="h-1.5"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string | undefined;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt || "All"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function InputField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs"
      />
    </div>
  );
}