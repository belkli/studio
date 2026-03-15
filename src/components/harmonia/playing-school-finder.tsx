'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Music, School, ArrowLeft, ArrowRight, Info, User as UserIcon, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Locale = 'he' | 'en' | 'ar' | 'ru';

const mockPartnerships = [
  {
    id: 'ps-1',
    schoolSymbol: '44570001',
    names: { he: 'תיכון הדרים', en: 'Hadarim High School', ar: 'ثانوية هدريم', ru: 'Школа Хадарим' },
    cities: { he: 'הוד השרון', en: 'Hod HaSharon', ar: 'هود هشارون', ru: 'Ход-ха-Шарон' },
    instruments: ['piano', 'violin', 'flute'],
    programType: 'GROUP' as const,
  },
  {
    id: 'ps-2',
    schoolSymbol: '12345678',
    names: { he: 'תיכון חדש', en: 'Tichon Hadash', ar: 'ثانوية جديدة', ru: 'Тихон Хадаш' },
    cities: { he: 'תל אביב', en: 'Tel Aviv', ar: 'تل أبيب', ru: 'Тель-Авив' },
    instruments: ['guitar', 'drums'],
    programType: 'INDIVIDUAL' as const,
  },
  {
    id: 'ps-3',
    schoolSymbol: '87654321',
    names: { he: 'תיכון הראשונים', en: 'Harishonim High School', ar: 'ثانوية هريشونيم', ru: 'Школа ХаРишоним' },
    cities: { he: 'הרצליה', en: 'Herzliya', ar: 'هرتسليا', ru: 'Герцлия' },
    instruments: ['piano', 'cello'],
    programType: 'GROUP' as const,
  },
  {
    id: 'ps-4',
    schoolSymbol: '11223344',
    names: { he: 'בית ספר לאמנויות', en: 'School of Arts', ar: 'مدرسة الفنون', ru: 'Школа искусств' },
    cities: { he: 'ירושלים', en: 'Jerusalem', ar: 'القدس', ru: 'Иерусалим' },
    instruments: ['voice', 'piano', 'violin'],
    programType: 'GROUP' as const,
  },
];

interface PlayingSchoolFinderProps {
  className?: string;
}

