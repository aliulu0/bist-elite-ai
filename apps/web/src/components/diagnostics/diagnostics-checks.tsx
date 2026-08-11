import { Card, Badge, EmptyState } from '@/components/shared';
import type { DiagnosticsSnapshot, DiagnosticCheck } from './diagnostics-types';
import { CHECK_STATUS_LABELS, CHECK_STATUS_BADGE, MODULE_CATEGORY_MAP } from './diagnostics-types';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface DiagnosticsChecksProps {
  snapshot: DiagnosticsSnapshot | null;
  filterCategory?: string;
}

const COLUMNS: Array<{ key: string; label: string }> = [
  { key: 'name', label: 'Kontrol' },
  { key: 'status', label: 'Durum' },
  { key: 'duration', label: 'Süre' },
  { key: 'message', label: 'Mesaj' },
];

export function DiagnosticsChecks({ snapshot, filterCategory }: DiagnosticsChecksProps) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  if (!snapshot || snapshot.checks.length === 0) {
    return <EmptyState title="Kontrol sonucu yok" description="Tanılama kontrol sonuçları burada görüntülenecek" />;
  }

  let filtered = snapshot.checks;
  if (filterCategory) {
    filtered = filtered.filter((c) => {
      const cat = MODULE_CATEGORY_MAP[c.name] || c.category || '';
      return cat === filterCategory;
    });
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortKey as keyof DiagnosticCheck];
    const bVal = b[sortKey as keyof DiagnosticCheck];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? <ChevronUp className="inline h-3 w-3" /> : <ChevronDown className="inline h-3 w-3" />;
  };

  return (
    <Card title="Kontrol Sonuçları">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="cursor-pointer px-3 py-2 text-left font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label} <SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((check, i) => (
              <tr key={`${check.name}-${i}`} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-3 py-2 font-medium">{check.name}</td>
                <td className="px-3 py-2">
                  <Badge variant={CHECK_STATUS_BADGE[check.status]}>
                    {CHECK_STATUS_LABELS[check.status]}
                  </Badge>
                </td>
                <td className="px-3 py-2">{check.duration}ms</td>
                <td className="px-3 py-2 text-muted-foreground">{check.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
