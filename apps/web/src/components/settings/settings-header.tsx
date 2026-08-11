import { Settings, Save, RotateCcw, Download, Upload } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';

export function SettingsHeader() {
  const dirty = useSettingsStore((s) => s.dirty);
  const save = useSettingsStore((s) => s.save);
  const reset = useSettingsStore((s) => s.reset);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>
        {dirty && (
          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
            Kaydedilmemiş Değişiklik
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={save} disabled={!dirty} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          <Save className="h-4 w-4" />
          Kaydet
        </button>
        <button onClick={reset} disabled={!dirty} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">
          <RotateCcw className="h-4 w-4" />
          Sıfırla
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
          <Download className="h-4 w-4" />
          Dışa Aktar
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent">
          <Upload className="h-4 w-4" />
          İçe Aktar
        </button>
      </div>
    </div>
  );
}
