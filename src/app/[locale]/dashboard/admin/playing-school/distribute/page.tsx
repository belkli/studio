'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { QrCode, MessageCircle, Copy, Check, ExternalLink, TrendingUp, Handshake } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAdminGuard } from '@/hooks/use-admin-guard';
import { Skeleton } from '@/components/ui/skeleton';

const MOCK_FUNNEL = [
  { key: 'leads', value: 450, color: 'bg-slate-200' },
  { key: 'tokenScanned', value: 310, color: 'bg-indigo-200' },
  { key: 'startedWizard', value: 185, color: 'bg-indigo-400' },
  { key: 'enrolledPaid', value: 142, color: 'bg-emerald-500' },
] as const;

const MOCK_TOKENS = [
  { school: 'ORT Ramat Gan', token: 'TOKEN_ORT_26', enrolled: 45, max: 60, year: '2026' },
  { school: 'Dinur School', token: 'TOKEN_DINUR_26', enrolled: 12, max: 40, year: '2026' },
];

export default function PlayingSchoolDistributionPage() {
  const { user, isLoading } = useAdminGuard();
  const t = useTranslations('PlayingSchool.distribution');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: t('copied') });
  };

  const handleWhatsAppShare = (school: string, token: string) => {
    const url = `https://harmony.app/register/school?token=${token}`;
    const message = encodeURIComponent(t('whatsAppMessage', { school, url }));
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (isLoading || !user) {
    return (
      <div className="space-y-8 p-8" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-start">
            <Handshake className="h-8 w-8 text-indigo-600" />
            {t('title')}
          </h1>
          <p className="text-slate-500 mt-1 text-start">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 shadow-sm border-slate-200 overflow-hidden bg-gradient-to-b from-white to-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-start">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              {t('funnelTitle')}
            </CardTitle>
            <CardDescription className="text-start">{t('funnelSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_FUNNEL.map((step) => (
              <div key={step.key} className="space-y-1.5">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-600">{t(`funnel.${step.key}`)}</span>
                  <span className="text-slate-900">{step.value}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`${step.color} h-2 rounded-full`} style={{ width: `${(step.value / MOCK_FUNNEL[0].value) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-200 mt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('conversionRate')}</p>
                  <p className="text-2xl font-black text-indigo-600">31.5%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500 opacity-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-start">
              <QrCode className="h-5 w-5 text-indigo-600" />
              {t('tokensTitle')}
            </CardTitle>
            <CardDescription className="text-start">{t('tokensSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-start">{t('schoolPartnership')}</TableHead>
                  <TableHead className="font-bold text-start">{t('registrationToken')}</TableHead>
                  <TableHead className="font-bold text-start">{t('conversion')}</TableHead>
                  <TableHead className="font-bold text-end">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_TOKENS.map((row) => (
                  <TableRow key={row.token}>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-start">{row.school}</div>
                      <div className="text-[10px] text-slate-400 font-medium text-start">{t('academicYear', { year: row.year })}</div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-2 p-1 px-2 rounded-lg bg-slate-50 border border-slate-200">
                        <code className="text-xs font-mono text-indigo-600">{row.token}</code>
                        <button onClick={() => handleCopy(`https://harmony.app/register/school?token=${row.token}`, row.token)} className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-indigo-600">
                          {copied === row.token ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 w-24">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>{row.enrolled}/{row.max}</span>
                          <span>{Math.round((row.enrolled / row.max) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${(row.enrolled / row.max) * 100}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300" onClick={() => handleWhatsAppShare(row.school, row.token)}>
                          <MessageCircle className="h-4 w-4 me-1" />
                          {t('whatsapp')}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label={t('openLink')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}