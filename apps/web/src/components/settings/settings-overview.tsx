import { useSettingsStore } from '@/stores/settings-store';
import { Palette, Globe, ScanSearch, Bell, Users, Clock } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function SummaryCard({ label, value, icon }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="mt-2 truncate text-lg font-bold">{value}</div>
    </div>
  );
}

export function SettingsSummary() {
  const values = useSettingsStore((s) => s.values);
  const dirty = useSettingsStore((s) => s.dirty);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <SummaryCard
        label="Tema"
        value={values.theme.mode === 'dark' ? 'Koyu' : values.theme.mode === 'light' ? 'Açık' : 'Sistem'}
        icon={<Palette className="h-4 w-4" />}
      />
      <SummaryCard
        label="Dil"
        value={values.general.language === 'tr' ? 'Türkçe' : 'İngilizce'}
        icon={<Globe className="h-4 w-4" />}
      />
      <SummaryCard
        label="Aktif Profil"
        value="Varsayılan"
        icon={<Users className="h-4 w-4" />}
      />
      <SummaryCard
        label="Durum"
        value={dirty ? 'Kaydedilmemiş Değişiklik' : 'Kayıtlı'}
        icon={<Clock className="h-4 w-4" />}
      />
    </div>
  );
}
