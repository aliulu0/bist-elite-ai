import { useState } from 'react';
import { Filter } from 'lucide-react';

interface WatchlistFiltersProps {
  sectors: string[];
  onFilterChange: (filters: { sector: string; status: string; hasAlert: string; trend: string }) => void;
}

export function WatchlistFilters({ sectors, onFilterChange }: WatchlistFiltersProps) {
  const [sector, setSector] = useState('');
  const [status, setStatus] = useState('');
  const [hasAlert, setHasAlert] = useState('');
  const [trend, setTrend] = useState('');
  const [open, setOpen] = useState(false);

  const apply = (updates: Partial<{ sector: string; status: string; hasAlert: string; trend: string }>) => {
    const next = { sector: updates.sector ?? sector, status: updates.status ?? status, hasAlert: updates.hasAlert ?? hasAlert, trend: updates.trend ?? trend };
    if (updates.sector !== undefined) setSector(updates.sector);
    if (updates.status !== undefined) setStatus(updates.status);
    if (updates.hasAlert !== undefined) setHasAlert(updates.hasAlert);
    if (updates.trend !== undefined) setTrend(updates.trend);
    onFilterChange(next);
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium"
        aria-label="Filtreleri aç/kapat"
      >
        <span className="flex items-center gap-1.5"><Filter className="h-3.5 w-3.5" /> Filtreler</span>
        <span className="text-muted-foreground">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-3 border-t px-4 py-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">Sektör</label>
            <select value={sector} onChange={(e) => apply({ sector: e.target.value })} className="w-full rounded-md border bg-muted/50 px-2 py-1.5 text-xs outline-none">
              <option value="">Tümü</option>
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">Durum</label>
            <select value={status} onChange={(e) => apply({ status: e.target.value })} className="w-full rounded-md border bg-muted/50 px-2 py-1.5 text-xs outline-none">
              <option value="">Tümü</option>
              <option value="AKTİF">Aktif</option>
              <option value="İZLENEN">İzlenen</option>
              <option value="BEKLEMEDE">Beklemede</option>
              <option value="PASİF">Pasif</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">Alarm</label>
            <select value={hasAlert} onChange={(e) => apply({ hasAlert: e.target.value })} className="w-full rounded-md border bg-muted/50 px-2 py-1.5 text-xs outline-none">
              <option value="">Tümü</option>
              <option value="yes">Alarm Var</option>
              <option value="no">Alarm Yok</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">Trend</label>
            <select value={trend} onChange={(e) => apply({ trend: e.target.value })} className="w-full rounded-md border bg-muted/50 px-2 py-1.5 text-xs outline-none">
              <option value="">Tümü</option>
              <option value="YUKARI">Yukarı</option>
              <option value="ASAGI">Aşağı</option>
              <option value="YATAY">Yatay</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
