import { Card } from '@/components/shared';
import type { AuditSnapshot } from './audit-types';
import { moduleDisplay } from './audit-types';
import { Layers } from 'lucide-react';

interface AuditModuleCardsProps {
  snapshot: AuditSnapshot | null;
  onFilterModule?: (module: string) => void;
}

export function AuditModuleCards({ snapshot, onFilterModule }: AuditModuleCardsProps) {
  if (!snapshot || snapshot.moduleStats.length === 0) return null;

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold">Modüllere Göre Dağılım</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {snapshot.moduleStats.map((ms) => (
          <button
            key={ms.module}
            onClick={() => onFilterModule?.(ms.module)}
            className="flex items-center gap-3 rounded-md border border-border p-3 text-left hover:bg-accent"
          >
            <Layers className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">{moduleDisplay(ms.module)}</p>
              <p className="text-[10px] text-muted-foreground">
                {ms.count} kayıt
                {ms.lastActivity && ` · ${new Date(ms.lastActivity).toLocaleDateString('tr-TR')}`}
              </p>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
