import { useSettingsStore } from '@/stores/settings-store';

export function SettingsScanner() {
  const scanner = useSettingsStore((s) => s.values.scanner);
  const updateValues = useSettingsStore((s) => s.updateValues);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Tarayıcı Ayarları</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Minimum Elite Skoru</label>
          <input type="number" value={scanner.minEliteScore} onChange={(e) => updateValues('scanner', 'minEliteScore', Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Minimum Fırsat Skoru</label>
          <input type="number" value={scanner.minOpportunity} onChange={(e) => updateValues('scanner', 'minOpportunity', Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Minimum Güven Düzeyi</label>
          <input type="number" step="0.1" min="0" max="1" value={scanner.minConfidence} onChange={(e) => updateValues('scanner', 'minConfidence', Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Maksimum Sonuç</label>
          <input type="number" value={scanner.maxResults} onChange={(e) => updateValues('scanner', 'maxResults', Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">İzleme Listesi Limiti</label>
          <input type="number" value={scanner.watchlistLimit} onChange={(e) => updateValues('scanner', 'watchlistLimit', Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Sıralama Varsayılanı</label>
          <select value={scanner.defaultSort} onChange={(e) => updateValues('scanner', 'defaultSort', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="eliteScore">Elite Skoru</option>
            <option value="opportunityScore">Fırsat Skoru</option>
            <option value="symbol">Sembol</option>
          </select>
        </div>
      </div>
    </div>
  );
}
