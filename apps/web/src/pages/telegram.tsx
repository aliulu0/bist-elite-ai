import { useCallback, useEffect, useState } from 'react';
import { PageHeader, Card, LoadingCard, ErrorCard, Badge, StatCard, type Column, DataTable } from '@/components/shared';
import { sdkClient } from '@/lib/sdk';
import { Send, RefreshCw, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TelegramStatus {
  configured: boolean;
  enabled: boolean;
  dailyRadarEnabled: boolean;
  status: string;
  statusDetail?: string;
  botUsername?: string | null;
  lastRunAt?: string | null;
  lastError?: string | null;
  sentCount: number;
  duplicateSkippedCount: number;
  deliveryTotal: number;
  lastDelivery?: Record<string, unknown> | null;
}

interface DeliveryRecord {
  id: string;
  ticker: string;
  status: string;
  messageType: string;
  telegramMessageId: string;
  deliveredAt: string;
  errorCode: string | null;
  errorMessageSanitized: string | null;
}

const statusVariant = (status: string): 'success' | 'danger' | 'warning' | 'info' | 'default' => {
  switch (String(status).toUpperCase()) {
    case 'VERIFIED':
    case 'SENT':
    case 'READY':
    case 'CONFIGURED':
      return 'success';
    case 'AUTH_FAILED':
    case 'SEND_FAILED':
    case 'FAILED':
    case 'RATE_LIMITED':
    case 'CHAT_UNAVAILABLE':
      return 'danger';
    case 'NOT_CONFIGURED':
      return 'warning';
    default:
      return 'default';
  }
};

const statusLabel = (status: string): string => {
  switch (String(status).toUpperCase()) {
    case 'VERIFIED': return 'Doğrulandı';
    case 'SENT': return 'Gönderildi';
    case 'READY': return 'Hazır';
    case 'AUTH_FAILED': return 'Kimlik doğrulama başarısız';
    case 'SEND_FAILED': return 'Gönderilemedi';
    case 'FAILED': return 'Başarısız';
    case 'RATE_LIMITED': return 'Hız sınırı';
    case 'CHAT_UNAVAILABLE': return 'Sohbet kullanılamıyor';
    case 'NOT_CONFIGURED': return 'Yapılandırılmadı';
    case 'SKIPPED_DUPLICATE': return 'Tekrar atlandı';
    case 'SKIPPED_EMPTY': return 'Boş rapor atlandı';
    case 'SKIPPED_DISABLED': return 'Devre dışı';
    default: return status;
  }
};

export default function TelegramPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [actionState, setActionState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [actionMessage, setActionMessage] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statusRes, deliveriesRes] = await Promise.all([sdkClient.telegram.status(), sdkClient.telegram.deliveries({ limit: 50 })]);
      const s = (statusRes as { data?: Record<string, unknown> }).data ?? (statusRes as Record<string, unknown>);
      setStatus(s as unknown as TelegramStatus);
      const d = (deliveriesRes as { data?: { deliveries?: Array<Record<string, unknown>>; total?: number } }).data ?? (deliveriesRes as { deliveries?: Array<Record<string, unknown>>; total?: number });
      const items: DeliveryRecord[] = Array.isArray(d.deliveries)
        ? d.deliveries.map((r) => ({
            id: String(r.id ?? ''),
            ticker: String(r.ticker ?? ''),
            status: String(r.status ?? ''),
            messageType: String(r.messageType ?? ''),
            telegramMessageId: String(r.telegramMessageId ?? ''),
            deliveredAt: String(r.deliveredAt ?? r.createdAt ?? ''),
            errorCode: r.errorCode != null ? String(r.errorCode) : null,
            errorMessageSanitized: r.errorMessageSanitized != null ? String(r.errorMessageSanitized) : null,
          }))
        : [];
      setDeliveries(items);
      setDeliveryTotal(Number(d.total ?? items.length));
    } catch {
      setError('Telegram durumu yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const triggerSend = useCallback(async (dryRun: boolean) => {
    setActionState('sending');
    setActionMessage('');
    try {
      const res = await sdkClient.telegram.send({ dryRun });
      const data = (res as { data?: Record<string, unknown> }).data ?? (res as Record<string, unknown>);
      const statusStr = String(data.status ?? '');
      setActionState(statusStr === 'SENT' ? 'done' : statusStr === 'DRY_RUN' ? 'done' : 'error');
      setActionMessage(statusStr);
      await fetchAll();
    } catch {
      setActionState('error');
      setActionMessage('Gönderim isteği başarısız oldu');
    }
  }, [fetchAll]);

  const columns: Column<DeliveryRecord>[] = [
    { key: 'ticker', header: 'Sembol', sortable: true, render: (r) => <span className="font-medium">{r.ticker || '-'}</span> },
    {
      key: 'status',
      header: 'Durum',
      sortable: true,
      render: (r) => <Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge>,
    },
    { key: 'messageType', header: 'Tür', sortable: true, render: (r) => r.messageType },
    { key: 'telegramMessageId', header: 'Mesaj ID', render: (r) => (r.telegramMessageId ? <span className="text-xs text-muted-foreground">{r.telegramMessageId}</span> : '-') },
    { key: 'deliveredAt', header: 'Zaman', sortable: true, render: (r) => (r.deliveredAt ? new Date(r.deliveredAt).toLocaleString('tr-TR') : '-') },
    { key: 'errorMessageSanitized', header: 'Hata', render: (r) => (r.errorMessageSanitized ? <span className="text-xs text-destructive">{r.errorMessageSanitized}</span> : '-') },
  ];

  return (
    <div>
      <PageHeader
        title="Telegram Fırsat Radarı"
        description="Günlük fırsat raporunun Telegram üzerinden dağıtımı"
        actions={
          <>
            <button
              onClick={() => triggerSend(true)}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <Eye className="h-3.5 w-3.5" />Önizle
            </button>
            <button
              onClick={() => triggerSend(false)}
              disabled={actionState === 'sending'}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {actionState === 'sending' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Şimdi Gönder
            </button>
            <button
              onClick={fetchAll}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              <RefreshCw className="h-3.5 w-3.5" />Tazele
            </button>
          </>
        }
      />

      {actionState !== 'idle' && (
        <div
          className={cn(
            'mb-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
            actionState === 'done' ? 'border-success/30 bg-success/10 text-success' : actionState === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'text-muted-foreground',
          )}
        >
          {actionState === 'done' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {actionState === 'sending' ? 'Gönderim yapılıyor...' : `Sonuç: ${actionMessage}`}
        </div>
      )}

      {loading ? <LoadingCard /> : error ? <ErrorCard message={error} onRetry={fetchAll} /> : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Yapılandırma" value={status?.configured ? 'Yapılandırıldı' : 'Yapılandırılmadı'} description={status?.botUsername ?? '-'} />
            <StatCard title="Durum" value={statusLabel(status?.status ?? '')} />
            <StatCard title="Gönderilen Mesaj" value={status?.sentCount ?? 0} />
            <StatCard title="Toplam Teslimat" value={deliveryTotal} />
          </div>

          {status?.lastRunAt && (
            <Card className="mt-4">
              <p className="text-xs text-muted-foreground">
                Son günlük çalıştırma: {new Date(status.lastRunAt).toLocaleString('tr-TR')}
                {status.lastError ? ` — Hata: ${status.lastError}` : ''}
              </p>
            </Card>
          )}

          <Card className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Teslimat Geçmişi</h2>
              <Badge variant="outline">{deliveryTotal} kayıt</Badge>
            </div>
            <DataTable columns={columns} data={deliveries} pageSize={15} emptyMessage="Teslimat kaydı bulunamadı" />
          </Card>
        </>
      )}
    </div>
  );
}