import { useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useNotificationStore, type Notification } from '@/stores';
import { cn } from '@/lib/utils';

const icons: Record<Notification['type'], React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  info: <Info className="h-4 w-4 text-info" />,
};

function Toast({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border bg-card p-3 shadow-lg animate-slide-in-right',
      )}
      role="alert"
    >
      <div className="mt-0.5">{icons[notification.type]}</div>
      <div className="flex-1">
        <p className="text-xs font-medium">{notification.title}</p>
        <p className="text-xs text-muted-foreground">{notification.message}</p>
      </div>
      <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground" aria-label="Kapat">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();
  const recent = notifications.slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="region" aria-label="Bildirimler">
      {recent.map((n) => (
        <Toast key={n.id} notification={n} onDismiss={() => removeNotification(n.id)} />
      ))}
    </div>
  );
}
