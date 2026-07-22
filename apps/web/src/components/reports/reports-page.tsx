'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';

export function ReportsPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('nav.reports')}</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Generate comprehensive portfolio analysis report.
            </p>
            <div className="flex gap-2">
              <Button size="sm">PDF</Button>
              <Button size="sm" variant="outline">Excel</Button>
              <Button size="sm" variant="outline">CSV</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Detailed performance metrics and analysis.
            </p>
            <div className="flex gap-2">
              <Button size="sm">PDF</Button>
              <Button size="sm" variant="outline">Excel</Button>
              <Button size="sm" variant="outline">CSV</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Risk analysis and exposure report.
            </p>
            <div className="flex gap-2">
              <Button size="sm">PDF</Button>
              <Button size="sm" variant="outline">Excel</Button>
              <Button size="sm" variant="outline">CSV</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