export function PlayingSchoolFinder({ className }: PlayingSchoolFinderProps) {
  const t = useTranslations('PlayingSchool.finder');
  const router = useRouter();
  const locale = useLocale() as Locale;
  const isRtl = locale === 'he' || locale === 'ar';

  const [search, setSearch] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState<string>('all');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [submittedLead, setSubmittedLead] = useState(false);

  const allInstruments = useMemo(() => {
    const instruments = new Set<string>();
    mockPartnerships.forEach((p) => p.instruments.forEach((i) => instruments.add(i)));
    return Array.from(instruments).sort();
  }, []);

  const filteredSchools = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockPartnerships.filter((p) => {
      const schoolName = p.names[locale].toLowerCase();
      const city = p.cities[locale].toLowerCase();
      const matchesSearch = !q || schoolName.includes(q) || city.includes(q) || p.schoolSymbol.includes(q);
      const matchesInstrument = selectedInstrument === 'all' || p.instruments.includes(selectedInstrument);
      return matchesSearch && matchesInstrument;
    });
  }, [locale, search, selectedInstrument]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLead(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmittingLead(false);
    setSubmittedLead(true);
    toast({
      title: t('enquirySuccessTitle'),
      description: t('enquirySuccessDesc'),
    });
  };

  return (
    <div className={cn('space-y-12', className)} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
        <div className="group relative md:col-span-2">
          <Search className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-indigo-600" />
          <Input
            placeholder={t('searchPlaceholder')}
            className="h-14 border-slate-200 ps-10 text-lg shadow-xl shadow-indigo-600/5 focus-visible:ring-indigo-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
            <SelectTrigger className="h-14 border-slate-200 bg-white font-semibold text-slate-700 shadow-xl shadow-indigo-600/5 focus:ring-indigo-500/20">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-indigo-400" />
                <SelectValue placeholder={t('filterByInstrument')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allInstruments')}</SelectItem>
              {allInstruments.map((inst) => (
                <SelectItem key={inst} value={inst}>
                  {t(`instruments.${inst}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredSchools.map((school) => (
          <Card
            key={school.id}
            className="group flex flex-col overflow-hidden border-indigo-50 bg-white/80 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <CardHeader className="flex-1">
              <div className="mb-4 flex items-start justify-between">
                <Badge className="border-indigo-100 bg-indigo-50 text-indigo-700 transition-colors hover:bg-indigo-100">
                  {school.programType === 'GROUP' ? t('groupProgram') : t('individualProgram')}
                </Badge>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{school.schoolSymbol}</span>
              </div>
              <CardTitle className="text-2xl font-black text-slate-900 transition-colors group-hover:text-indigo-600">
                {school.names[locale]}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 pt-1 font-semibold text-slate-500">
                <MapPin className="h-4 w-4 text-indigo-400" />
                {school.cities[locale]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Music className="h-3 w-3" />
                  {t('offeredInstruments')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {school.instruments.map((inst) => (
                    <Badge key={inst} variant="outline" className="border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                      {t(`instruments.${inst}`)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="gap-3 pb-6 pt-2">
              <Button
                className="group/btn h-12 flex-1 rounded-xl bg-indigo-600 text-md font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                onClick={() => router.push(`/register/school?token=mock-token-${school.schoolSymbol}`)}
              >
                {isRtl ? (
                  <>
                    {t('applyNow')}
                    <ArrowLeft className="ms-2 h-5 w-5 transition-transform group-hover/btn:-translate-x-1" />
                  </>
                ) : (
                  <>
                    <ArrowRight className="me-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                    {t('applyNow')}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-600"
                title={t('learnMore')}
              >
                <Info className="h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredSchools.length === 0 && (
        <div className="rounded-[40px] border-2 border-dashed border-slate-200/50 bg-slate-50/50 py-24 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
            <School className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{t('noResults')}</h3>
          <p className="mx-auto mt-2 max-w-sm font-medium text-slate-500">{t('noResultsSub')}</p>
        </div>
      )}

      <div className="group relative mt-24 overflow-hidden rounded-[40px] bg-indigo-600 p-12 text-white shadow-2xl shadow-indigo-600/30">
        <Sparkles className="absolute -right-10 -top-10 h-64 w-64 rotate-12 text-white/5 transition-transform duration-1000 group-hover:scale-110" />
        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-4xl font-black leading-tight tracking-tight">{t('interestedTitle')}</h2>
            <p className="text-xl font-medium leading-relaxed text-indigo-100">{t('interestedDesc')}</p>
          </div>

          <div className="lg:col-span-3">
            {submittedLead ? (
              <div className="animate-in zoom-in fade-in space-y-6 rounded-3xl border border-white/20 bg-white/10 p-12 text-center backdrop-blur-md duration-500">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-white">
                  <Sparkles className="h-10 w-10 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold">{t('enquirySuccessTitle')}</h3>
                  <p className="text-xl text-indigo-100">{t('enquirySuccessDesc')}</p>
                </div>
                <Button variant="secondary" onClick={() => setSubmittedLead(false)} className="mt-4 bg-white text-indigo-600 hover:bg-white/90">
                  {t('sendAnotherMessage')}
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleLeadSubmit}
                className="grid grid-cols-1 gap-4 rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-md md:grid-cols-2"
              >
                <Input required placeholder={t('parentName')} className="h-14 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:ring-white/30" />
                <Input required type="email" placeholder={t('parentEmail')} className="h-14 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:ring-white/30" />
                <Input required placeholder={t('parentPhone')} className="h-14 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:ring-white/30" />
                <Input required placeholder={t('childSchoolSymbol')} className="h-14 rounded-xl border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:ring-white/30" />
                <Button
                  type="submit"
                  disabled={isSubmittingLead}
                  variant="secondary"
                  className="h-14 rounded-xl bg-white text-lg font-black text-indigo-600 shadow-xl shadow-black/10 transition-all hover:scale-[1.01] hover:bg-slate-50 md:col-span-2"
                >
                  {isSubmittingLead ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600/30 border-t-indigo-600" />
                      <span>{t('sending')}</span>
                    </div>
                  ) : (
                    t('sendEnquiry')
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
