'use client';

import { useStore } from '@/stores';
import { useI18n } from '@/hooks/use-i18n';

export function Header() {
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">{t('app.name')}</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}
          className="rounded-md px-3 py-1 text-sm font-medium hover:bg-accent"
        >
          {language === 'en' ? '🇹🇷 TR' : '🇬🇧 EN'}
        </button>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-md p-2 hover:bg-accent"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
