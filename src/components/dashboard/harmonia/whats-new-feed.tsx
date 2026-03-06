'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import { useWhatsNew } from '@/hooks/use-whats-new';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/routing';
import { Bell, CalendarDays, ClipboardList, CreditCard, GraduationCap, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';

const TYPE_ICON = {
  announcement: Bell,
  event: CalendarDays,
  form: ClipboardList,
  schedule_change: RefreshCw,
  payment: CreditCard,
  master_class: GraduationCap,
} as const;

export function WhatsNewFeed() {
  const t = useTranslations('Dashboard.whatsNewFeed');
  const locale = useLocale();
  const dateLocale = useDateLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { user } = useAuth();

  const items = useWhatsNew(user?.id ?? '', user?.role ?? 'student', user?.conservatoriumId);

  if (!user) return null;

  return (
    <Card dir={isRtl ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="text-start">{t('title')}</CardTitle>
        <CardDescription className="text-start">{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-start">{t('empty')}</p>
        ) : (
          items.map((item) => {
            const ItemIcon = TYPE_ICON[item.type];
            return (
              <div key={item.id} className="rounded-lg border border-border/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <ItemIcon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-start">{item.title}</p>
                      {!item.isRead && <Badge variant="secondary">{t('new')}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground text-start">{item.description}</p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: dateLocale })}
                  </p>
                </div>
                {item.link ? (
                  <div className="pt-2">
                    <Link href={item.link} className="text-xs text-primary hover:underline">
                      {t('openItem')}
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
