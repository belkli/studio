'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { FormSubmission, FormStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

const exportableStatuses: FormStatus[] = ['מאושר'];

export default function MinistryExportPage() {
  const { user, users, mockFormSubmissions } = useAuth();
  const { toast } = useToast();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const formsForExport = useMemo(() => {
    if (!user) return [];
    return mockFormSubmissions.filter(form => 
        form.conservatoriumId === user.conservatoriumId &&
        exportableStatuses.includes(form.status) &&
        (form.formType === 'רסיטל בגרות' || form.formType === 'הרשמה לבחינה')
    );
  }, [user, mockFormSubmissions]);

  const handleSelectAll = (checked: boolean | string) => {
    if (checked) {
      setSelectedRows(formsForExport.map(f => f.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter(rowId => rowId !== id));
  };

  const handleExport = () => {
    if (selectedRows.length === 0) {
        toast({
            variant: "destructive",
            title: "לא נבחרו טפסים",
            description: "יש לבחור לפחות טופס אחד לייצוא."
        });
        return;
    }

    const selectedForms = formsForExport.filter(f => selectedRows.includes(f.id));
    
    // Simulate CSV generation
    const headers = [
        "Form ID", "Form Type", "Student Name", "Student ID", 
        "Instrument", "Teacher", "Total Duration", "Grade", 
        "Exam Level", "Exam Type"
    ];
    
    const rows = selectedForms.map(form => {
        const student = users.find(u => u.id === form.studentId);
        return [
            form.id,
            form.formType,
            form.studentName,
            student?.idNumber || '',
            form.instrumentDetails?.instrument || form.instrument || '',
            form.teacherDetails?.name || '',
            form.totalDuration,
            form.grade || '',
            form.examLevel || '',
            form.examType || '',
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // This part simulates a file download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `ministry_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    toast({
        title: "ייצוא לקובץ הושלם",
        description: `${selectedRows.length} טפסים יוצאו לקובץ CSV.`
    });
  };


  if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-destructive">אין לך הרשאה לגשת לעמוד זה</h1>
        <p className="text-muted-foreground">עמוד זה מיועד למנהלי קונסרבטוריון בלבד.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ייצוא טפסים למשרד החינוך</h1>
        <p className="text-muted-foreground">בחר את הטפסים המאושרים שברצונך לייצא ולהגיש למשרד החינוך.</p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>טפסים מאושרים המוכנים לייצוא</CardTitle>
            <Button onClick={handleExport} disabled={selectedRows.length === 0}>
                <Download className="ms-2 h-4 w-4" />
                ייצא נבחרים ({selectedRows.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">
                        <Checkbox 
                            onCheckedChange={handleSelectAll} 
                            checked={selectedRows.length === formsForExport.length && formsForExport.length > 0}
                            aria-label="Select all"
                        />
                    </TableHead>
                    <TableHead>שם התלמיד/ה</TableHead>
                    <TableHead>סוג טופס</TableHead>
                    <TableHead>ת.ז.</TableHead>
                    <TableHead>כיתה/רמה</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>תאריך אישור</TableHead>
                    <TableHead className="text-left"><span className="sr-only">פעולות</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {formsForExport.length > 0 ? formsForExport.map((form) => {
                    const student = users.find(u => u.id === form.studentId);
                    return (
                    <TableRow key={form.id} data-state={selectedRows.includes(form.id) ? "selected" : ""}>
                        <TableCell>
                             <Checkbox 
                                onCheckedChange={(checked) => handleRowSelect(form.id, !!checked)}
                                checked={selectedRows.includes(form.id)}
                                aria-label="Select row"
                             />
                        </TableCell>
                        <TableCell className="font-medium">{form.studentName}</TableCell>
                        <TableCell>{form.formType}</TableCell>
                        <TableCell>{student?.idNumber || '-'}</TableCell>
                        <TableCell>{form.grade || form.examLevel || '-'}</TableCell>
                        <TableCell>
                            <StatusBadge status={form.status} />
                        </TableCell>
                        <TableCell>{form.signedAt || new Date(form.submissionDate).toLocaleDateString('he-IL')}</TableCell>
                        <TableCell className="text-left">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/forms/${form.id}`}>צפה</Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                )}) : (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground p-8">לא נמצאו טפסים מאושרים לייצוא.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
        </CardContent>
      </Card>
    </div>
  );
}
