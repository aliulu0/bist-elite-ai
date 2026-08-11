import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-muted p-6">
        <span className="text-5xl font-bold">404</span>
      </div>
      <h1 className="text-2xl font-bold">Sayfa Bulunamadı</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Home className="h-4 w-4" />
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
