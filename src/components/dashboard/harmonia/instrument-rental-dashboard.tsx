
'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { InstrumentInventory, InstrumentCondition, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, formatDistanceToNow, addYears } from 'date-fns';
import { he } from 'date-fns/locale';
import { Hand, Undo2 } from 'lucide-react';
import { SignatureCanvas } from '@/components/forms/SignatureCanvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const conditionConfig: Record<InstrumentCondition, { label: string; className: string }> = {
  EXCELLENT: { label: 'מצוין', className: 'bg-green-100 text-green-800' },
  GOOD: { label: 'טוב', className: 'bg-blue-100 text-blue-800' },
  FAIR: { label: 'סביר', className: 'bg-yellow-100 text-yellow-800' },
  NEEDS_REPAIR: { label: 'דורש תיקון', className: 'bg-red-100 text-red-800' },
  RETIRED: { label: 'יצא משימוש', className: 'bg-gray-100 text-gray-800' },
};

function RentInstrumentDialog({
  instrument,
  open,
  onOpenChange,
  onConfirm,
}: {
  instrument: InstrumentInventory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (instrumentId: string, studentId: string, checkoutDetails: { expectedReturnDate: string; parentSignatureUrl: string; depositAmount: number }) => void;
}) {
  const { users } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(format(addYears(new Date(), 1), 'yyyy-MM-dd'));
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [parentSignatureUrl, setParentSignatureUrl] = useState<string | null>(null);

  const students = useMemo(() => users.filter(u => u.role === 'student' && u.approved), [users]);

  // Reset state when opened
  if (!instrument) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>השאלת {instrument.type} - {instrument.brand}</DialogTitle>
          <DialogDescription>
            מלא/י את פרטי ההשאלה והחתם/י את ההורה/תלמיד על המכשיר.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label>תלמיד משאיל</Label>
            <Select dir="rtl" onValueChange={setSelectedStudentId} value={selectedStudentId}>
              <SelectTrigger><SelectValue placeholder="בחר תלמיד/ה..." /></SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>תאריך החזרה משוער</Label>
              <Input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>סכום פיקדון (₪)</Label>
              <Input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>חתימת הורה המאשרת את תנאי האמנה והפיקדון</Label>
            <SignatureCanvas
              onSave={(dataUrl) => setParentSignatureUrl(dataUrl)}
              onClear={() => setParentSignatureUrl(null)}
              width={550}
              height={150}
            />
            {parentSignatureUrl && <p className="text-sm text-green-600 font-medium">החתימה נקלטה בהצלחה.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={() => {
            if (parentSignatureUrl) {
              onConfirm(instrument.id, selectedStudentId, {
                expectedReturnDate,
                parentSignatureUrl: parentSignatureUrl,
                depositAmount
              });
              onOpenChange(false);
              // Reset form
              setParentSignatureUrl(null);
              setSelectedStudentId('');
            }
          }} disabled={!selectedStudentId || !parentSignatureUrl}>
            אשר השאלה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function InstrumentRentalDashboard() {
  const { users, mockInstrumentInventory, assignInstrumentToStudent, returnInstrument } = useAuth();
  const [instrumentToRent, setInstrumentToRent] = useState<InstrumentInventory | null>(null);

  const { available, rented } = useMemo(() => {
    const available = mockInstrumentInventory.filter(inst => !inst.currentRenterId);
    const rented = mockInstrumentInventory.filter(inst => inst.currentRenterId);
    return { available, rented };
  }, [mockInstrumentInventory]);

  return (
    <>
      <Tabs defaultValue="available">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">זמין במלאי ({available.length})</TabsTrigger>
          <TabsTrigger value="rented">מושאל ({rented.length})</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <TabsContent value="available" className="m-0">
            <CardHeader><CardTitle>כלים זמינים להשאלה</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>סוג כלי</TableHead>
                    <TableHead>מותג</TableHead>
                    <TableHead>מספר סידורי</TableHead>
                    <TableHead>מצב</TableHead>
                    <TableHead className="text-left">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {available.map(inst => (
                    <TableRow key={inst.id}>
                      <TableCell>{inst.type}</TableCell>
                      <TableCell>{inst.brand}</TableCell>
                      <TableCell className="font-mono">{inst.serialNumber}</TableCell>
                      <TableCell><Badge className={conditionConfig[inst.condition].className}>{conditionConfig[inst.condition].label}</Badge></TableCell>
                      <TableCell className="text-left"><Button size="sm" onClick={() => setInstrumentToRent(inst)}><Hand className="ms-2 h-4 w-4" />השאלה</Button></TableCell>
                    </TableRow>
                  ))}
                  {available.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center">אין כלים זמינים במלאי.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>
          <TabsContent value="rented" className="m-0">
            <CardHeader><CardTitle>כלים מושאלים</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>סוג כלי</TableHead>
                    <TableHead>מושאל ל...</TableHead>
                    <TableHead>תאריך השאלה</TableHead>
                    <TableHead>מצב</TableHead>
                    <TableHead className="text-left">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rented.map(inst => {
                    const renter = users.find(u => u.id === inst.currentRenterId);
                    return (
                      <TableRow key={inst.id}>
                        <TableCell>{inst.type}</TableCell>
                        <TableCell>{renter?.name || 'לא ידוע'}</TableCell>
                        <TableCell>
                          {inst.rentalStartDate ? format(new Date(inst.rentalStartDate), 'dd/MM/yyyy', { locale: he }) : '-'}
                          <p className="text-xs text-muted-foreground">{inst.rentalStartDate ? `(${formatDistanceToNow(new Date(inst.rentalStartDate), { locale: he, addSuffix: true })})` : ''}</p>
                        </TableCell>
                        <TableCell><Badge className={conditionConfig[inst.condition].className}>{conditionConfig[inst.condition].label}</Badge></TableCell>
                        <TableCell className="text-left"><Button size="sm" variant="outline" onClick={() => returnInstrument(inst.id)}><Undo2 className="ms-2 h-4 w-4" />החזרה</Button></TableCell>
                      </TableRow>
                    )
                  })}
                  {rented.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center">אין כרגע כלים מושאלים.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>
        </Card>
      </Tabs>
      <RentInstrumentDialog
        instrument={instrumentToRent}
        open={!!instrumentToRent}
        onOpenChange={() => setInstrumentToRent(null)}
        onConfirm={assignInstrumentToStudent}
      />
    </>
  );
}
