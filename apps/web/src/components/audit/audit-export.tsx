import type { AuditLogEntry } from './audit-types';

interface AuditExportProps {
  logs: AuditLogEntry[];
}

export function exportAuditCSV(logs: AuditLogEntry[]): string {
  const header = 'ID,Zaman,Modül,İşlem,Öncelik,Kullanıcı,Açıklama';
  const rows = logs.map(
    (l) =>
      `${l.id},"${l.timestamp}","${l.module}","${l.action}","${l.severity}","${l.user || ''}","${l.details.replace(/"/g, '""')}"`,
  );
  return [header, ...rows].join('\n');
}

export function exportAuditJSON(logs: AuditLogEntry[]): string {
  return JSON.stringify(logs, null, 2);
}

export function downloadAuditExport(logs: AuditLogEntry[], format: 'csv' | 'json') {
  const content = format === 'csv' ? exportAuditCSV(logs) : exportAuditJSON(logs);
  const blob = new Blob([content], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
