'use client';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { FormSubmission, FormStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { conservatoriums, instruments } from '@/lib/data';

const ministryViewableStatuses: FormStatus[] = ['מאושר', 'נדרש תיקון', 'מאושר סופית'];

export default function MinistryDashboard() {
  const { user, users, mockFormSubmissions: allForms } = useAuth();
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
      const instrumentMatch = filters.instrument === 'all' || student?.instruments?.some(i => i.instrument === filters.instrument);

      return searchMatch && typeMatch && conservatoriumMatch && gradeMatch && statusMatch && instrumentMatch;
    });
  }, [formsForMinistry, users, searchTerm, filters]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  if (user?.role !== 'ministry_director') {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-destructive">אין לך הרשאה לגשת לעמוד זה</h1>
        <p className="text-muted-foreground">עמוד זה מיועד למנהלי משרד החינוך בלבד.</p>
      </div>
    );
  }

  const formTypes = Array.from(new Set(formsForMinistry.map(f => f.formType)));
  const grades = Array.from(new Set(formsForMinistry.map(f => f.grade).filter(Boolean) as string[])).sort();


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">לוח בקרה - משרד החינוך</h1>
        <p className="text-muted-foreground">צפייה ואישור סופי של טפסים שאושרו על ידי הקונסרבטוריונים.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>סינון טפסים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative col-span-full lg:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="חיפוש לפי שם תלמיד או מזהה טופס..."
                className="w-full rounded-lg bg-background pr-10 text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select dir="rtl" value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger><SelectValue placeholder="סינון לפי סטטוס" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {ministryViewableStatuses.map(s => <SelectItem key={s} value={s}><StatusBadge status={s} /></SelectItem>)}
              </SelectContent>
            </Select>

            <Select dir="rtl" value={filters.formType} onValueChange={(v) => handleFilterChange('formType', v)}>
              <SelectTrigger><SelectValue placeholder="סינון לפי סוג טופס" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל סוגי הטפסים</SelectItem>
                {formTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select dir="rtl" value={filters.conservatorium} onValueChange={(v) => handleFilterChange('conservatorium', v)}>
              <SelectTrigger><SelectValue placeholder="סינון לפי קונסרבטוריון" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקונסרבטוריונים</SelectItem>
                {conservatoriums.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select dir="rtl" value={filters.grade} onValueChange={(v) => handleFilterChange('grade', v)}>
              <SelectTrigger><SelectValue placeholder="סינון לפי כיתה" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הכיתות</SelectItem>
                {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select dir="rtl" value={filters.instrument} onValueChange={(v) => handleFilterChange('instrument', v)}>
              <SelectTrigger><SelectValue placeholder="סינון לפי כלי" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הכלים</SelectItem>
                {instruments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>רשימת טפסים</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>שם התלמיד/ה</TableHead>
                <TableHead>קונסרבטוריון</TableHead>
                <TableHead>סוג הטופס</TableHead>
                <TableHead>כיתה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>תאריך הגשה</TableHead>
                <TableHead className="text-left"><span className="sr-only">פעולות</span></TableHead>
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
                  <TableCell className="text-left">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/forms/${form.id}`}>צפה וטפל</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground p-8">לא נמצאו טפסים התואמים את הסינון.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
