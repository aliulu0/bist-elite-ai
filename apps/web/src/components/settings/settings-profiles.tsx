import { useSettingsStore } from '@/stores/settings-store';
import { Plus, Copy, Trash2 } from 'lucide-react';

export function SettingsProfiles() {
  const profiles = useSettingsStore((s) => s.profiles);
  const selectedProfile = useSettingsStore((s) => s.selectedProfile);
  const setProfile = useSettingsStore((s) => s.setProfile);
  const addProfile = useSettingsStore((s) => s.addProfile);
  const removeProfile = useSettingsStore((s) => s.removeProfile);

  const handleAdd = () => {
    const id = `custom-${Date.now()}`;
    addProfile({
      id,
      name: 'Özel Profil',
      description: 'Yeni özel yapılandırma',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Profiller</h3>
        <button onClick={handleAdd} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Profil Oluştur
        </button>
      </div>
      {profiles.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-8 text-center text-muted-foreground">
          Kaydedilmiş profil yok
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => (
            <div key={p.id} className={`flex items-center justify-between rounded-lg border p-3 ${selectedProfile === p.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{p.name}</span>
                  {p.isDefault && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Varsayılan</span>}
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setProfile(p.id)} className="rounded p-1 text-muted-foreground hover:bg-accent" title="Yükle">
                  <Copy className="h-4 w-4" />
                </button>
                {!p.isDefault && (
                  <button onClick={() => removeProfile(p.id)} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Sil">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
