import { useSettingsStore } from '@/stores/settings-store';
import type { ThemeMode, Density } from '@/components/settings/settings-types';

export function SettingsTheme() {
  const theme = useSettingsStore((s) => s.values.theme);
  const updateValues = useSettingsStore((s) => s.updateValues);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Tema Ayarları</h3>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Tema</label>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => updateValues('theme', 'mode', mode)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  theme.mode === mode
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {mode === 'light' ? 'Açık' : mode === 'dark' ? 'Koyu' : 'Sistem'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Yoğunluk</label>
          <div className="flex gap-2">
            {(['compact', 'normal', 'spacious'] as Density[]).map((d) => (
              <button
                key={d}
                onClick={() => updateValues('theme', 'density', d)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  theme.density === d
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {d === 'compact' ? 'Kompakt' : d === 'normal' ? 'Normal' : 'Geniş'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Renk Vurgusu</label>
          <input
            type="color"
            value={theme.accentColor}
            onChange={(e) => updateValues('theme', 'accentColor', e.target.value)}
            className="h-10 w-20 rounded-lg border border-border"
          />
        </div>
      </div>
    </div>
  );
}
