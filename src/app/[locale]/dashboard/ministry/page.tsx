'use client';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations, useLocale } from 'next-intl';
import type { FormStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { StatusBadge } from '@/components/ui/status-badge';
import { userHasInstrument } from '@/lib/instrument-matching';
import { Combobox } from '@/components/ui/combobox';

const ministryViewableStatuses: FormStatus[] = ['APPROVED', 'REVISION_REQUIRED', 'FINAL_APPROVED'];

export default function MinistryDashboard() {
  const { user, users, conservatoriums, conservatoriumInstruments, formSubmissions: allForms } = useAuth();
  const t = useTranslations('Ministry');
  const tc = useTranslations('Common.shared');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    formType: 'all',
    conservatorium: 'all',
    grade: 'all',
    instrument: 'all',
    status: 'all',
  });

  const formsForMinistry = useMemo(() => {
    return allForms.filter(form => ministryViewableStatuses.includes(form.status));
  }, [allForms]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filteredForms = useMemo(() => {
    return formsForMinistry.filter(form => {
      const student = users.find(u => u.id === form.studentId);

      const searchMatch = searchTerm === '' ||
        form.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.id.toLowerCase().includes(searchTerm.toLowerCase());

      const typeMatch = filters.formType === 'all' || form.formType === filters.formType;
      const conservatoriumMatch = filters.conservatorium === 'all' || form.conservatoriumName === filters.conservatorium;
      const gradeMatch = filters.grade === 'all' || form.grade === filters.grade;
      const statusMatch = filters.status === 'all' || form.status === filters.status;
      const instrumentMatch = userHasInstrument(
        (student?.instruments || []).map((i) => i.instrument),
        filters.instrument === 'all' ? undefined : filters.instrument,
        conservatoriumInstruments,
        student?.conservatoriumId,
      );

      return searchMatch && typeMatch && conservatoriumMatch && gradeMatch && statusMatch && instrumentMatch;
    });
  }, [formsForMinistry, users, searchTerm, filters]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  if (user?.role !== 'ministry_director' && user?.role !== 'site_admin') {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-destructive">{t('noPermission')}</h1>
        <p className="text-muted-foreground">{t('noPermissionDesc')}</p>
      </div>
    );
  }

  const formTypes = Array.from(new Set(formsForMinistry.map(f => f.formType)));
  const grades = Array.from(new Set(formsForMinistry.map(f => f.grade).filter(Boolean) as string[])).sort();

  const instrumentOptions = Array.from(
    new Set(
      conservatoriumInstruments
        .map((entry) => entry.names.he || entry.names.en)
        .filter(Boolean)
    )
  );


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboardTitle')}</h1>
        <p className="text-muted-foreground">{t('dashboardSubtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('filterForms')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative col-span-full lg:col-span-2">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-lg bg-background pe-10 text-end"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select dir={isRtl ? 'rtl' : 'ltr'} value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger><SelectValue placeholder={t('filterByStatus')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                {ministryViewableStatuses.map(s => <SelectItem key={s} value={s}><StatusBadge status={s} /></SelectItem>)}
              </SelectContent>
            </Select>

            <Select dir={isRtl ? 'rtl' : 'ltr'} value={filters.formType} onValueChange={(v) => handleFilterChange('formType', v)}>
              <SelectTrigger><SelectValue placeholder={t('filterByFormType')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allFormTypes')}</SelectItem>
                {formTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>

            <Combobox
              options={[
                { value: 'all', label: t('allConservatories') },
                ...conservatoriums.map(c => ({ value: c.name, label: c.name })),
              ]}
              selectedValue={filters.conservatorium}
              onSelectedValueChange={(v) => handleFilterChange('conservatorium', v || 'all')}
              placeholder={t('filterByConservatorium')}
              searchPlaceholder={t('searchPlaceholder')}
              notFoundMessage={t('noFormsFound')}
            />

            <Select dir={isRtl ? 'rtl' : 'ltr'} value={filters.grade} onValueChange={(v) => handleFilterChange('grade', v)}>
              <SelectTrigger><SelectValue placeholder={t('filterByGrade')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allGrades')}</SelectItem>
                {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>

            <Combobox
              options={[
                { value: 'all', label: t('allInstruments') },
                ...instrumentOptions.map(i => ({ value: i, label: i })),
              ]}
              selectedValue={filters.instrument}
              onSelectedValueChange={(v) => handleFilterChange('instrument', v || 'all')}
              placeholder={t('filterByInstrument')}
              searchPlaceholder={t('searchPlaceholder')}
              notFoundMessage={t('noFormsFound')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('formsList')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>{t('studentName')}</TableHead>
                <TableHead>{t('conservatorium')}</TableHead>
                <TableHead>{tc('formType')}</TableHead>
                <TableHead>{tc('grade')}</TableHead>
                <TableHead>{tc('status')}</TableHead>
                <TableHead>{tc('submissionDate')}</TableHead>
                <TableHead className="text-start"><span className="sr-only">{tc('actions')}</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredForms.length > 0 ? filteredForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium truncate">{form.studentName}</TableCell>
                  <TableCell className="truncate">{form.conservatoriumName}</TableCell>
                  <TableCell className="truncate">{form.formType}</TableCell>
                  <TableCell className="truncate">{form.grade || '-'}</TableCell>
                  <TableCell>
                    <StatusBadge status={form.status} />
                  </TableCell>
                  <TableCell>{form.submissionDate}</TableCell>
                  <TableCell className="text-start">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/forms/${form.id}`}>{t('viewAndProcess')}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground p-8">{t('noFormsFound')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
