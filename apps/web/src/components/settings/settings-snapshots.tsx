import { useSettingsStore } from '@/stores/settings-store';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';

export function SettingsSnapshots() {
  const snapshots = useSettingsStore((s) => s.snapshots);
  const addSnapshot = useSettingsStore((s) => s.addSnapshot);
  const removeSnapshot = useSettingsStore((s) => s.removeSnapshot);

  const handleCreate = () => {
    addSnapshot({
      id: `snap-${Date.now()}`,
      profileId: 'default',
      createdAt: new Date().toISOString(),
      createdBy: 'Kullanıcı',
      changes: {},
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Anlık Görüntüler</h3>
        <button onClick={handleCreate} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Oluştur
        </button>
      </div>
      {snapshots.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-8 text-center text-muted-foreground">
          Anlık görüntü yok
        </div>
      ) : (
        <div className="space-y-2">
          {snapshots.map((snap) => (
            <div key={snap.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <span className="text-sm font-medium">{snap.id}</span>
                <p className="text-xs text-muted-foreground">
                  {new Date(snap.createdAt).toLocaleString('tr-TR')} — {snap.createdBy}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded p-1 text-muted-foreground hover:bg-accent" title="Geri Al">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={() => removeSnapshot(snap.id)} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Sil">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
