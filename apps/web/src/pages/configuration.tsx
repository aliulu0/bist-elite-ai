import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, LoadingCard, ErrorCard, Badge, SectionTitle, Progress } from '@/components/shared';
import { sdkClient } from '@/lib/sdk';
import { Settings, RefreshCw, Save, ChevronDown, ChevronRight } from 'lucide-react';

interface ConfigSection {
  key: string;
  label: string;
  settings: Array<{ key: string; label: string; value: string | number | boolean; type: string }>;
}

export default function ConfigurationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<ConfigSection[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sdkClient.configuration();
      const domains = (res as { data?: { domains?: Record<string, Record<string, unknown>> } }).data?.domains ?? {};
      const sections: ConfigSection[] = Object.entries(domains).map(([domain, config]) => ({
        key: domain,
        label: domain.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        settings: Object.entries(config).map(([key, value]) => ({
          key,
          label: key,
          value: typeof value === 'object' ? JSON.stringify(value) : (value as string | number | boolean),
          type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
        })),
      }));
      setConfig(sections);
      setExpanded(new Set(sections.map((s) => s.key)));
    } catch {
      setError('Yapılandırma yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSection = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateSetting = (sectionKey: string, settingKey: string, value: unknown) => {
    setConfig((prev) => prev.map((s) => s.key === sectionKey ? { ...s, settings: s.settings.map((st) => st.key === settingKey ? { ...st, value: value as string | number | boolean } : st) } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      for (const section of config) {
        const domain = section.key;
        for (const setting of section.settings) {
          const value = setting.type === 'number' ? Number(setting.value) : setting.type === 'boolean' ? Boolean(setting.value) : String(setting.value);
          await sdkClient.configurationUpdateValue(domain, setting.key, value);
        }
      }
    } catch {
      setError('Yapılandırma kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Yapılandırma"
        description="Sistem ayarlarını yönetin"
        actions={
          <div className="flex gap-2">
            <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"><RefreshCw className="h-3.5 w-3.5" />Yenile</button>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><Save className="h-3.5 w-3.5" />{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </div>
        }
      />

      {loading ? <LoadingCard /> : error ? <ErrorCard message={error} onRetry={fetchData} /> : (
        <div className="space-y-4">
          {config.map((section) => (
            <Card key={section.key}>
              <button onClick={() => toggleSection(section.key)} className="flex w-full items-center justify-between" aria-expanded={expanded.has(section.key)}>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{section.label}</span>
                  <Badge variant="outline">{section.settings.length}</Badge>
                </div>
                {expanded.has(section.key) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {expanded.has(section.key) && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  {section.settings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">{setting.label}</label>
                      {setting.type === 'boolean' ? (
                        <button
                          onClick={() => updateSetting(section.key, setting.key, !setting.value)}
                          className={`relative h-5 w-9 rounded-full transition-colors ${setting.value ? 'bg-primary' : 'bg-muted'}`}
                          role="switch"
                          aria-checked={Boolean(setting.value)}
                        >
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${setting.value ? 'left-[18px]' : 'left-0.5'}`} />
                        </button>
                      ) : (
                        <input
                          type={setting.type === 'number' ? 'number' : 'text'}
                          value={String(setting.value)}
                          onChange={(e) => updateSetting(section.key, setting.key, setting.type === 'number' ? Number(e.target.value) : e.target.value)}
                          className="w-32 rounded-md border bg-muted/50 px-2 py-1 text-right text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
