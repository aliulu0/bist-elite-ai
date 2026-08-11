import { useSettingsStore } from '@/stores/settings-store';

export function SettingsAnalysis() {
  const analysis = useSettingsStore((s) => s.values.analysis);
  const updateValues = useSettingsStore((s) => s.updateValues);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Analiz Ayarları</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Varsayılan Timeframe</label>
          <select value={analysis.defaultTimeframe} onChange={(e) => updateValues('analysis', 'defaultTimeframe', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="1d">Günlük</option>
            <option value="1w">Haftalık</option>
            <option value="1m">Aylık</option>
          </select>
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Teknik Ağırlıklar</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(analysis.technicalWeights).map(([key, val]) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-muted-foreground">{key}</label>
              <input type="number" value={val} onChange={(e) => {
                const w = { ...analysis.technicalWeights, [key]: Number(e.target.value) };
                updateValues('analysis', 'technicalWeights', w);
              }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Finansal Ağırlıklar</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(analysis.financialWeights).map(([key, val]) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-muted-foreground">{key}</label>
              <input type="number" value={val} onChange={(e) => {
                const w = { ...analysis.financialWeights, [key]: Number(e.target.value) };
                updateValues('analysis', 'financialWeights', w);
              }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
