'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiQuery } from '@/hooks/use-api';
import { useI18n } from '@/hooks/use-i18n';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

export function NotificationsCard() {
  const { t } = useI18n();
  const { data, isLoading } = useApiQuery<Notification[]>(
    ['notifications'],
    '/api/v1/notifications?limit=5',
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const notifications = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('dashboard.recentNotifications')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-3 rounded-md border p-3"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{notif.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {notif.message}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(notif.createdAt).toLocaleTimeString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">--</div>
        )}
      </CardContent>
    </Card>
  );
}
