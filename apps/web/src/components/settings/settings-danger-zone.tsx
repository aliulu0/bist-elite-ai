import { AlertTriangle } from 'lucide-react';

export function SettingsDangerZone() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-destructive">Tehlikeli Bölge</h3>
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">Bu işlemler geri alınamaz</span>
        </div>
        <div className="space-y-3">
          <button className="flex w-full items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
            Tüm Ayarları Sıfırla
          </button>
          <button className="flex w-full items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
            Tüm Profilleri Sıfırla
          </button>
          <button className="flex w-full items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
            Tüm Anlık Görüntüleri Sil
          </button>
          <button className="flex w-full items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
            Önbelleği Temizle
          </button>
        </div>
      </div>
    </div>
  );
}
