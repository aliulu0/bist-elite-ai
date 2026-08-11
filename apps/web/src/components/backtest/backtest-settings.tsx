import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { BacktestConfig, EntryRule, ExitRule } from './backtest-types';
import { ENTRY_SIGNALS, EXIT_SIGNALS, DEFAULT_ENTRY_RULES, DEFAULT_EXIT_RULES } from './backtest-types';

interface BacktestSettingsProps {
  config: BacktestConfig;
  onUpdate: (config: Partial<BacktestConfig>) => void;
  onAddEntryRule: (rule: EntryRule) => void;
  onRemoveEntryRule: (index: number) => void;
  onUpdateEntryRule: (index: number, rule: EntryRule) => void;
  onAddExitRule: (rule: ExitRule) => void;
  onRemoveExitRule: (index: number) => void;
  onUpdateExitRule: (index: number, rule: ExitRule) => void;
}

export function BacktestSettings({
  config,
  onUpdate,
  onAddEntryRule,
  onRemoveEntryRule,
  onUpdateEntryRule,
  onAddExitRule,
  onRemoveExitRule,
  onUpdateExitRule,
}: BacktestSettingsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
        aria-expanded={expanded}
      >
        <span>Backtest Ayarları</span>
        <span className="text-muted-foreground">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="space-y-4 border-t px-4 pb-4 pt-3">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field
              label="Başlangıç Sermayesi (₺)"
              value={config.initialCapital}
              onChange={(v) => onUpdate({ initialCapital: Number(v) })}
              type="number"
            />
            <Field
              label="Pozisyon Büyüklüğü (%)"
              value={config.positionSizePercent}
              onChange={(v) => onUpdate({ positionSizePercent: Number(v) })}
              type="number"
            />
            <Field
              label="Risksiz Faiz Oranı (%)"
              value={config.riskFreeRate * 100}
              onChange={(v) => onUpdate({ riskFreeRate: Number(v) / 100 })}
              type="number"
            />
            <Field
              label="Min Gereken İşlem"
              value={config.minTradesRequired}
              onChange={(v) => onUpdate({ minTradesRequired: Number(v) })}
              type="number"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Giriş Kuralları</h4>
              <button
                onClick={() => onAddEntryRule({ ...DEFAULT_ENTRY_RULES[0] })}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Ekle
              </button>
            </div>
            {config.entryRules.map((rule, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={rule.signal}
                  onChange={(e) => onUpdateEntryRule(i, { ...rule, signal: e.target.value })}
                  className="rounded-md border bg-muted/50 px-2 py-1 text-xs"
                >
                  {ENTRY_SIGNALS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={rule.threshold}
                  onChange={(e) => onUpdateEntryRule(i, { ...rule, threshold: Number(e.target.value) })}
                  className="w-16 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                  placeholder="Eşik"
                />
                <input
                  type="number"
                  value={rule.lookback}
                  onChange={(e) => onUpdateEntryRule(i, { ...rule, lookback: Number(e.target.value) })}
                  className="w-16 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                  placeholder="Geri Dönüş"
                />
                {config.entryRules.length > 1 && (
                  <button onClick={() => onRemoveEntryRule(i)} className="text-destructive hover:underline" data-testid={`remove-entry-${i}`}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Çıkış Kuralları</h4>
              <button
                onClick={() => onAddExitRule({ ...DEFAULT_EXIT_RULES[0] })}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Ekle
              </button>
            </div>
            {config.exitRules.map((rule, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select
                  value={rule.signal}
                  onChange={(e) => onUpdateExitRule(i, { ...rule, signal: e.target.value })}
                  className="rounded-md border bg-muted/50 px-2 py-1 text-xs"
                >
                  {EXIT_SIGNALS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={rule.stopLossPercent}
                  onChange={(e) => onUpdateExitRule(i, { ...rule, stopLossPercent: Number(e.target.value) })}
                  className="w-14 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                  placeholder="Zarar %"
                />
                <input
                  type="number"
                  value={rule.takeProfitPercent}
                  onChange={(e) => onUpdateExitRule(i, { ...rule, takeProfitPercent: Number(e.target.value) })}
                  className="w-14 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                  placeholder="Kâr %"
                />
                <input
                  type="number"
                  value={rule.trailingStopPercent}
                  onChange={(e) => onUpdateExitRule(i, { ...rule, trailingStopPercent: Number(e.target.value) })}
                  className="w-14 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                  placeholder="Takip %"
                />
                <input
                  type="number"
                  value={rule.maxHoldingDays}
                  onChange={(e) => onUpdateExitRule(i, { ...rule, maxHoldingDays: Number(e.target.value) })}
                  className="w-16 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                  placeholder="Max Gün"
                />
                {config.exitRules.length > 1 && (
                  <button onClick={() => onRemoveExitRule(i)} className="text-destructive hover:underline" data-testid={`remove-exit-${i}`}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: number | string; onChange: (v: string) => void; type?: string }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-muted/50 px-3 py-1.5 text-sm outline-none"
      />
    </div>
  );
}
