'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { DashboardPage } from '@/components/dashboard/dashboard-page';

export default function Home() {
  return (
    <AppLayout>
      <DashboardPage />
    </AppLayout>
  );
}
