import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, LoadingCard, ErrorCard, Badge, FilterBar, type Column, DataTable } from '@/components/shared';
import { sdkClient } from '@/lib/sdk';
import { Radio, RefreshCw } from 'lucide-react';

interface Event {
  id: string;
  type: string;
  category: string;
  timestamp: string;
  data: string;
}

const parseEvent = (e: Record<string, unknown>): Event => {
  const ts = e.timestamp;
  const payload = e.payload ?? e.data;
  return {
    id: String(e.id ?? ''),
    type: String(e.type ?? ''),
    category: String(e.category ?? ''),
    timestamp: typeof ts === 'number' ? new Date(ts).toISOString() : String(ts ?? ''),
    data: typeof payload === 'string' ? payload : JSON.stringify(payload ?? {}),
  };
};

export default function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sdkClient.eventBus();
      const raw = (res as { data?: { events?: Array<Record<string, unknown>> } }).data?.events;
      const items: Event[] = Array.isArray(raw) ? raw.map(parseEvent) : [];
      setEvents(items);
    } catch {
      setError('Olaylar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = events.filter((e) => !search || e.type.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Event>[] = [
    { key: 'type', header: 'Tür', sortable: true, render: (r) => <span className="font-medium">{r.type}</span> },
    { key: 'category', header: 'Kategori', sortable: true, render: (r) => <Badge variant="outline">{r.category}</Badge> },
    { key: 'timestamp', header: 'Zaman', sortable: true, render: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString('tr-TR') : '-' },
    { key: 'data', header: 'Veri', render: (r) => <span className="max-w-[300px] truncate text-xs text-muted-foreground">{r.data}</span> },
  ];

  return (
    <div>
      <PageHeader title="Olaylar" description="Sistem olaylarını izleyin" actions={<button onClick={fetchData} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"><RefreshCw className="h-3.5 w-3.5" />Tazele</button>} />

      {loading ? <LoadingCard /> : error ? <ErrorCard message={error} onRetry={fetchData} /> : (
        <Card>
          <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Olay türü veya kategori ara..." />
          <DataTable columns={columns} data={filtered} pageSize={15} emptyMessage="Olay bulunamadı" />
        </Card>
      )}
    </div>
  );
}
