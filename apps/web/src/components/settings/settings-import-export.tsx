import { Download, Upload, FileCheck } from 'lucide-react';

export function SettingsImportExport() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">İçe / Dışa Aktar</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">Dışa Aktar</h4>
          <div className="space-y-2">
            <button className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
              <Download className="h-4 w-4" />
              JSON Dışa Aktar
            </button>
            <button className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
              <Download className="h-4 w-4" />
              Profil Dışa Aktar
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">İçe Aktar</h4>
          <div className="space-y-2">
            <button className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
              <Upload className="h-4 w-4" />
              JSON İçe Aktar
            </button>
            <button className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
              <Upload className="h-4 w-4" />
              Profil İçe Aktar
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileCheck className="h-4 w-4" />
          Şema Doğrulama: Tüm alanlar geçerli
        </div>
      </div>
    </div>
  );
}
