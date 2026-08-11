import { useState } from 'react';
import { Card, EmptyState } from '@/components/shared';
import type { ProviderHealthSnapshot, ProviderHealthEntry } from './provider-types';
import { PROVIDER_STATUS_LABELS, PROVIDER_STATUS_BADGE } from './provider-types';
import { Badge } from '@/components/shared';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ProviderHealthTableProps {
  snapshot: ProviderHealthSnapshot | null;
}

const COLUMNS: Array<{ key: string; label: string }> = [
  { key: 'name', label: 'Sağlayıcı' },
  { key: 'status', label: 'Durum' },
  { key: 'latencyMs', label: 'Gecikme' },
  { key: 'successRate', label: 'Başarı Oranı' },
  { key: 'errorRate', label: 'Hata Oranı' },
  { key: 'reliabilityScore', label: 'Güvenilirlik' },
  { key: 'consecutiveFailures', label: 'Arka Arkaya Hata' },
  { key: 'lastSuccessAt', label: 'Son Başarı' },
  { key: 'lastFailureAt', label: 'Son Hata' },
];

function formatTimestamp(ts: string | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('tr-TR');
}

export function ProviderHealthTable({ snapshot }: ProviderHealthTableProps) {
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  if (!snapshot || snapshot.providers.length === 0) {
    return <EmptyState title="Sağlayıcı tablosu verisi yok" description="Sağlayıcı bilgileri toplandığında burada görüntülenecek" />;
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...snapshot.providers].sort((a, b) => {
    const aVal = a[sortKey as keyof ProviderHealthEntry];
    const bVal = b[sortKey as keyof ProviderHealthEntry];
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
    <Card title="Sağlayıcı Tablosu">
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
            {sorted.map((provider) => (
              <tr key={provider.name} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-3 py-2 font-medium">{provider.name}</td>
                <td className="px-3 py-2">
                  <Badge variant={PROVIDER_STATUS_BADGE[provider.status]}>
                    {PROVIDER_STATUS_LABELS[provider.status]}
                  </Badge>
                </td>
                <td className="px-3 py-2">{Math.round(provider.latencyMs)}ms</td>
                <td className="px-3 py-2">{provider.successRate.toFixed(1)}%</td>
                <td className="px-3 py-2">{provider.errorRate.toFixed(1)}%</td>
                <td className="px-3 py-2">%{provider.reliabilityScore.toFixed(1)}</td>
                <td className="px-3 py-2">{provider.consecutiveFailures}</td>
                <td className="px-3 py-2">{formatTimestamp(provider.lastSuccessAt)}</td>
                <td className="px-3 py-2">{formatTimestamp(provider.lastFailureAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
