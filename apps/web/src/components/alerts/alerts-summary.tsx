import { useAlertsStore } from '@/stores/alerts-store';
import { AlertTriangle, Bell, AlertCircle, Info, Eye, CalendarCheck, CheckCircle2 } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function KpiCard({ label, value, icon, color }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

export function AlertsSummary() {
  const summary = useAlertsStore((s) => s.summary);

  if (!summary) return null;

  const cards: KpiCardProps[] = [
    { label: 'Toplam Alarm', value: summary.total, icon: <Bell className="h-4 w-4" />, color: 'text-primary' },
    { label: 'Yeni Alarm', value: summary.unread, icon: <AlertCircle className="h-4 w-4" />, color: 'text-destructive' },
    { label: 'Yüksek Öncelik', value: summary.kritik + summary.yuksek, icon: <AlertTriangle className="h-4 w-4" />, color: 'text-warning' },
    { label: 'Orta Öncelik', value: summary.orta, icon: <Info className="h-4 w-4" />, color: 'text-primary' },
    { label: 'Düşük Öncelik', value: summary.dusuk, icon: <Info className="h-4 w-4" />, color: 'text-muted-foreground' },
    { label: 'Okunmamış Alarm', value: summary.unread, icon: <Eye className="h-4 w-4" />, color: 'text-warning' },
    { label: 'Bugünkü Alarm', value: summary.todayCount, icon: <CalendarCheck className="h-4 w-4" />, color: 'text-success' },
    { label: 'Çözülen Alarm', value: summary.resolvedCount, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-success' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
