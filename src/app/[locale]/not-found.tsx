import { Music } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const t = useTranslations('Common.errors');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <Music className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-xl text-muted-foreground">{t('notFoundTitle')}</p>
      <Button asChild>
        <Link href="/">{t('backToHome')}</Link>
      </Button>
    </div>
  );
}
