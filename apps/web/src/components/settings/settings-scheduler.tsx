import { useSettingsStore } from '@/stores/settings-store';

export function SettingsScheduler() {
  const scheduler = useSettingsStore((s) => s.values.scheduler);
  const updateValues = useSettingsStore((s) => s.updateValues);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Zamanlayıcı Ayarları</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Piyasa Açılış Taraması</label>
          <input type="text" value={scheduler.marketScan} onChange={(e) => updateValues('scheduler', 'marketScan', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="cron" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Artımlı Tarama</label>
          <input type="text" value={scheduler.incrementalScan} onChange={(e) => updateValues('scheduler', 'incrementalScan', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="cron" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Gece Backtest</label>
          <input type="text" value={scheduler.nightlyBacktest} onChange={(e) => updateValues('scheduler', 'nightlyBacktest', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="cron" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Gece Benchmark</label>
          <input type="text" value={scheduler.nightlyBenchmark} onChange={(e) => updateValues('scheduler', 'nightlyBenchmark', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="cron" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Güncelleme Aralığı (dk)</label>
          <input type="number" value={scheduler.updateInterval} onChange={(e) => updateValues('scheduler', 'updateInterval', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Önbellek Temizleme</label>
          <input type="text" value={scheduler.cacheCleanup} onChange={(e) => updateValues('scheduler', 'cacheCleanup', e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="cron" />
        </div>
      </div>
    </div>
  );
}
