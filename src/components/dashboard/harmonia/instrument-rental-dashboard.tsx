
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
import { useDateLocale } from '@/hooks/use-date-locale';
import { Hand, Undo2, Plus, Edit, Trash2, MoreVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SignatureCanvas } from '@/components/forms/SignatureCanvas';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const getConditionConfig = (t: any): Record<InstrumentCondition, { label: string; className: string }> => ({
  EXCELLENT: { label: t('conditionExcellent'), className: 'bg-green-100 text-green-800' },
  GOOD: { label: t('conditionGood'), className: 'bg-blue-100 text-blue-800' },
  FAIR: { label: t('conditionFair'), className: 'bg-yellow-100 text-yellow-800' },
  NEEDS_REPAIR: { label: t('conditionNeedsRepair'), className: 'bg-red-100 text-red-800' },
  RETIRED: { label: t('conditionRetired'), className: 'bg-gray-100 text-gray-800' },
});

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
  const t = useTranslations('InstrumentRental');

  const students = useMemo(() => users.filter(u => u.role === 'student' && u.approved), [users]);

  // Reset state when opened
  if (!instrument) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('rentTitlePart1')} {instrument.type} - {instrument.brand}</DialogTitle>
          <DialogDescription>
            {t('rentDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label>{t('renterStudent')}</Label>
            <Select dir="rtl" onValueChange={setSelectedStudentId} value={selectedStudentId}>
              <SelectTrigger><SelectValue placeholder={t('selectStudentPlaceholder')} /></SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('expectedReturnDate')}</Label>
              <Input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('depositAmount')}</Label>
              <Input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('parentSignatureLabel')}</Label>
            <SignatureCanvas
              onSave={(dataUrl) => setParentSignatureUrl(dataUrl)}
              onClear={() => setParentSignatureUrl(null)}
              width={550}
              height={150}
            />
            {parentSignatureUrl && <p className="text-sm text-green-600 font-medium">{t('signatureCaptured')}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('cancelBtn')}</Button>
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
            {t('confirmRentalBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InstrumentFormDialog({
  instrument,
  open,
  onOpenChange,
  onSave,
}: {
  instrument?: InstrumentInventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<InstrumentInventory>) => void;
}) {
  const [type, setType] = useState(instrument?.type || '');
  const [brand, setBrand] = useState(instrument?.brand || '');
  const [serialNumber, setSerialNumber] = useState(instrument?.serialNumber || '');
  const [condition, setCondition] = useState<InstrumentCondition>(instrument?.condition || 'GOOD');
  const t = useTranslations('InstrumentRental');
  const conditionConfig = getConditionConfig(t);

  // Reset form when opened or instrument changes
  useEffect(() => {
    if (open) {
      setType(instrument?.type || '');
      setBrand(instrument?.brand || '');
      setSerialNumber(instrument?.serialNumber || '');
      setCondition(instrument?.condition || 'GOOD');
    }
  }, [open, instrument]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>{instrument ? t('editInstrumentTitle') : t('addInstrumentTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('instrumentType')}</Label>
            <Input value={type} onChange={e => setType(e.target.value)} placeholder={t('instrumentTypePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('brandManufacturer')}</Label>
            <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder={t('brandPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('serialNumber')}</Label>
            <Input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('condition')}</Label>
            <Select dir="rtl" value={condition} onValueChange={(val: InstrumentCondition) => setCondition(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(conditionConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('cancelBtn')}</Button>
          <Button onClick={() => {
            onSave({ type, brand, serialNumber, condition });
            onOpenChange(false);
          }} disabled={!type || !brand}>{instrument ? t('saveChangesBtn') : t('addInstrumentBtn')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InstrumentRentalDashboard() {
  const { users, mockInstrumentInventory, assignInstrumentToStudent, returnInstrument, addInstrument, updateInstrument, deleteInstrument } = useAuth();
  const [instrumentToRent, setInstrumentToRent] = useState<InstrumentInventory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<InstrumentInventory | undefined>(undefined);
  const t = useTranslations('InstrumentRental');
  const dateLocale = useDateLocale();
  const conditionConfig = getConditionConfig(t);

  const { available, rented } = useMemo(() => {
    const available = mockInstrumentInventory.filter(inst => !inst.currentRenterId);
    const rented = mockInstrumentInventory.filter(inst => inst.currentRenterId);
    return { available, rented };
  }, [mockInstrumentInventory]);

  return (
    <>
      <Tabs defaultValue="available">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">{t('availableInStock')} {available.length})</TabsTrigger>
          <TabsTrigger value="rented">{t('rentedOut')} {rented.length})</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <TabsContent value="available" className="m-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('availableInstrumentsToRent')}</CardTitle>
              <Button onClick={() => { setEditingInst(undefined); setIsFormOpen(true); }}>
                <Plus className="me-2 h-4 w-4" />
                {t('addInstrumentHeaderBtn')}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('instrumentType')}</TableHead>
                    <TableHead>{t('brandManufacturer')}</TableHead>
                    <TableHead>{t('serialNumber')}</TableHead>
                    <TableHead>{t('condition')}</TableHead>
                    <TableHead className="text-left">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {available.map(inst => (
                    <TableRow key={inst.id}>
                      <TableCell>{inst.type}</TableCell>
                      <TableCell>{inst.brand}</TableCell>
                      <TableCell className="font-mono">{inst.serialNumber}</TableCell>
                      <TableCell><Badge className={conditionConfig[inst.condition].className}>{conditionConfig[inst.condition].label}</Badge></TableCell>
                      <TableCell className="text-left flex items-center justify-end gap-2">
                        <Button size="sm" onClick={() => setInstrumentToRent(inst)}><Hand className="ms-2 h-4 w-4" />{t('rentBtn')}</Button>
                        <DropdownMenu dir="rtl">
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingInst(inst); setIsFormOpen(true); }}><Edit className="me-2 h-4 w-4" /> {t('editBtn')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(t('confirmDelete'))) deleteInstrument(inst.id); }}><Trash2 className="me-2 h-4 w-4" /> {t('deleteBtn')}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {available.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center">{t('noAvailableInstruments')}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>
          <TabsContent value="rented" className="m-0">
            <CardHeader><CardTitle>{t('rentedInstruments')}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('instrumentType')}</TableHead>
                    <TableHead>{t('rentedTo')}</TableHead>
                    <TableHead>{t('rentalDate')}</TableHead>
                    <TableHead>{t('condition')}</TableHead>
                    <TableHead className="text-left">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rented.map(inst => {
                    const renter = users.find(u => u.id === inst.currentRenterId);
                    return (
                      <TableRow key={inst.id}>
                        <TableCell>{inst.type}</TableCell>
                        <TableCell>{renter?.name || t('unknown')}</TableCell>
                        <TableCell>
                          {inst.rentalStartDate ? format(new Date(inst.rentalStartDate), 'PP', { locale: dateLocale }) : '-'}
                          <p className="text-xs text-muted-foreground">{inst.rentalStartDate ? `(${formatDistanceToNow(new Date(inst.rentalStartDate), { locale: dateLocale, addSuffix: true })})` : ''}</p>
                        </TableCell>
                        <TableCell><Badge className={conditionConfig[inst.condition].className}>{conditionConfig[inst.condition].label}</Badge></TableCell>
                        <TableCell className="text-left"><Button size="sm" variant="outline" onClick={() => returnInstrument(inst.id)}><Undo2 className="ms-2 h-4 w-4" />{t('returnBtn')}</Button></TableCell>
                      </TableRow>
                    )
                  })}
                  {rented.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center">{t('noRentedInstruments')}</TableCell></TableRow>}
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

      <InstrumentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        instrument={editingInst}
        onSave={(data) => {
          if (editingInst) {
            updateInstrument(editingInst.id, data);
          } else {
            addInstrument(data);
          }
        }}
      />
    </>
  );
}
